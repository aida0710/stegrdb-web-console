'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@heroui/button';
import {LogOut} from 'lucide-react';

import {useConnectionStore} from '@/lib/utils/connection-store';

export function LogoutButton() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const {setActiveConnection} = useConnectionStore();

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            console.log('[Logout] Sending logout request...');
            const response = await fetch('/api/postgres/connect', {
                method: 'DELETE',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            });

            const data = await response.json();
            console.log('[Logout] Response:', data);

            if (!response.ok) {
                throw new Error('ログアウトに失敗しました');
            }

            // Zustandストアをクリア
            setActiveConnection(null);

            // ログインページにリダイレクト（force=trueでミドルウェアのリダイレクトを回避）
            console.log('[Logout] Redirecting to login page...');

            // ミドルウェアによるリダイレクトを回避するためにタイムアウトを設定
            setTimeout(() => {
                router.push('/login?force=true');

                // 完全なページリロードでクリーンな状態にする
                setTimeout(() => {
                    window.location.href = '/login?force=true';
                }, 100);
            }, 100);
        } catch (error) {
            console.error('[Logout] Error:', error);
            // エラーがあってもログインページにリダイレクト
            router.push('/login?force=true');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            color='danger'
            isDisabled={isLoading}
            isLoading={isLoading}
            startContent={<LogOut size={18} />}
            variant='light'
            onPress={handleLogout}>
            {isLoading ? 'ログアウト中...' : 'ログアウト'}
        </Button>
    );
}
