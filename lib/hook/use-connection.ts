import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';

import {useConnectionStore} from '@/lib/utils/connection-store';

interface ConnectionState {
    isChecking: boolean;
    isConnected: boolean;
    error: string | null;
    connectionInfo: {
        serverVersion?: string;
        connectedAt?: Date;
    } | null;
}

export function useConnection() {
    const router = useRouter();
    const [state, setState] = useState<ConnectionState>({
        isChecking: true,
        isConnected: false,
        error: null,
        connectionInfo: null,
    });

    // 接続ストアからアクティブな接続を取得
    const {activeConnection, getConnection} = useConnectionStore();

    // 接続状態をチェックする関数
    const checkConnection = async () => {
        setState((prev) => ({...prev, isChecking: true, error: null}));

        try {
            const response = await fetch('/api/postgres/check', {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || '接続が無効です');
            }

            setState({
                isChecking: false,
                isConnected: true,
                error: null,
                connectionInfo: {
                    serverVersion: data.details?.serverVersion,
                    connectedAt: data.details?.connectedAt ? new Date(data.details.connectedAt) : undefined,
                },
            });
        } catch (error) {
            console.error('Connection check error:', error);

            setState({
                isChecking: false,
                isConnected: false,
                error: error instanceof Error ? error.message : '接続の確認中にエラーが発生しました',
                connectionInfo: null,
            });

            // 未接続の場合はログインページにリダイレクト
            router.push('/login');
        }
    };

    // 接続を閉じる関数
    const disconnect = async () => {
        try {
            await fetch('/api/postgres/connect', {
                method: 'DELETE',
            });

            // 接続ストアをクリア
            useConnectionStore.getState().setActiveConnection(null);

            setState({
                isChecking: false,
                isConnected: false,
                error: null,
                connectionInfo: null,
            });

            // ログインページにリダイレクト
            router.push('/login');
        } catch (error) {
            console.error('Disconnect error:', error);
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : '接続の終了中にエラーが発生しました',
            }));
        }
    };

    // 接続を作成する関数
    const connect = async (connectionInfo: any) => {
        setState((prev) => ({...prev, isChecking: true, error: null}));

        try {
            const response = await fetch('/api/postgres/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(connectionInfo),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || '接続に失敗しました');
            }

            setState({
                isChecking: false,
                isConnected: true,
                error: null,
                connectionInfo: {
                    serverVersion: data.details?.serverVersion,
                    connectedAt: data.details?.connectedAt ? new Date(data.details.connectedAt) : undefined,
                },
            });

            return true;
        } catch (error) {
            console.error('Connection error:', error);

            setState({
                isChecking: false,
                isConnected: false,
                error: error instanceof Error ? error.message : '接続中にエラーが発生しました',
                connectionInfo: null,
            });

            return false;
        }
    };

    // コンポーネントマウント時に接続状態をチェック
    useEffect(() => {
        checkConnection().then(() => {});
    }, []);

    // 接続情報を取得
    const getActiveConnectionInfo = () => {
        if (!activeConnection) return null;

        return getConnection(activeConnection);
    };

    return {
        ...state,
        activeConnection,
        activeConnectionInfo: getActiveConnectionInfo(),
        checkConnection,
        disconnect,
        connect,
    };
}
