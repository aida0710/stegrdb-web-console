import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ConnectionInfo, SavedConnection } from '@/types/database';

interface ConnectionState {
    connections: Record<string, SavedConnection>;
    activeConnection: string | null;
}

interface ConnectionActions {
    addConnection: (name: string, info: ConnectionInfo) => void;
    getConnection: (name: string) => SavedConnection | null;
    removeConnection: (name: string) => void;
    setActiveConnection: (name: string | null) => void;
    clearConnections: () => void;
    updateConnectionStatus: (name: string, error?: string) => void;
}

type ConnectionStore = ConnectionState & ConnectionActions;

// 初期状態を定義
const initialState: ConnectionState = {
    connections: {},
    activeConnection: null,
};

export const useConnectionStore = create<ConnectionStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            addConnection: (name, info) => {
                const now = new Date();
                const savedConnection: SavedConnection = {
                    ...info,
                    name,
                    lastUsed: now,
                    createdAt: now,
                    retryCount: 0,
                };

                set((state) => ({
                    connections: {
                        ...state.connections,
                        [name]: savedConnection,
                    },
                }));
            },

            getConnection: (name) => {
                const connection = get().connections[name];
                if (!connection) return null;
                return connection;
            },

            removeConnection: (name) => {
                set((state) => {
                    const { [name]: removed, ...newConnections } = state.connections;
                    return {
                        connections: newConnections,
                        activeConnection: state.activeConnection === name ? null : state.activeConnection,
                    };
                });
            },

            setActiveConnection: (name) => {
                if (name !== null && !get().connections[name]) {
                    throw new Error(`Connection ${name} not found`);
                }
                set({ activeConnection: name });
            },

            clearConnections: () => {
                set(initialState);
            },

            updateConnectionStatus: (name, error?) => {
                set((state) => {
                    const connection = state.connections[name];
                    if (!connection) return state;

                    return {
                        connections: {
                            ...state.connections,
                            [name]: {
                                ...connection,
                                lastUsed: new Date(),
                                lastError: error,
                                retryCount: error
                                    ? (connection.retryCount || 0) + 1
                                    : 0,
                            },
                        },
                    };
                });
            },
        }),
        {
            name: 'postgres-connections',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                connections: state.connections,
                activeConnection: state.activeConnection,
            }),
        },
    ),
);