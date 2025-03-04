import {NextRequest, NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {FieldDef} from 'pg';

import {pools} from '@/lib/database/connection-manager';

const COOKIE_NAME = 'postgres-session';

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

export async function POST(request: NextRequest): Promise<NextResponse<QueryResponse>> {
    const startTime = Date.now();

    try {
        // Get session cookie
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

        // Get connection pool
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

        // Parse request body
        const {query} = (await request.json()) as QueryRequest;

        if (!query || !query.trim()) {
            return NextResponse.json({success: false, message: 'クエリが指定されていません。'}, {status: 400});
        }

        // Execute query
        const client = await pool.connect();

        try {
            // Security considerations:
            // In a production environment, you would want to add more validation and security checks here
            // This is a basic implementation for demonstration purposes
            const result = await client.query(query);

            const executionTime = Date.now() - startTime;

            if (result.rowCount === null) {
                return NextResponse.json({
                    success: false,
                    message: 'クエリが失敗しました。',
                });
            }

            return NextResponse.json({
                success: true,
                results: {
                    rows: result.rows,
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

        // Format the error message in a user-friendly way
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
