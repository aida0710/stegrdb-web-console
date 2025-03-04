import type {ConnectionInfo, ConnectionResponse} from '@/types/database';

import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {v4 as uuidv4} from 'uuid';

import {createPoolConfig, endPool, getPool} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24, // 24時間
    path: '/',
} as const;

// レスポンスヘルパー関数
const createResponse = (
    success: boolean,
    message: string,
    options?: {
        error?: string;
        sessionId?: string;
        details?: ConnectionResponse['details'];
        status?: number;
    },
): NextResponse<ConnectionResponse> => {
    const response: ConnectionResponse = {
        success,
        message,
        ...(options?.error && {error: options.error}),
        ...(options?.sessionId && {sessionId: options.sessionId}),
        ...(options?.details && {details: options.details}),
    };

    return NextResponse.json(response, {
        status: options?.status || (success ? 200 : 500),
    });
};

// PostgreSQLエラーコードの定義
const PG_ERROR_CODES = {
    INVALID_PASSWORD: '28P01',
    CONNECTION_REFUSED: 'ECONNREFUSED',
} as const;

// エラーステータスコードのマッピング
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
        const sessionId = uuidv4();
        const pool = await getPool(sessionId, config);

        try {
            client = await pool.connect();
            const versionResult = await client.query('SELECT version()');

            const cookieStore = await cookies();

            cookieStore.set({
                name: COOKIE_NAME,
                value: sessionId,
                ...COOKIE_OPTIONS,
            });

            return createResponse(true, 'データベースへの接続に成功しました', {
                sessionId,
                details: {
                    serverVersion: versionResult.rows[0].version,
                    connectedAt: new Date(),
                    timeout: COOKIE_OPTIONS.maxAge,
                },
            });
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

        return createResponse(false, errorMessage, {
            error: error.message,
            status: statusCode,
        });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<ConnectionResponse>> {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        if (!sessionId) {
            return createResponse(true, '接続は既に終了しています');
        }

        await endPool(sessionId);

        // Cookie を削除
        cookieStore.delete({
            name: COOKIE_NAME,
            path: '/',
        });

        // キャッシュをクリアするためのヘッダーを追加
        const headers = new Headers();

        headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.append('Pragma', 'no-cache');
        headers.append('Expires', '0');

        return createResponse(true, '接続を終了しました');
    } catch (error: any) {
        console.error('PostgreSQL disconnect error:', {
            message: error.message,
            stack: error.stack,
        });

        return createResponse(false, '接続の終了に失敗しました', {
            error: error.message,
            status: 500,
        });
    }
}
