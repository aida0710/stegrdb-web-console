'use client';

import React, {useEffect, useState} from 'react';
import {Card, CardHeader} from '@heroui/card';
import {Spinner} from '@heroui/spinner';
import {Database} from 'lucide-react';

import {useConnection} from '@/lib/hook/use-connection';
import {ConnectionForm} from '@/components/database/connection-form';

export default function LoginPage() {
    const {isChecking} = useConnection();
    const [successMessage, setSuccessMessage] = useState<string>('');

    useEffect(() => {
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    if (isChecking) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <Spinner size='lg' />
                <p className='ml-2'>接続を確認中...</p>
            </div>
        );
    }

    return (
        <div className='flex min-h-screen items-center justify-center p-4'>
            <Card className='w-full max-w-xl'>
                <ConnectionForm />
            </Card>
        </div>
    );
}
