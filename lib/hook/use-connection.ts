import {useCallback, useEffect, useState} from 'react';
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
    const {activeConnection, getConnection, updateConnectionStatus} = useConnectionStore();
    const checkConnection = useCallback(
        async (silent = false) => {
            if (!silent) {
                setState((prev) => ({...prev, isChecking: true, error: null}));
            }

            try {
                console.log('Checking connection...');
                const response = await fetch('/api/postgres/check', {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                });

                const data = await response.json();
                console.log('Connection check response:', data);

                if (!response.ok || !data.success) {
                    throw new Error(data.message || '接続が無効です');
                }

                setState({
                    isChecking: false,
                    isConnected: true,
                    error: null,
                    connectionInfo: {
                        serverVersion: data.details?.serverVersion || data.details?.version,
                        connectedAt: data.details?.connectedAt ? new Date(data.details.connectedAt) : undefined,
                    },
                });

                if (activeConnection) {
                    updateConnectionStatus(activeConnection);
                }

                return true;
            } catch (error) {
                console.error('Connection check error:', error);

                if (!silent) {
                    setState({
                        isChecking: false,
                        isConnected: false,
                        error: error instanceof Error ? error.message : '接続の確認中にエラーが発生しました',
                        connectionInfo: null,
                    });
                }

                if (activeConnection) {
                    updateConnectionStatus(activeConnection, error instanceof Error ? error.message : '接続の確認中にエラーが発生しました');
                }

                return false;
            }
        },
        [activeConnection, updateConnectionStatus],
    );

    const disconnect = useCallback(async () => {
        try {
            console.log('Disconnecting...');
            const response = await fetch('/api/postgres/connect', {
                method: 'DELETE',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            });

            const data = await response.json();
            console.log('Disconnect response:', data);
            useConnectionStore.getState().setActiveConnection(null);
            setState({
                isChecking: false,
                isConnected: false,
                error: null,
                connectionInfo: null,
            });

            router.push('/login?force=true');
            return true;
        } catch (error) {
            console.error('Disconnect error:', error);
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : '接続の終了中にエラーが発生しました',
            }));
            return false;
        }
    }, [router]);

    const connect = useCallback(
        async (connectionInfo: any) => {
            setState((prev) => ({...prev, isChecking: true, error: null}));
            console.log('Connecting...');

            try {
                const response = await fetch('/api/postgres/connect', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                    body: JSON.stringify(connectionInfo),
                });
                const data = await response.json();
                console.log('Connect response:', data);
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || '接続に失敗しました');
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

                setTimeout(() => {
                    checkConnection(true).catch(console.error);
                }, 500);

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
        },
        [checkConnection],
    );

    const goToDashboard = useCallback(() => {
        if (state.isConnected) {
            console.log('Navigating to dashboard...');
            router.push('/dashboard');
            return true;
        }
        return false;
    }, [router, state.isConnected]);

    useEffect(() => {
        let mounted = true;

        checkConnection().then((connected) => {
            if (!mounted) return;
        });

        return () => {
            mounted = false;
        };
    }, [checkConnection]);

    const getActiveConnectionInfo = useCallback(() => {
        if (!activeConnection) return null;
        return getConnection(activeConnection);
    }, [activeConnection, getConnection]);

    return {
        ...state,
        activeConnection,
        activeConnectionInfo: getActiveConnectionInfo(),
        checkConnection,
        disconnect,
        connect,
        goToDashboard,
        // 再接続ユーティリティ
        reconnect: async () => {
            const info = getActiveConnectionInfo();
            if (info) {
                return await connect(info);
            }
            return false;
        },
    };
}
