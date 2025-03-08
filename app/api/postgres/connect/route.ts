import type {ConnectionInfo, ConnectionResponse} from '@/types/database';

import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {v4 as uuidv4} from 'uuid';

import {createPoolConfig, endPool, getPool} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 86400,
    path: '/',
};

function setCookie<T>(response: NextResponse<T>, sessionId: string): NextResponse<T> {
    // よりロバストなCookie設定処理
    const expires = new Date(Date.now() + COOKIE_OPTIONS.maxAge * 1000);

    // 明示的に全属性を設定
    response.cookies.set({
        name: COOKIE_NAME,
        value: sessionId,
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        path: COOKIE_OPTIONS.path,
        maxAge: COOKIE_OPTIONS.maxAge,
        expires
    });

    // デバッグのため、生のヘッダー形式も表示
    const cookieValue = `${COOKIE_NAME}=${sessionId}; Path=${COOKIE_OPTIONS.path}; Expires=${expires.toUTCString()}; Max-Age=${COOKIE_OPTIONS.maxAge}; HttpOnly${COOKIE_OPTIONS.secure ? '; Secure' : ''}; SameSite=${COOKIE_OPTIONS.sameSite}`;
    console.log(`[connect] Raw cookie string: ${cookieValue}`);

    // セキュリティのため、セッションの一部だけをログに記録
    console.log(`[connect] Setting session cookie: ${sessionId.substring(0, 8)}... expires: ${expires.toISOString()}`);

    return response;
}

function verifyCookie(response: NextResponse): boolean {
    // Cookie設定を確認
    const setCookieHeader = response.headers.get('Set-Cookie');
    if (!setCookieHeader || !setCookieHeader.includes(COOKIE_NAME)) {
        console.error('[connect] Cookie header not set properly:', setCookieHeader);
        return false;
    }

    return true;
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
                // 既存のセッションがある場合、明示的に終了
                await endPool(sessionId);
                console.log(`[connect] Ended existing session: ${sessionId.substring(0, 8)}...`);
            } catch (error) {
                console.warn(`[connect] Failed to end existing session: ${sessionId.substring(0, 8)}...`, error);
            }
        }

        // 新しいセッションIDを生成
        sessionId = uuidv4();
        console.log(`[connect] Created new session: ${sessionId.substring(0, 8)}...`);

        // 接続プールを作成
        const pool = await getPool(sessionId, config);

        try {
            client = await pool.connect();

            // アプリケーション名を設定してコネクションを識別しやすくする
            await client.query(`SET application_name TO 'rdb-web-console-${sessionId.substring(0, 8)}'`);

            // バージョン情報を取得
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

            // キャッシュを無効化
            response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            response.headers.set('Pragma', 'no-cache');
            response.headers.set('Expires', '0');

            // Cookieを設定
            const cookieResponse = setCookie<ConnectionResponse>(response, sessionId);

            // Cookie設定を検証
            if (!verifyCookie(cookieResponse)) {
                console.error('[connect] Failed to set cookie properly');
            }

            return cookieResponse;
        } finally {
            if (client) client.release();
        }
    } catch (error: any) {
        console.error('[connect] PostgreSQL connection error:', {
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
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

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
        console.log(`[connect] Ended session: ${sessionId.substring(0, 8)}...`);

        const response = NextResponse.json<ConnectionResponse>(
            {
                success: true,
                message: '接続を終了しました',
            },
            {status: 200},
        );

        // よりロバストなCookie削除処理
        response.cookies.set({
            name: COOKIE_NAME,
            value: '',
            httpOnly: true,
            secure: COOKIE_OPTIONS.secure,
            sameSite: COOKIE_OPTIONS.sameSite,
            path: '/',
            maxAge: 0,
            expires: new Date(0)
        });

        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    } catch (error: any) {
        console.error('[connect] PostgreSQL disconnect error:', {
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