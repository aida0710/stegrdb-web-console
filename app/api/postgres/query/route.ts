import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {FieldDef} from 'pg';

import {pools} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';
const MAX_RESULT_SIZE = 5 * 1024 * 1024;

interface QueryRequest {
    query: string;
}

interface QueryResponse {
    success: boolean;
    message?: string;
    results?: {
        rows: any[];
        fields: {
            name: string;
            dataTypeID: number;
            tableID: number;
        }[];
        rowCount: number;
        command: string;
        executionTime: number;
    };
    error?: string;
}

function limitResultSize(rows: any[], maxRows = 1000): any[] {
    if (rows.length > maxRows) {
        console.warn(`Result size limited from ${rows.length} to ${maxRows} rows`);
        return rows.slice(0, maxRows);
    }
    return rows;
}

function makeSerializable(obj: any): any {
    if (obj === null || obj === undefined) {
        return null;
    }

    if (typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return obj.toISOString();
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => makeSerializable(item));
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        try {
            JSON.stringify(value);
            result[key] = makeSerializable(value);
        } catch (error) {
            console.warn(`Non-serializable value for key: ${key}, using string representation`);
            result[key] = String(value);
        }
    }

    return result;
}

export async function POST(request: NextRequest): Promise<NextResponse<QueryResponse>> {
    const startTime = Date.now();

    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(COOKIE_NAME)?.value;

        if (!sessionId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'セッションが見つかりません。再ログインしてください。',
                },
                {status: 401},
            );
        }

        const pool = pools.get(sessionId);

        if (!pool) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'データベース接続が見つかりません。再ログインしてください。',
                },
                {status: 401},
            );
        }

        const {query} = (await request.json()) as QueryRequest;
        if (!query || !query.trim()) {
            return NextResponse.json({success: false, message: 'クエリが指定されていません。'}, {status: 400});
        }
        const client = await pool.connect();

        try {
            const result = await client.query(query);

            const executionTime = Date.now() - startTime;

            if (result.rowCount === null) {
                return NextResponse.json({
                    success: false,
                    message: 'クエリが失敗しました。',
                });
            }

            const limitedRows = limitResultSize(result.rows);
            const serializedRows = makeSerializable(limitedRows);

            try {
                const testSize = JSON.stringify({
                    rows: serializedRows,
                    fields: result.fields.map((field: FieldDef) => ({
                        name: field.name,
                        dataTypeID: field.dataTypeID,
                        tableID: field.tableID,
                    })),
                }).length;

                console.log(`Response size: ${(testSize / 1024).toFixed(2)} KB`);
                if (testSize > MAX_RESULT_SIZE) {
                    throw new Error(`結果のサイズが大きすぎます (${(testSize / 1024 / 1024).toFixed(2)} MB). クエリを絞り込んでください。`);
                }
            } catch (error) {
                if (error instanceof Error && error.message.includes('結果のサイズが大きすぎます')) {
                    throw error;
                }
                console.error('Serialization test failed:', error);
                throw new Error('結果をシリアライズできません。クエリを絞り込むか、LIMIT句を使用してください。');
            }

            return NextResponse.json({
                success: true,
                results: {
                    rows: serializedRows,
                    fields: result.fields.map((field: FieldDef) => ({
                        name: field.name,
                        dataTypeID: field.dataTypeID,
                        tableID: field.tableID,
                    })),
                    rowCount: result.rowCount,
                    command: result.command,
                    executionTime,
                },
            });
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Query execution error:', error);
        let errorMessage = 'クエリの実行中にエラーが発生しました。';
        if (error.message) {
            errorMessage = `エラー: ${error.message}`;
        }

        return NextResponse.json(
            {
                success: false,
                message: errorMessage,
                error: error instanceof Error ? error.message : '不明なエラーが発生しました',
            },
            {status: 500},
        );
    }
}
