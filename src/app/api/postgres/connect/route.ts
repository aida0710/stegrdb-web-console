import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {createPoolConfig, getPool} from '@/lib/db';
import type {ConnectionInfo} from '@/types/database';
import {v4 as uuidv4} from 'uuid';

// セッションCookieの設定
const COOKIE_NAME = 'postgres-session';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24, // 24時間
};

export async function POST(request: NextRequest) {
    try {
        const connectionInfo: ConnectionInfo = await request.json();

        // 接続設定の作成
        const config = createPoolConfig(connectionInfo);

        // セッションIDの生成
        const sessionId = uuidv4();

        // 接続プールの取得（この過程で接続テストも行われる）
        await getPool(sessionId, config);

        // セッションCookieの設定
        cookies().set(COOKIE_NAME, sessionId, COOKIE_OPTIONS);

        return NextResponse.json({
            success: true,
            message: 'データベースへの接続に成功しました',
            sessionId,
        });
    } catch (error) {
        console.error('PostgreSQL connection error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'データベースへの接続に失敗しました',
                error: error instanceof Error ? error.message : '不明なエラーが発生しました',
            },
            {status: 500},
        );
    }
}

// 接続終了処理
export async function DELETE(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        if (sessionId) {
            const {endPool} = await import('@/lib/db');
            await endPool(sessionId);
            cookieStore.delete(COOKIE_NAME);
        }

        return NextResponse.json({
            success: true,
            message: '接続を終了しました',
        });
    } catch (error) {
        console.error('PostgreSQL disconnect error:', error);

        return NextResponse.json(
            {
                success: false,
                message: '接続の終了に失敗しました',
                error: error instanceof Error ? error.message : '不明なエラーが発生しました',
            },
            {status: 500},
        );
    }
}
