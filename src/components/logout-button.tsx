'use client';

import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useConnectionStore} from '@/lib/connection-store';

export function LogoutButton() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const {setActiveConnection} = useConnectionStore();

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/postgres/connect', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('ログアウトに失敗しました');
            }

            // Zustand ストアをクリア
            setActiveConnection(null);

            // ログインページにリダイレクト
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // エラーが発生してもログインページに遷移
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant='outline'
            onClick={handleLogout}
            disabled={isLoading}>
            {isLoading ? 'ログアウト中...' : 'ログアウト'}
        </Button>
    );
}
