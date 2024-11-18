import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import CryptoJS from 'crypto-js';
import type {ConnectionInfo, SavedConnection} from '@/types/database';

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'your-fallback-key';

interface ConnectionStore {
    connections: Record<string, SavedConnection>;
    activeConnection: string | null;
    addConnection: (name: string, info: ConnectionInfo) => void;
    getConnection: (name: string) => SavedConnection | null;
    removeConnection: (name: string) => void;
    setActiveConnection: (name: string | null) => void;
    clearConnections: () => void;
}

// 暗号化/復号化のヘルパー関数
const encrypt = (text: string): string => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (ciphertext: string): string => {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
};

export const useConnectionStore = create<ConnectionStore>()(
    persist(
        (set, get) => ({
            connections: {},
            activeConnection: null,

            addConnection: (name, info) => {
                const encrypted: SavedConnection = {
                    ...info,
                    name,
                    password: encrypt(info.password),
                    lastUsed: new Date(),
                };

                set((state) => ({
                    connections: {
                        ...state.connections,
                        [name]: encrypted,
                    },
                }));
            },

            getConnection: (name) => {
                const connection = get().connections[name];
                if (!connection) return null;

                return {
                    ...connection,
                    password: decrypt(connection.password),
                };
            },

            removeConnection: (name) => {
                set((state) => {
                    const newConnections = {...state.connections};
                    delete newConnections[name];
                    return {
                        connections: newConnections,
                        activeConnection: state.activeConnection === name ? null : state.activeConnection,
                    };
                });
            },

            setActiveConnection: (name) => {
                set({activeConnection: name});
            },

            clearConnections: () => {
                set({connections: {}, activeConnection: null});
            },
        }),
        {
            name: 'postgres-connections',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                connections: state.connections,
                // activeConnectionは保存しない
            }),
        },
    ),
);
