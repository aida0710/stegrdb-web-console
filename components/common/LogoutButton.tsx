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
            const response = await fetch('/api/postgres/connect', {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('ログアウトに失敗しました');
            }

            // Clear Zustand store
            setActiveConnection(null);

            // Redirect to login page
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect to login page even if there's an error
            router.push('/login');
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
