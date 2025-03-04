import {pools} from '@/lib/database/connection-manager';

export interface QueryResult {
    rows: any[];
    fields: {
        name: string;
        dataTypeID: number;
        tableID: number;
    }[];
    rowCount: number;
    command: string;
    executionTime: number;
}

export interface QueryOptions {
    timeout?: number;
    maxRows?: number;
    logQuery?: boolean;
}

const DEFAULT_OPTIONS: QueryOptions = {
    timeout: 30000, // 30秒
    maxRows: 1000, // 最大1000行
    logQuery: process.env.NODE_ENV === 'development',
};

/**
 * データベースクエリを実行する関数
 */
export async function executeQuery(sessionId: string, query: string, options: QueryOptions = {}): Promise<QueryResult> {
    const startTime = Date.now();
    const mergedOptions = {...DEFAULT_OPTIONS, ...options};

    // セッションIDから接続プールを取得
    const pool = pools.get(sessionId);

    if (!pool) {
        throw new Error('アクティブなデータベース接続がありません。再ログインしてください。');
    }

    // 開発環境の場合、クエリをログに出力
    if (mergedOptions.logQuery) {
        console.log(`[Query] Executing: ${query}`);
    }

    // クエリを実行
    const client = await pool.connect();

    try {
        // タイムアウト設定
        if (mergedOptions.timeout) {
            await client.query(`SET statement_timeout TO ${mergedOptions.timeout}`);
        }

        // クエリ実行
        const result = await client.query(query);
        const executionTime = Date.now() - startTime;

        if (result.rowCount === null) {
            console.log('result.rowCount is null');

            return {
                rows: [],
                fields: [],
                rowCount: 0,
                command: result.command,
                executionTime,
            };
        }

        // 結果を整形して返す
        return {
            rows: mergedOptions.maxRows && result.rows.length > mergedOptions.maxRows ? result.rows.slice(0, mergedOptions.maxRows) : result.rows,
            fields: result.fields.map((field) => ({
                name: field.name,
                dataTypeID: field.dataTypeID,
                tableID: field.tableID,
            })),
            rowCount: result.rowCount,
            command: result.command,
            executionTime,
        };
    } finally {
        // タイムアウト設定をリセット
        if (mergedOptions.timeout) {
            try {
                await client.query('RESET statement_timeout');
            } catch (error) {
                // リセットに失敗しても続行
                console.warn('Failed to reset statement_timeout:', error);
            }
        }
        client.release();
    }
}

/**
 * データベースからテーブル一覧を取得する関数
 */
export async function listTables(sessionId: string): Promise<string[]> {
    const result = await executeQuery(
        sessionId,
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = 'public' 
         ORDER BY table_name`,
    );

    return result.rows.map((row) => row.table_name);
}

/**
 * データベースからテーブルの構造を取得する関数
 */
export async function getTableStructure(sessionId: string, tableName: string): Promise<any[]> {
    const result = await executeQuery(
        sessionId,
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name = '${tableName}'
         AND table_schema = 'public'
         ORDER BY ordinal_position`,
    );

    return result.rows;
}

/**
 * データベースからインデックス情報を取得する関数
 */
export async function getTableIndexes(sessionId: string, tableName: string): Promise<any[]> {
    const result = await executeQuery(
        sessionId,
        `SELECT indexname, indexdef
         FROM pg_indexes
         WHERE tablename = '${tableName}'
         AND schemaname = 'public'`,
    );

    return result.rows;
}

/**
 * データベースからテーブルの行数を取得する関数
 */
export async function getTableRowCount(sessionId: string, tableName: string): Promise<number> {
    const result = await executeQuery(sessionId, `SELECT COUNT(*) as count FROM "${tableName}"`);

    return parseInt(result.rows[0].count, 10);
}

/**
 * スキーマ情報を取得する関数
 */
export async function getDatabaseInfo(sessionId: string): Promise<any> {
    const versionResult = await executeQuery(sessionId, 'SELECT version()');

    const tablesResult = await executeQuery(
        sessionId,
        `SELECT count(*) as count 
         FROM information_schema.tables 
         WHERE table_schema = 'public'`,
    );

    return {
        version: versionResult.rows[0].version,
        tableCount: parseInt(tablesResult.rows[0].count, 10),
    };
}
