'use client';

import React, {useEffect, useState} from 'react';
import {Spinner} from '@heroui/spinner';
import {useRouter} from 'next/navigation';
import {useConnection} from '@/lib/hook/use-connection';
import {ConnectionForm} from '@/components/database/connection-form';

export default function LoginPage() {
    const router = useRouter();
    const {isChecking, isConnected} = useConnection();
    const [successMessage, setSuccessMessage] = useState<string>('');

    useEffect(() => {
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    useEffect(() => {
        if (isConnected) {
            console.log('接続完了を検出、ダッシュボードに遷移します');
            router.push('/dashboard');
        }
    }, [isConnected, router]);

    if (isChecking) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <Spinner size='lg' />
                <p className='ml-2'>接続を確認中...</p>
            </div>
        );
    }

    return (
        <div className='flex items-center justify-center'>
            <div className='p-6 md:w-1/2'>
                <ConnectionForm />
            </div>
        </div>
    );
}
