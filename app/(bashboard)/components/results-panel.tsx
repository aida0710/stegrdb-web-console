'use client';

import React from 'react';
import {Card, CardHeader, CardBody} from '@heroui/card';
import {Spinner} from '@heroui/spinner';

import {QueryResultTable} from '@/components/database/query-result-table';

interface ResultsPanelProps {
    results: any;
    isLoading: boolean;
    error: string | null;
}

export function ResultsPanel({results, isLoading, error}: ResultsPanelProps) {
    // クエリ実行中の場合、ローディング表示
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

    // エラーがある場合、エラー表示
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

    // 結果がない場合、表示なし
    if (!results) {
        return null;
    }

    // 結果の表示
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

// クエリ実行結果が空の場合のコンポーネント
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
