import {Pool, PoolConfig} from 'pg';
import type {ConnectionInfo} from '@/types/database';

// コネクションプールの保存用マップ
const pools = new Map<string, Pool>();

// 接続情報からプールConfigを生成
export const createPoolConfig = (info: ConnectionInfo): PoolConfig => ({
    host: info.host,
    port: parseInt(info.port),
    database: info.database,
    user: info.username,
    password: info.password,
    max: 20, // 最大接続数
    idleTimeoutMillis: 30000, // アイドルタイムアウト
    connectionTimeoutMillis: 2000, // 接続タイムアウト
});

// セッションIDに基づいてプールを取得または作成
export const getPool = async (sessionId: string, config: PoolConfig): Promise<Pool> => {
    if (!pools.has(sessionId)) {
        const pool = new Pool(config);

        // 接続テスト
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
        } catch (error) {
            pool.end();
            throw error;
        }

        pools.set(sessionId, pool);
    }

    return pools.get(sessionId)!;
};

// プールの終了
export const endPool = async (sessionId: string): Promise<void> => {
    const pool = pools.get(sessionId);
    if (pool) {
        await pool.end();
        pools.delete(sessionId);
    }
};

// すべてのプールを終了
export const endAllPools = async (): Promise<void> => {
    for (const [sessionId, pool] of pools.entries()) {
        await pool.end();
        pools.delete(sessionId);
    }
};

// 接続テスト用関数
export const testConnection = async (config: PoolConfig): Promise<void> => {
    const pool = new Pool(config);
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
    } finally {
        await pool.end();
    }
};
