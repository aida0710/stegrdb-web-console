'use client';

import React, {useEffect} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Spinner} from '@heroui/spinner';

import {QueryResultTable} from '@/components/database/query-result-table';

interface ResultsPanelProps {
    results: any;
    isLoading: boolean;
    error: string | null;
}

export function ResultsPanel({results, isLoading, error}: ResultsPanelProps) {
    useEffect(() => {
        console.log('Received props:', {results, isLoading, error});
        if (results) {
            console.log('Results details:', {
                rowCount: results.rowCount,
                fieldsCount: results.fields?.length,
                rowsCount: results.rows?.length,
                firstRow: results.rows?.[0],
            });
        }
    }, [results, isLoading, error]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <h3 className='text-xl font-bold'>実行結果</h3>
                </CardHeader>
                <CardBody className='flex h-40 items-center justify-center'>
                    <div className='text-center'>
                        <Spinner
                            className='mb-2'
                            size='lg'
                        />
                        <p>クエリを実行中...</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className='border-danger'>
                <CardHeader>
                    <h3 className='text-xl font-bold text-danger'>エラー</h3>
                </CardHeader>
                <CardBody>
                    <div className='rounded-md bg-danger-50 p-4'>
                        <p className='mb-2 font-medium text-danger'>クエリ実行エラー:</p>
                        <pre className='overflow-auto whitespace-pre-wrap rounded bg-danger-50/50 p-2 font-mono text-sm text-danger-600'>{error}</pre>
                    </div>
                </CardBody>
            </Card>
        );
    }

    if (!results) {
        return null;
    }

    if (results.rows && results.rows.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <h3 className='text-xl font-bold'>実行結果</h3>
                </CardHeader>
                <CardBody className='py-8'>
                    <div className='text-center text-default-500'>
                        <p className='mb-2 font-medium'>クエリは正常に実行されました。</p>
                        <p>{results.command === 'SELECT' ? '該当するレコードがありません' : `${results.rowCount}行が影響を受けました`}</p>
                        <p className='mt-2 text-xs'>実行時間: {results.executionTime}ms</p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <h3 className='text-xl font-bold'>実行結果</h3>
            </CardHeader>
            <CardBody>
                <QueryResultTable results={results} />
            </CardBody>
        </Card>
    );
}

export function EmptyResultsPanel() {
    return (
        <Card>
            <CardHeader>
                <h3 className='text-xl font-bold'>クエリ実行</h3>
            </CardHeader>
            <CardBody className='py-12'>
                <div className='text-center text-default-500'>
                    <p className='mb-2'>クエリを入力して「実行」ボタンをクリックしてください</p>
                    <p className='text-sm'>SELECT, INSERT, UPDATE, DELETE など、サポートされているすべての PostgreSQL クエリを実行できます。</p>
                </div>
            </CardBody>
        </Card>
    );
}
