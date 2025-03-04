import type {ConnectionResponse} from '@/types/database';

import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';

import {pools} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';

export async function GET(request: NextRequest): Promise<NextResponse<ConnectionResponse>> {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        if (!sessionId) {
            return NextResponse.json({success: false, message: 'セッションが見つかりません'}, {status: 401});
        }

        const pool = pools.get(sessionId);

        if (!pool) {
            return NextResponse.json({success: false, message: '接続プールが見つかりません'}, {status: 401});
        }

        // 実際の接続テストを行う
        const client = await pool.connect();

        try {
            await client.query('SELECT 1');

            return NextResponse.json({
                success: true,
                message: '接続は有効です',
            });
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
            {status: 500},
        );
    }
}
