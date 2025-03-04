import {useState} from 'react';

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
}

export function useQuery(): UseQueryResult {
    const [results, setResults] = useState<QueryResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const execute = async (query: string): Promise<void> => {
        if (!query.trim()) {
            setError('クエリが空です');

            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({query}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'クエリ実行中にエラーが発生しました');
            }

            setResults(data.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    };

    const clearResults = (): void => {
        setResults(null);
        setError(null);
    };

    return {
        execute,
        results,
        isLoading,
        error,
        clearResults,
    };
}
