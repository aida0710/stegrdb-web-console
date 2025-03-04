export interface ConnectionInfo {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
}

export interface SavedConnection extends ConnectionInfo {
    name: string;
    lastUsed: Date;
    createdAt: Date;
    lastError?: string;
    retryCount?: number;
}

export interface ConnectionResponse {
    success: boolean;
    message: string;
    error?: string;
    sessionId?: string;
    details?: {
        serverVersion?: string;
        connectedAt: Date;
        timeout?: number;
    };
}

export interface ConnectionError extends Error {
    code?: string;
    severity?: string;
    details?: unknown;
}