import {useCallback, useEffect, useRef, useState} from 'react';
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
    reconnectAttempts: number;
}

export function useConnection() {
    const router = useRouter();
    const [state, setState] = useState<ConnectionState>({
        isChecking: true,
        isConnected: false,
        error: null,
        connectionInfo: null,
        reconnectAttempts: 0,
    });

    const maxReconnectAttempts = 3;
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const {activeConnection, getConnection, updateConnectionStatus} = useConnectionStore();

    // Clear any pending reconnect timers when component unmounts
    useEffect(() => {
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
        };
    }, []);

    const checkConnection = useCallback(
        async (silent = false) => {
            if (!silent) {
                setState((prev) => ({...prev, isChecking: true, error: null}));
            }

            try {
                console.log('[useConnection] Checking connection...');
                const response = await fetch('/api/postgres/check', {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        Pragma: 'no-cache',
                        Expires: '0',
                    },
                });

                const data = await response.json();
                console.log('[useConnection] Connection check response:', data);

                if (!response.ok || !data.success) {
                    throw new Error(data.message || '接続が無効です');
                }

                setState((prev) => ({
                    isChecking: false,
                    isConnected: true,
                    error: null,
                    connectionInfo: {
                        serverVersion: data.details?.serverVersion || data.details?.version,
                        connectedAt: data.details?.connectedAt ? new Date(data.details.connectedAt) : undefined,
                    },
                    reconnectAttempts: 0, // Reset reconnect attempts on success
                }));

                if (activeConnection) {
                    updateConnectionStatus(activeConnection);
                }

                return true;
            } catch (error) {
                console.error('[useConnection] Connection check error:', error);

                if (!silent) {
                    setState((prev) => ({
                        isChecking: false,
                        isConnected: false,
                        error: error instanceof Error ? error.message : '接続の確認中にエラーが発生しました',
                        connectionInfo: null,
                        reconnectAttempts: prev.reconnectAttempts, // Keep the count
                    }));
                }

                if (activeConnection) {
                    updateConnectionStatus(activeConnection, error instanceof Error ? error.message : '接続の確認中にエラーが発生しました');
                }

                return false;
            }
        },
        [activeConnection, updateConnectionStatus],
    );

    const connect = useCallback(
        async (connectionInfo: any) => {
            setState((prev) => ({...prev, isChecking: true, error: null}));
            console.log('[useConnection] Connecting...');

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
                console.log('[useConnection] Connect response:', data);

                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || '接続に失敗しました');
                }

                setState((prev) => ({
                    isChecking: false,
                    isConnected: true,
                    error: null,
                    connectionInfo: {
                        serverVersion: data.details?.serverVersion,
                        connectedAt: data.details?.connectedAt ? new Date(data.details.connectedAt) : undefined,
                    },
                    reconnectAttempts: 0, // Reset reconnect attempts on new connection
                }));

                // Verify connection was established correctly after a short delay
                setTimeout(() => {
                    checkConnection(true).catch(console.error);
                }, 500);

                return true;
            } catch (error) {
                console.error('[useConnection] Connection error:', error);
                setState((prev) => ({
                    isChecking: false,
                    isConnected: false,
                    error: error instanceof Error ? error.message : '接続中にエラーが発生しました',
                    connectionInfo: null,
                    reconnectAttempts: prev.reconnectAttempts,
                }));
                return false;
            }
        },
        [checkConnection],
    );

    // Auto-reconnection logic
    const attemptReconnect = useCallback(() => {
        setState((prev) => {
            // If we've reached max attempts, stop trying
            if (prev.reconnectAttempts >= maxReconnectAttempts) {
                console.log(`[useConnection] Max reconnect attempts (${maxReconnectAttempts}) reached`);
                return prev;
            }

            const newState = {
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1,
            };

            console.log(`[useConnection] Attempting reconnect (${newState.reconnectAttempts}/${maxReconnectAttempts})`);

            // Get connection info and attempt to reconnect
            const info = getConnection(activeConnection || '');
            if (info) {
                // Schedule reconnect with exponential backoff
                const backoffTime = Math.min(1000 * Math.pow(2, newState.reconnectAttempts - 1), 10000);
                console.log(`[useConnection] Reconnecting in ${backoffTime}ms`);

                reconnectTimerRef.current = setTimeout(() => {
                    connect(info).catch((e) => {
                        console.error('[useConnection] Reconnect failed:', e);
                        // Try again if we haven't reached max attempts
                        if (newState.reconnectAttempts < maxReconnectAttempts) {
                            attemptReconnect();
                        }
                    });
                }, backoffTime);
            }

            return newState;
        });
    }, [activeConnection, connect, getConnection, maxReconnectAttempts]);

    // Set up auto-reconnect handling
    useEffect(() => {
        if (state.error && state.reconnectAttempts < maxReconnectAttempts) {
            attemptReconnect();
        }
    }, [state.error, state.reconnectAttempts, attemptReconnect, maxReconnectAttempts]);

    // Initial connection check
    useEffect(() => {
        let mounted = true;

        checkConnection().then((connected) => {
            if (!mounted) return;

            // If not connected, attempt reconnect
            if (!connected && activeConnection) {
                attemptReconnect();
            }
        });

        return () => {
            mounted = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
        };
    }, [checkConnection, activeConnection, attemptReconnect]);

    // ...other methods (disconnect, goToDashboard) remain the same

    const disconnect = useCallback(async () => {
        try {
            console.log('[useConnection] Disconnecting...');
            const response = await fetch('/api/postgres/connect', {
                method: 'DELETE',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            });

            const data = await response.json();
            console.log('[useConnection] Disconnect response:', data);
            useConnectionStore.getState().setActiveConnection(null);
            setState({
                isChecking: false,
                isConnected: false,
                error: null,
                connectionInfo: null,
                reconnectAttempts: 0,
            });

            router.push('/login?force=true');
            return true;
        } catch (error) {
            console.error('[useConnection] Disconnect error:', error);
            setState((prev) => ({
                ...prev,
                error: error instanceof Error ? error.message : '接続の終了中にエラーが発生しました',
            }));
            return false;
        }
    }, [router]);

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
        // Enhanced reconnection utility
        reconnect: async (force = false) => {
            // If we're forcing a reconnect, reset the counter
            if (force) {
                setState((prev) => ({...prev, reconnectAttempts: 0}));
            }

            const info = getActiveConnectionInfo();
            if (info) {
                return await connect(info);
            }
            return false;
        },
    };
}
