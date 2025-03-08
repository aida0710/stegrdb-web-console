import type {ConnectionInfo} from '@/types/database';

import {Pool, PoolConfig} from 'pg';

export const pools = new Map<string, Pool>();

// 接続プールのデフォルト設定を改善
const DEFAULT_CONFIG = {
    max: 20, // 最大コネクション数
    idleTimeoutMillis: 60000, // アイドルタイムアウトを30秒から60秒に延長
    connectionTimeoutMillis: 5000, // 接続タイムアウトを2秒から5秒に延長
    allowExitOnIdle: false, // アイドル終了を防止
    application_name: 'rdb-web-console', // アプリケーション名
    keepAlive: true, // キープアライブを有効化
    keepAliveInitialDelayMillis: 10000, // キープアライブの初期遅延
};

/**
 * 接続情報からプール設定を作成する
 */
export const createPoolConfig = (info: ConnectionInfo): PoolConfig => {
    if (!info.host || !info.port || !info.database || !info.username) {
        throw new Error('Missing required connection parameters');
    }

    return {
        ...DEFAULT_CONFIG,
        host: info.host.trim(),
        port: parseInt(info.port, 10),
        database: info.database.trim(),
        user: info.username.trim(),
        password: info.password,
    };
};

/**
 * 指定したセッション用の接続プールを取得または作成する
 */
export const getPool = async (sessionId: string, config: PoolConfig): Promise<Pool> => {
    const existingPool = pools.get(sessionId);

    if (existingPool) {
        try {
            // 既存プールの健全性チェック
            const client = await existingPool.connect();
            await client.query('SELECT 1');
            client.release();

            console.log(`[pool] Using existing pool for session ${sessionId.substring(0, 8)}...`);
            return existingPool;
        } catch (error: any) {
            console.warn(`[pool] Existing pool failed health check, creating new pool:`, error.message);
            await endPool(sessionId);
        }
    }

    // 新しいプールを作成
    console.log(`[pool] Creating new pool for session ${sessionId.substring(0, 8)}...`);
    const pool = new Pool(config);

    try {
        // 接続テスト
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        // プールをマップに保存
        pools.set(sessionId, pool);

        // エラーハンドラを設定
        pool.on('error', (err: Error) => {
            console.error(`[pool] Pool error for session ${sessionId.substring(0, 8)}:`, err);

            // エラーが発生したプールを終了しない - 代わりに再接続を試みる
            pool.on('connect', (client) => {
                console.log(`[pool] Client connected after error for session ${sessionId.substring(0, 8)}`);
            });
        });

        // 接続/切断イベントを監視
        pool.on('connect', (client) => {
            console.log(`[pool] New client connected for session ${sessionId.substring(0, 8)}`);

            // クライアントレベルのエラーハンドラ
            client.on('error', (err) => {
                console.error(`[pool] Client connection error for session ${sessionId.substring(0, 8)}:`, err);
            });
        });

        pool.on('remove', () => {
            console.log(`[pool] Client connection removed from pool for session ${sessionId.substring(0, 8)}`);
        });

        return pool;
    } catch (error) {
        // プール作成に失敗した場合はクリーンアップ
        try {
            await pool.end();
        } catch (endError) {
            console.error(`[pool] Failed to end pool after creation error:`, endError);
        }
        throw error;
    }
};

/**
 * 指定したセッションの既存プールを取得する
 */
export const getExistingPool = (sessionId: string): Pool | null => {
    return pools.get(sessionId) || null;
};

/**
 * 指定したセッションの接続プールを終了する
 */
export const endPool = async (sessionId: string): Promise<void> => {
    const pool = pools.get(sessionId);

    if (pool) {
        try {
            console.log(`[pool] Ending pool for session ${sessionId.substring(0, 8)}...`);
            await pool.end();
            console.log(`[pool] Pool ended successfully for session ${sessionId.substring(0, 8)}`);
        } catch (error) {
            console.error(`[pool] Error ending pool for session ${sessionId.substring(0, 8)}:`, error);
        } finally {
            pools.delete(sessionId);
        }
    } else {
        console.log(`[pool] No pool found to end for session ${sessionId.substring(0, 8)}`);
    }
};

/**
 * すべての接続プールを終了する
 */
export const endAllPools = async (): Promise<void> => {
    const poolEndPromises = Array.from(pools.entries()).map(async ([sessionId, pool]) => {
        try {
            console.log(`[pool] Ending pool for session ${sessionId.substring(0, 8)}...`);
            await pool.end();
        } catch (error) {
            console.error(`[pool] Failed to end pool ${sessionId.substring(0, 8)}:`, error);
        } finally {
            pools.delete(sessionId);
        }
    });

    await Promise.all(poolEndPromises);
    console.log(`[pool] All pools ended. Remaining pools: ${pools.size}`);
};

/**
 * データベースでクエリを実行する
 */
export const executeQuery = async (sessionId: string, query: string): Promise<any> => {
    const pool = pools.get(sessionId);

    if (!pool) {
        throw new Error('No active database connection');
    }

    const client = await pool.connect();

    try {
        return await client.query(query);
    } finally {
        client.release();
    }
};
