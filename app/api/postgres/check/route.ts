import type {ConnectionResponse} from '@/types/database';

import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';

import {pools} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';

export async function GET(request: NextRequest): Promise<NextResponse<ConnectionResponse>> {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        console.log(`Checking session: ${sessionId || 'not found'}`);

        if (!sessionId) {
            return NextResponse.json(
                {success: false, message: 'セッションが見つかりません'},
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

        const pool = pools.get(sessionId);

        if (!pool) {
            console.log(`No pool found for session: ${sessionId}`);
            return NextResponse.json(
                {success: false, message: '接続プールが見つかりません'},
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

        // 実際の接続テストを行う
        const client = await pool.connect();

        try {
            const result = await client.query('SELECT 1 as connected, version()');
            console.log(`Session ${sessionId} is valid`);

            const now = new Date();
            return NextResponse.json(
                {
                    success: true,
                    message: '接続は有効です',
                    details: {
                        serverVersion: result.rows[0].version,
                        connectedAt: now,
                        timeout: 86400,
                        connected: result.rows[0].connected === 1,
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
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Connection check error:', error);

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
