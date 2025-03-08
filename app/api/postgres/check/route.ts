import type {ConnectionResponse} from '@/types/database';
import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createPoolConfig, getPool, pools} from '@/lib/database/connection-manager';
import {useConnectionStore} from '@/lib/utils/connection-store';

const COOKIE_NAME = 'postgres-session';

export async function GET(request: NextRequest): Promise<NextResponse<ConnectionResponse>> {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        console.log(`[check] Checking session: ${sessionId ? sessionId.substring(0, 8) + '...' : 'not found'}`);
        console.log(
            `[check] All cookies:`,
            Array.from(cookieStore.getAll()).map((c) => c.name),
        );

        if (!sessionId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'セッションが見つかりません',
                    diagnostics: {
                        hasCookies: cookieStore.size > 0,
                        availableCookies: Array.from(cookieStore.getAll()).map((c) => c.name),
                    },
                },
                {
                    status: 401,
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                },
            );
        }

        let pool = pools.get(sessionId);
        console.log(`[check] Pool exists for session: ${!!pool}`);

        // Auto-reconnect logic - if we have connection info but pool is gone
        if (!pool) {
            // Try to get connection info from the store
            const connectionStore = useConnectionStore.getState();
            const activeConnName = connectionStore.activeConnection;

            if (activeConnName) {
                const connectionInfo = connectionStore.getConnection(activeConnName);
                if (connectionInfo) {
                    console.log(`[check] Attempting to reconnect using stored credentials for: ${activeConnName}`);

                    try {
                        const config = createPoolConfig(connectionInfo);
                        pool = await getPool(sessionId, config);
                        console.log(`[check] Successfully recreated pool for session: ${sessionId.substring(0, 8)}...`);
                    } catch (reconnectErr) {
                        console.error('[check] Failed to reconnect:', reconnectErr);
                    }
                }
            }

            // If we still don't have a pool
            if (!pool) {
                console.log(`[check] No pool found for session: ${sessionId.substring(0, 8)}...`);
                return NextResponse.json(
                    {
                        success: false,
                        message: '接続プールが見つかりません',
                        diagnostics: {
                            sessionId: sessionId.substring(0, 8) + '...',
                            poolCount: pools.size,
                            activeConnection: activeConnName || 'none',
                        },
                    },
                    {
                        status: 401,
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            Pragma: 'no-cache',
                            Expires: '0',
                        },
                    },
                );
            }
        }

        // 実際の接続テストを行う
        const client = await pool.connect();

        try {
            // デフォルトよりタイムアウトを長く設定
            await client.query('SET statement_timeout TO 30000');

            const result = await client.query('SELECT 1 as connected, version()');
            console.log(`[check] Session ${sessionId.substring(0, 8)}... is valid`);

            // タイムアウトをリセット
            await client.query('RESET statement_timeout');

            const now = new Date();

            // 有効なセッションを返す際にもCookieを再設定して期限を更新
            const response = NextResponse.json(
                {
                    success: true,
                    message: '接続は有効です',
                    details: {
                        serverVersion: result.rows[0].version,
                        connectedAt: now,
                        timeout: 86400,
                        connected: result.rows[0].connected === 1,
                        poolInfo: {
                            sessionId: sessionId.substring(0, 8) + '...',
                            totalConnections: pools.size,
                        },
                    },
                },
                {
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                },
            );

            // 有効なセッションに対しても、Cookieを再設定して有効期限を更新
            response.cookies.set({
                name: COOKIE_NAME,
                value: sessionId,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 86400, // 24時間
            });

            return response;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('[check] Connection check error:', error);

        return NextResponse.json(
            {
                success: false,
                message: '接続の確認中にエラーが発生しました',
                error: error instanceof Error ? error.message : '不明なエラーが発生しました',
            },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            },
        );
    }
}