import type {ConnectionInfo} from '@/types/database';

import {Pool, PoolConfig} from 'pg';

export const pools = new Map<string, Pool>();

const DEFAULT_CONFIG = {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    allowExitOnIdle: true,
    application_name: 'rdb-web-console',
};

/**
 * Creates a pool configuration from the connection info
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
 * Gets or creates a connection pool for the given session
 */
export const getPool = async (sessionId: string, config: PoolConfig): Promise<Pool> => {
    const existingPool = pools.get(sessionId);

    if (existingPool) {
        try {
            const client = await existingPool.connect();

            await client.query('SELECT 1');
            client.release();

            return existingPool;
        } catch (error: any) {
            console.warn('Existing pool failed health check, creating new pool:', error.message);
            await endPool(sessionId);
        }
    }

    const pool = new Pool(config);

    try {
        const client = await pool.connect();

        await client.query('SELECT 1');
        client.release();

        pools.set(sessionId, pool);

        // Set up error handler
        pool.on('error', (err: Error) => {
            console.error(`Pool error for session ${sessionId}:`, err);
            endPool(sessionId).catch(console.error);
        });

        return pool;
    } catch (error) {
        await pool.end();
        throw error;
    }
};

/**
 * Gets an existing pool for the given session, or null if it doesn't exist
 */
export const getExistingPool = (sessionId: string): Pool | null => {
    return pools.get(sessionId) || null;
};

/**
 * Ends a connection pool for the given session
 */
export const endPool = async (sessionId: string): Promise<void> => {
    const pool = pools.get(sessionId);

    if (pool) {
        await pool.end();
        pools.delete(sessionId);
    }
};

/**
 * Ends all connection pools
 */
export const endAllPools = async (): Promise<void> => {
    const poolEndPromises = Array.from(pools.entries()).map(async ([sessionId, pool]) => {
        try {
            await pool.end();
        } catch (error) {
            console.error(`Failed to end pool ${sessionId}:`, error);
        } finally {
            pools.delete(sessionId);
        }
    });

    await Promise.all(poolEndPromises);
};

/**
 * Executes a query on the database
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
