'use client';

import React, {useState, useEffect} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Activity, Clock, Database, List, Table as TableIcon} from 'lucide-react';
import {Button} from '@heroui/button';

import {EmptyResultsPanel, ResultsPanel} from '@/app/(bashboard)/components/results-panel';
import {useConnection} from '@/lib/hook/use-connection';
import {useQuery} from '@/lib/hook/use-query';
import {QueryEditor} from '@/app/(bashboard)/components/query-editor';

export default function DashboardPage() {
    const {isConnected, activeConnectionInfo} = useConnection();
    const {results, isLoading, error, execute} = useQuery();

    const [tableList, setTableList] = useState<string[]>([]);
    const [dbInfo, setDbInfo] = useState<any>(null);
    const [isLoadingSchema, setIsLoadingSchema] = useState(false);

    // データベース情報とテーブル一覧を取得
    useEffect(() => {
        if (!isConnected) return;

        const fetchDatabaseInfo = async () => {
            setIsLoadingSchema(true);
            try {
                // API経由でテーブル一覧を取得
                const response = await fetch('/api/postgres/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name`,
                    }),
                });

                const data = await response.json();

                if (data.success && data.results?.rows) {
                    setTableList(data.results.rows.map((row: any) => row.table_name));
                }

                // データベースバージョン情報を取得
                const versionResponse = await fetch('/api/postgres/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: `SELECT version()`,
                    }),
                });

                const versionData = await versionResponse.json();

                if (versionData.success && versionData.results?.rows?.length > 0) {
                    setDbInfo({
                        version: versionData.results.rows[0].version,
                        tableCount: tableList.length,
                    });
                }
            } catch (err) {
                console.error('Failed to fetch database schema:', err);
            } finally {
                setIsLoadingSchema(false);
            }
        };

        fetchDatabaseInfo();
    }, [isConnected]);

    // テーブルの内容を表示
    const showTableContent = (tableName: string) => {
        execute(`SELECT * FROM "${tableName}" LIMIT 100`);
    };

    // テーブル構造を表示
    const showTableStructure = (tableName: string) => {
        execute(`SELECT column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_name = '${tableName}'
             AND table_schema = 'public'
             ORDER BY ordinal_position`);
    };

    return (
        <div className='space-y-6'>
            {/* ステータスカード */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <h4 className='text-sm font-medium'>接続情報</h4>
                        <Database className='h-4 w-4 text-default-500' />
                    </CardHeader>
                    <CardBody>
                        <div className='text-xl font-bold'>{activeConnectionInfo?.name || 'PostgreSQL'}</div>
                        <p className='mt-1 text-xs text-default-500'>
                            {activeConnectionInfo?.host}:{activeConnectionInfo?.port}
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

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <h4 className='text-sm font-medium'>実行時間</h4>
                        <Clock className='h-4 w-4 text-default-500' />
                    </CardHeader>
                    <CardBody>
                        <div className='text-xl font-bold'>{results ? `${results.executionTime}ms` : '-'}</div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <h4 className='text-sm font-medium'>処理行数</h4>
                        <Activity className='h-4 w-4 text-default-500' />
                    </CardHeader>
                    <CardBody>
                        <div className='text-xl font-bold'>{results ? results.rowCount : '-'}</div>
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
                                    onPress={() =>
                                        execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
                                    }>
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
                    {/* クエリエディタ */}
                    <QueryEditor />

                    {/* 実行結果 */}
                    {results ? (
                        <ResultsPanel
                            error={error}
                            isLoading={isLoading}
                            results={results}
                        />
                    ) : error ? (
                        <ResultsPanel
                            error={error}
                            isLoading={isLoading}
                            results={null}
                        />
                    ) : (
                        <EmptyResultsPanel />
                    )}
                </div>
            </div>
        </div>
    );
}
