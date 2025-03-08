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

    const maxReconnectAttempts = 5; // 最大再接続試行回数を増やす（3→5）
    const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const {activeConnection, getConnection, updateConnectionStatus} = useConnectionStore();

    // 最後の接続チェックタイムスタンプを追跡
    const lastCheckRef = useRef<number>(Date.now());
    // 接続チェックの最小間隔（ミリ秒）
    const MIN_CHECK_INTERVAL = 3000;

    // コンポーネントアンマウント時にタイマーをクリア
    useEffect(() => {
        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
        };
    }, []);

    const checkConnection = useCallback(
        async (silent = false) => {
            // 短時間の連続呼び出しを防止
            const now = Date.now();
            if (now - lastCheckRef.current < MIN_CHECK_INTERVAL) {
                console.log(`[useConnection] Skipping check, too frequent (${now - lastCheckRef.current}ms since last check)`);
                return state.isConnected;
            }

            lastCheckRef.current = now;

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
                    // credentials を追加して Cookie が確実に送信されるようにする
                    credentials: 'include',
                });

                const data = await response.json();
                console.log('[useConnection] Connection check response:', data);

                if (!response.ok || !data.success) {
                    console.error('[useConnection] Connection check failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        data,
                    });

                    // 明示的にエラー状態を設定
                    setState((prev) => ({
                        isChecking: false,
                        isConnected: false,
                        error: data.message || '接続が無効です',
                        connectionInfo: null,
                        reconnectAttempts: prev.reconnectAttempts,
                    }));

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
                    reconnectAttempts: 0, // 成功したらリトライカウントをリセット
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
                        reconnectAttempts: prev.reconnectAttempts, // カウント維持
                    }));
                }

                if (activeConnection) {
                    updateConnectionStatus(activeConnection, error instanceof Error ? error.message : '接続の確認中にエラーが発生しました');
                }

                return false;
            }
        },
        [activeConnection, updateConnectionStatus, state.isConnected],
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
                    credentials: 'include', // Cookie を確実に送信する
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
                    reconnectAttempts: 0, // 新しい接続で再試行カウントをリセット
                }));

                // 接続設定後、短い遅延を置いて接続が確立されたことを確認
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

    // 再接続ロジック
    const attemptReconnect = useCallback(() => {
        setState((prev) => {
            // 最大試行回数に達したら終了
            if (prev.reconnectAttempts >= maxReconnectAttempts) {
                console.log(`[useConnection] Max reconnect attempts (${maxReconnectAttempts}) reached`);
                return prev;
            }

            const newState = {
                ...prev,
                reconnectAttempts: prev.reconnectAttempts + 1,
            };

            console.log(`[useConnection] Attempting reconnect (${newState.reconnectAttempts}/${maxReconnectAttempts})`);

            // 接続情報を取得して再接続を試みる
            const info = getConnection(activeConnection || '');
            if (info) {
                // 指数バックオフによる再試行間隔
                const backoffTime = Math.min(1000 * Math.pow(2, newState.reconnectAttempts - 1), 10000);
                console.log(`[useConnection] Reconnecting in ${backoffTime}ms`);

                if (reconnectTimerRef.current) {
                    clearTimeout(reconnectTimerRef.current);
                }

                reconnectTimerRef.current = setTimeout(async () => {
                    try {
                        // 既存のセッションをクリーンアップするために、まず切断を試みる
                        console.log('[useConnection] Cleaning up existing session before reconnect');
                        await fetch('/api/postgres/connect', {
                            method: 'DELETE',
                            headers: {
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                            },
                            credentials: 'include',
                        });

                        // 少し待ってから再接続
                        await new Promise((r) => setTimeout(r, 300));

                        // 本格的な再接続
                        const success = await connect(info);
                        if (!success && newState.reconnectAttempts < maxReconnectAttempts) {
                            console.log('[useConnection] Reconnect failed, scheduling next attempt');
                            attemptReconnect();
                        }
                    } catch (e) {
                        console.error('[useConnection] Reconnect failed:', e);
                        // 最大試行回数に達していなければ、再度試行
                        if (newState.reconnectAttempts < maxReconnectAttempts) {
                            attemptReconnect();
                        }
                    }
                }, backoffTime);
            }

            return newState;
        });
    }, [activeConnection, connect, getConnection, maxReconnectAttempts]);

    // エラー発生時に自動再接続を設定
    useEffect(() => {
        if (state.error && state.reconnectAttempts < maxReconnectAttempts) {
            attemptReconnect();
        }
    }, [state.error, state.reconnectAttempts, attemptReconnect, maxReconnectAttempts]);

    // 初期接続チェック
    useEffect(() => {
        let mounted = true;

        const initialCheck = async () => {
            try {
                console.log('[useConnection] 初期接続確認を開始');
                const connected = await checkConnection();

                if (!mounted) return;

                console.log('[useConnection] 初期接続確認完了:', {connected});

                // 接続されていない場合、再接続を試みる
                if (!connected && activeConnection) {
                    console.log('[useConnection] 初期接続が失敗、再接続を試みます');
                    attemptReconnect();
                }
            } catch (error) {
                console.error('[useConnection] 初期接続確認でエラー:', error);
                if (mounted) {
                    setState((prev) => ({
                        ...prev,
                        isChecking: false,
                        error: error instanceof Error ? error.message : '接続の確認中にエラーが発生しました',
                    }));
                }
            }
        };

        // 少し遅延させてから初期確認を実行
        const initTimer = setTimeout(() => {
            initialCheck();
        }, 300);

        // 接続確認の自動タイマー（30秒ごと）
        const intervalId = setInterval(() => {
            if (mounted) {
                checkConnection(true).catch(console.error);
            }
        }, 30000);

        return () => {
            mounted = false;
            clearTimeout(initTimer);
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            clearInterval(intervalId);
        };
    }, [checkConnection, activeConnection, attemptReconnect]);

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
                credentials: 'include',
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

    // 強化された再接続ユーティリティ
    const reconnect = useCallback(
        async (force = false) => {
            // 強制再接続の場合、カウンターをリセット
            if (force) {
                setState((prev) => ({...prev, reconnectAttempts: 0}));
            }

            try {
                // 既存のセッションをクリーンアップ
                console.log('[useConnection] Cleaning up session before forced reconnect');
                await fetch('/api/postgres/connect', {
                    method: 'DELETE',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                    },
                    credentials: 'include',
                });

                // 少し待機
                await new Promise((r) => setTimeout(r, 300));

                // 接続情報を取得して再接続
                const info = getActiveConnectionInfo();
                if (info) {
                    return await connect(info);
                }
            } catch (error) {
                console.error('[useConnection] Forced reconnect failed:', error);
            }
            return false;
        },
        [connect, getActiveConnectionInfo],
    );

    return {
        ...state,
        activeConnection,
        activeConnectionInfo: getActiveConnectionInfo(),
        checkConnection,
        disconnect,
        connect,
        reconnect,
    };
}
