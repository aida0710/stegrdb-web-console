'use client';

import React, {useEffect, useRef, useState} from 'react';
import {Spinner} from '@heroui/spinner';
import {useRouter} from 'next/navigation';
import {useConnection} from '@/lib/hook/use-connection';
import {ConnectionForm} from '@/components/database/connection-form';

export default function LoginPage() {
    const router = useRouter();
    const {isChecking, isConnected, error, checkConnection} = useConnection();
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [localCheckingState, setLocalCheckingState] = useState<boolean>(isChecking);
    const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const CONNECTION_CHECK_TIMEOUT = 5000;

    // 成功メッセージのタイマー制御
    useEffect(() => {
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    // 接続状態の変化を検出
    useEffect(() => {
        if (isConnected) {
            console.log('接続完了を検出、ダッシュボードに遷移します');
            // タイムアウトがあればクリア
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
                checkTimeoutRef.current = null;
            }

            // ダッシュボードへリダイレクト
            router.push('/dashboard');
        }
    }, [isConnected, router]);

    // 接続確認中の状態を監視し、タイムアウト処理を追加
    useEffect(() => {
        setLocalCheckingState(isChecking);

        // すでに接続中または接続確認中でなければ何もしない
        if (!isChecking || isConnected) {
            return;
        }

        // 接続確認中の場合、タイムアウトを設定
        console.log('接続確認中、タイムアウトを設定します');
        checkTimeoutRef.current = setTimeout(() => {
            console.log('接続確認がタイムアウトしました。チェックをリセットします');
            setLocalCheckingState(false);
            // 明示的に接続チェックを再実行
            checkConnection().catch(console.error);
        }, CONNECTION_CHECK_TIMEOUT);

        return () => {
            if (checkTimeoutRef.current) {
                clearTimeout(checkTimeoutRef.current);
                checkTimeoutRef.current = null;
            }
        };
    }, [isChecking, isConnected, checkConnection]);

    // ローカルの接続確認状態に基づいてローディング表示
    if (localCheckingState) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <div className='text-center'>
                    <Spinner size='lg' />
                    <p className='ml-2 mt-4'>接続を確認中...</p>
                    <button
                        className='mt-4 rounded-md bg-primary-50 px-4 py-2 text-primary-700 transition-colors hover:bg-primary-100'
                        onClick={() => {
                            // タイムアウトをクリアして手動でチェックを再開
                            if (checkTimeoutRef.current) {
                                clearTimeout(checkTimeoutRef.current);
                                checkTimeoutRef.current = null;
                            }
                            setLocalCheckingState(false);
                            setTimeout(() => {
                                checkConnection().catch(console.error);
                            }, 500);
                        }}>
                        キャンセル
                    </button>
                </div>
            </div>
        );
    }

    // エラー状態の表示
    if (error) {
        return (
            <div className='flex items-center justify-center'>
                <div className='p-6 md:w-1/2'>
                    <div className='mb-6 rounded-md bg-danger-50 p-4 text-danger-700'>
                        <h3 className='mb-2 font-bold'>接続エラー</h3>
                        <p>{error}</p>
                    </div>
                    <ConnectionForm />
                </div>
            </div>
        );
    }

    return (
        <div className='flex items-center justify-center'>
            <div className='p-6 md:w-1/2'>
                <ConnectionForm
                    onConnected={() => {
                        console.log('接続成功、ダッシュボードに遷移します');
                        setSuccessMessage('接続に成功しました！ダッシュボードに移動します...');
                        setTimeout(() => {
                            router.push('/dashboard');
                        }, 1000);
                    }}
                />
            </div>
        </div>
    );
}
