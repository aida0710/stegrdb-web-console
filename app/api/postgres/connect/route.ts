import type {ConnectionInfo, ConnectionResponse} from '@/types/database';

import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {v4 as uuidv4} from 'uuid';

import {createPoolConfig, endPool, getPool} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
} as const;

function setCookie<T>(response: NextResponse<T>, sessionId: string): NextResponse<T> {
    const cookieValue = `${COOKIE_NAME}=${sessionId}; Path=${COOKIE_OPTIONS.path}; Max-Age=${COOKIE_OPTIONS.maxAge}; HttpOnly; ${COOKIE_OPTIONS.secure ? 'Secure; ' : ''}SameSite=${COOKIE_OPTIONS.sameSite}`;

    response.headers.set('Set-Cookie', cookieValue);
    console.log(`Setting cookie: ${cookieValue.substring(0, 30)}...`);

    return response;
}

const PG_ERROR_CODES = {
    INVALID_PASSWORD: '28P01',
    CONNECTION_REFUSED: 'ECONNREFUSED',
} as const;

const getErrorStatusCode = (error: any): number => {
    if (error.code === PG_ERROR_CODES.INVALID_PASSWORD) return 401;
    if (error.code === PG_ERROR_CODES.CONNECTION_REFUSED) return 503;
    return 500;
};

export async function POST(request: NextRequest): Promise<NextResponse<ConnectionResponse>> {
    let client = null;

    try {
        const connectionInfo: ConnectionInfo = await request.json();
        const config = createPoolConfig(connectionInfo);

        const cookieStore = await cookies();
        let sessionId = cookieStore.get(COOKIE_NAME)?.value;

        if (sessionId) {
            try {
                await endPool(sessionId);
                console.log(`Ended existing session: ${sessionId}`);
            } catch (error) {
                console.warn(`Failed to end existing session: ${sessionId}`, error);
            }
        }

        sessionId = uuidv4();
        console.log(`Created new session: ${sessionId}`);

        const pool = await getPool(sessionId, config);

        try {
            client = await pool.connect();
            const versionResult = await client.query('SELECT version()');

            const responseBody: ConnectionResponse = {
                success: true,
                message: 'データベースへの接続に成功しました',
                sessionId: sessionId,
                details: {
                    serverVersion: versionResult.rows[0].version,
                    connectedAt: new Date(),
                    timeout: COOKIE_OPTIONS.maxAge,
                },
            };

            const response = NextResponse.json(responseBody, {status: 200});
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            response.headers.set('Pragma', 'no-cache');
            response.headers.set('Expires', '0');

            return setCookie<ConnectionResponse>(response, sessionId);
        } finally {
            if (client) client.release();
        }
    } catch (error: any) {
        console.error('PostgreSQL connection error:', {
            code: error.code,
            message: error.message,
            detail: error.detail,
        });

        const statusCode = getErrorStatusCode(error);
        const errorMessage = statusCode === 401 ? '認証に失敗しました。ユーザー名とパスワードを確認してください。' : 'データベースへの接続に失敗しました';

        const response = NextResponse.json<ConnectionResponse>(
            {
                success: false,
                message: errorMessage,
                error: error.message,
            },
            {status: statusCode},
        );

        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

        return response;
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ConnectionResponse>> {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        if (!sessionId) {
            return NextResponse.json<ConnectionResponse>(
                {
                    success: true,
                    message: '接続は既に終了しています',
                },
                {status: 200},
            );
        }

        await endPool(sessionId);
        console.log(`Ended session: ${sessionId}`);

        const response = NextResponse.json<ConnectionResponse>(
            {
                success: true,
                message: '接続を終了しました',
            },
            {status: 200},
        );

        response.headers.set(
            'Set-Cookie',
            `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${COOKIE_OPTIONS.secure ? 'Secure; ' : ''}SameSite=${COOKIE_OPTIONS.sameSite}`,
        );

        return response;
    } catch (error: any) {
        console.error('PostgreSQL disconnect error:', {
            message: error.message,
            stack: error.stack,
        });

        return NextResponse.json<ConnectionResponse>(
            {
                success: false,
                message: '接続の終了に失敗しました',
                error: error.message,
            },
            {status: 500},
        );
    }
}
