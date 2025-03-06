'use client';

import React from 'react';
import {useRouter} from 'next/navigation';
import {Spinner} from '@heroui/spinner';

import {DashboardHeader} from '@/app/dashboard/components/dashboard-header';
import {useConnection} from '@/lib/hook/use-connection';

export default function DashboardLayout({children}: {children: React.ReactNode}) {
    const router = useRouter();
    const {isChecking, isConnected, error} = useConnection();

    if (isChecking) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <div className='text-center'>
                    <Spinner
                        className='mb-4'
                        size='lg'
                    />
                    <p className='text-default-600'>データベース接続を確認中...</p>
                </div>
            </div>
        );
    }

    if (!isConnected && error) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <div className='mx-auto max-w-md p-6 text-center'>
                    <h2 className='mb-2 text-2xl font-bold'>データベース接続エラー</h2>
                    <p className='mb-4 text-default-600'>{error}</p>
                    <button
                        className='rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-600'
                        onClick={() => router.push('/login')}>
                        ログインページに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='flex min-h-screen flex-col bg-background'>
            <DashboardHeader />
            <main className='container mx-auto flex-1 p-4'>{children}</main>
        </div>
    );
}
