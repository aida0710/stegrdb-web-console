export interface ConnectionInfo {
    host: string;
    port: string;
    database: string;
    username: string;
    password: string;
}

export interface SavedConnection extends ConnectionInfo {
    name: string;
    lastUsed?: Date;
}

export interface ConnectionResponse {
    success: boolean;
    message: string;
    error?: string;
    sessionId?: string;
}
