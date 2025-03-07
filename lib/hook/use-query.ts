'use client';

import { useState, useCallback, useRef } from 'react';

export function useQuery() {
    const [results, setResults] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // 最後に実行されたクエリを保存
    const lastQueryRef = useRef<string>('');

    // コンソールに実行情報をログ出力する関数
    const logQueryExecution = useCallback((action: string, data: any) => {
        console.log(`[useQuery][${action}]`, data);
    }, []);

    // 結果をクリア
    const clearResults = useCallback(() => {
        logQueryExecution('clearResults', { previous: results });
        setResults(null);
        setError(null);
    }, [results, logQueryExecution]);

    // クエリ実行
    const execute = useCallback(async (query: string) => {
        if (!query.trim()) {
            return;
        }

        lastQueryRef.current = query;
        setIsLoading(true);
        setError(null);

        logQueryExecution('execute:start', { query });

        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            const data = await response.json();
            logQueryExecution('execute:response', data);

            if (data.success) {
                setResults(data.results);
                logQueryExecution('execute:success', { results: data.results });
            } else {
                setError(data.error || data.message || '不明なエラーが発生しました');
                setResults(null);
                logQueryExecution('execute:error', { error: data.error || data.message });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
            setError(errorMessage);
            setResults(null);
            logQueryExecution('execute:exception', { error: errorMessage });
        } finally {
            setIsLoading(false);
            logQueryExecution('execute:complete', { query, hasResults: !!results });
        }
    }, [logQueryExecution]);

    // 最後に実行したクエリを再実行する関数
    const reExecuteLastQuery = useCallback(async () => {
        if (lastQueryRef.current) {
            logQueryExecution('reExecuteLastQuery', { query: lastQueryRef.current });
            await execute(lastQueryRef.current);
        }
    }, [execute, logQueryExecution]);

    return {
        results,
        isLoading,
        error,
        execute,
        clearResults,
        reExecuteLastQuery,
        lastQuery: lastQueryRef.current
    };
}