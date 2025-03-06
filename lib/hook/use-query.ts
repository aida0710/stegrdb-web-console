import {useCallback, useState} from 'react';

interface QueryResult {
    rows: any[];
    fields: {
        name: string;
        dataTypeID: number;
        tableID: number;
    }[];
    rowCount: number;
    command: string;
    executionTime: number;
}

interface UseQueryResult {
    execute: (query: string) => Promise<void>;
    results: QueryResult | null;
    isLoading: boolean;
    error: string | null;
    clearResults: () => void;
    rawResponse: any | null;
}

export function useQuery(): UseQueryResult {
    const [results, setResults] = useState<QueryResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [rawResponse, setRawResponse] = useState<any | null>(null); // デバッグ用に追加

    const execute = useCallback(async (query: string): Promise<void> => {
        if (!query.trim()) {
            setError('クエリが空です');
            return;
        }

        setIsLoading(true);
        setError(null);
        setRawResponse(null);

        try {
            console.log(`実行: ${query}`);

            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
                body: JSON.stringify({query}),
            });

            const data = await response.json();
            setRawResponse(data);

            console.log('APIレスポンス:', data);

            if (!response.ok || !data.success) {
                throw new Error(data.message || data.error || 'クエリ実行中にエラーが発生しました');
            }

            // 結果の検証
            if (!data.results) {
                throw new Error('APIから結果が返されませんでした');
            }

            if (data.results.rows && data.results.rows.length === 1 && Object.keys(data.results.rows[0]).length === 1) {
                console.log('集計クエリの結果を検出:', data.results.rows[0]);
            }

            setResults(data.results);
        } catch (err) {
            console.error('エラー:', err);
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearResults = useCallback((): void => {
        setResults(null);
        setError(null);
        setRawResponse(null);
    }, []);

    return {
        execute,
        results,
        isLoading,
        error,
        clearResults,
        rawResponse,
    };
}
