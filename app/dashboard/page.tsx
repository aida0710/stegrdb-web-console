'use client';

import React, {useCallback, useEffect, useState, useRef} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Database, List, Table as TableIcon} from 'lucide-react';
import {Button} from '@heroui/button';

import {EmptyResultsPanel, ResultsPanel} from '@/app/dashboard/components/results-panel';
import {useConnection} from '@/lib/hook/use-connection';
import {useQuery} from '@/lib/hook/use-query';
import {QueryEditor} from '@/app/dashboard/components/query-editor';

export default function DashboardPage() {
    const {isConnected, activeConnectionInfo} = useConnection();

    // 単一のQueryフックインスタンスを作成して共有
    const queryHook = useQuery();
    const {results, isLoading, error, execute, clearResults} = queryHook;

    const [tableList, setTableList] = useState<string[]>([]);
    const [dbInfo, setDbInfo] = useState<any>(null);
    const [isLoadingSchema, setIsLoadingSchema] = useState(false);
    const [hasExecutedQuery, setHasExecutedQuery] = useState(false);

    // 最後に実行したクエリを追跡
    const lastQueryTextRef = useRef('');

    // デバッグログ - 状態変更を追跡
    useEffect(() => {
        console.log('[DashboardPage] State update:', {
            results,
            isLoading,
            error,
            hasExecutedQuery,
            lastQuery: lastQueryTextRef.current
        });
    }, [results, isLoading, error, hasExecutedQuery]);

    // データベース情報とテーブル一覧を取得
    const fetchDatabaseInfo = useCallback(async () => {
        if (!isConnected) return;

        setIsLoadingSchema(true);
        try {
            console.log('[DashboardPage] データベース情報を取得中...');

            // 別のfetchを使用してAPI呼び出し (useQueryフックを使わない)
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
                body: JSON.stringify({
                    query: `SELECT table_name
                            FROM information_schema.tables
                            WHERE table_schema = 'public'
                            ORDER BY table_name`,
                }),
            });

            const data = await response.json();
            console.log('[DashboardPage] テーブル一覧取得結果:', data);

            if (data.success && data.results?.rows) {
                setTableList(data.results.rows.map((row: any) => row.table_name));
            } else {
                console.warn('[DashboardPage] テーブル一覧取得失敗:', data);
            }

            // データベースバージョン情報を取得
            const versionResponse = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                },
                body: JSON.stringify({
                    query: `SELECT version()`,
                }),
            });

            const versionData = await versionResponse.json();
            console.log('[DashboardPage] バージョン情報取得結果:', versionData);

            if (versionData.success && versionData.results?.rows?.length > 0) {
                setDbInfo({
                    version: versionData.results.rows[0].version,
                    tableCount: tableList.length,
                });
            } else {
                console.warn('[DashboardPage] バージョン情報取得失敗:', versionData);
            }
        } catch (err) {
            console.error('[DashboardPage] データベース情報取得エラー:', err);
        } finally {
            setIsLoadingSchema(false);
        }
    }, [isConnected, tableList.length]);

    // 初回ロード時にデータベース情報を取得
    useEffect(() => {
        fetchDatabaseInfo();
    }, [fetchDatabaseInfo]);

    // QueryEditorから受け取った結果を処理
    const handleQueryResults = useCallback((editorResults: any, queryText: string) => {
        console.log('[DashboardPage] QueryEditorから結果を受信:', {
            resultLength: editorResults?.rows?.length,
            query: queryText
        });

        lastQueryTextRef.current = queryText;
        setHasExecutedQuery(true);

        // 注: queryHookを共有しているので、ここで何か特別な処理をする必要はない
    }, []);

    // テーブルの内容を表示
    const showTableContent = useCallback(
        (tableName: string) => {
            console.log(`[DashboardPage] テーブル内容を表示: ${tableName}`);
            const query = `SELECT * FROM "${tableName}" LIMIT 100`;
            lastQueryTextRef.current = query;
            setHasExecutedQuery(true);
            execute(query);
        },
        [execute],
    );

    // テーブル構造を表示
    const showTableStructure = useCallback(
        (tableName: string) => {
            console.log(`[DashboardPage] テーブル構造を表示: ${tableName}`);
            const query = `SELECT column_name, data_type, is_nullable, column_default
                 FROM information_schema.columns
                 WHERE table_name = '${tableName}'
                   AND table_schema = 'public'
                 ORDER BY ordinal_position`;

            lastQueryTextRef.current = query;
            setHasExecutedQuery(true);
            execute(query);
        },
        [execute],
    );

    // テーブル一覧の更新
    const refreshTableList = useCallback(() => {
        console.log('[DashboardPage] テーブル一覧を更新');
        fetchDatabaseInfo();
    }, [fetchDatabaseInfo]);

    // Handle showing row count for a table
    const showRowCount = useCallback(
        (tableName: string) => {
            console.log(`[DashboardPage] テーブルの行数を表示: ${tableName}`);
            const query = `SELECT COUNT(*) FROM "${tableName}"`;
            lastQueryTextRef.current = query;
            setHasExecutedQuery(true);
            execute(query);
        },
        [execute],
    );

    // 結果パネルに表示するコンテンツを決定
    const renderResultsPanel = () => {
        console.log('[DashboardPage] Rendering ResultsPanel:', { isLoading, error, hasResults: !!results });

        if (isLoading) {
            return (
                <ResultsPanel
                    error={null}
                    isLoading={true}
                    results={null}
                />
            );
        }

        if (error) {
            return (
                <ResultsPanel
                    error={error}
                    isLoading={false}
                    results={null}
                />
            );
        }

        if (results) {
            return (
                <ResultsPanel
                    error={null}
                    isLoading={false}
                    results={results}
                />
            );
        }

        if (hasExecutedQuery) {
            return (
                <ResultsPanel
                    error={null}
                    isLoading={false}
                    results={null}
                />
            );
        }

        return <EmptyResultsPanel />;
    };

    return (
        <div className='space-y-6'>
            {/* ステータスカード */}
            <div className='grid grid-cols-2 gap-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <h4 className='text-sm font-medium'>接続情報</h4>
                        <Database className='h-4 w-4 text-default-500' />
                    </CardHeader>
                    <CardBody>
                        <div className='text-xl font-bold'>{activeConnectionInfo?.host}:{activeConnectionInfo?.port}</div>
                        <p className='mt-1 text-xs text-default-500'>
                            {dbInfo ? `PostgreSQL ${dbInfo.version}` : 'バージョン情報を取得中...'}
                        </p>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <h4 className='text-sm font-medium'>テーブル数</h4>
                        <TableIcon className='h-4 w-4 text-default-500' />
                    </CardHeader>
                    <CardBody>
                        <div className='text-xl font-bold'>{isLoadingSchema ? '読込中...' : tableList.length}</div>
                    </CardBody>
                </Card>
            </div>

            {/* メインコンテンツ */}
            <div className='grid gap-6 md:grid-cols-4'>
                {/* サイドバー */}
                <div className='md:col-span-1'>
                    <Card className='h-full'>
                        <CardHeader>
                            <div className='flex items-center justify-between'>
                                <h3 className='text-xl font-bold'>テーブル一覧</h3>
                                <Button
                                    isIconOnly
                                    size='sm'
                                    variant='light'
                                    onPress={refreshTableList}>
                                    <List size={18} />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {isLoadingSchema ? (
                                <div className='py-4 text-center text-default-500'>テーブル情報を読み込み中...</div>
                            ) : tableList.length === 0 ? (
                                <div className='py-4 text-center text-default-500'>テーブルがありません</div>
                            ) : (
                                <div className='space-y-2'>
                                    {tableList.map((tableName) => (
                                        <div
                                            key={tableName}
                                            className='rounded-md border border-default-200 p-3'>
                                            <div className='mb-2 font-medium'>{tableName}</div>
                                            <div className='flex flex-wrap gap-1'>
                                                <Button
                                                    color='primary'
                                                    size='sm'
                                                    variant='flat'
                                                    onPress={() => showTableContent(tableName)}>
                                                    データ表示
                                                </Button>
                                                <Button
                                                    size='sm'
                                                    variant='light'
                                                    onPress={() => showTableStructure(tableName)}>
                                                    構造
                                                </Button>
                                                <Button
                                                    size='sm'
                                                    variant='light'
                                                    onPress={() => showRowCount(tableName)}>
                                                    行数
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* メインエリア */}
                <div className='space-y-6 md:col-span-3'>
                    {/* クエリエディタ - 共有useQueryフックを渡す */}
                    <QueryEditor
                        onResultsChange={handleQueryResults}
                        queryHook={queryHook}
                    />

                    {/* 実行結果 */}
                    {renderResultsPanel()}
                </div>
            </div>
        </div>
    );
}