'use client';

import React, {useEffect, useState} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Input, Textarea} from '@heroui/input';
import {Button} from '@heroui/button';
import {Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from '@heroui/dropdown';
import {Tab, Tabs} from '@heroui/tabs';
import {Chip} from '@heroui/chip';
import {Spinner} from '@heroui/spinner';
import {ChevronDown, FileText, Play, Save, Trash2} from 'lucide-react';
import {useQuery} from '@/lib/hook/use-query';

interface SavedQuery {
    id: string;
    name: string;
    query: string;
    createdAt: string;
    tags?: string[];
}

interface QueryEditorProps {
    onResultsChange?: (results: any) => void;
}

export function QueryEditor({onResultsChange}: QueryEditorProps) {
    const {execute, results, isLoading, error, clearResults} = useQuery();

    const [query, setQuery] = useState<string>('');
    const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
    const [queryName, setQueryName] = useState<string>('');
    const [queryTags, setQueryTags] = useState<string>('');
    const [selectedTab, setSelectedTab] = useState<string>('editor');
    const [loadedQueryId, setLoadedQueryId] = useState<string | null>(null);

    const snippets = [
        {
            name: 'テーブル一覧',
            query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
        },
        {
            name: 'テーブル構造',
            query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'table_name' ORDER BY ordinal_position;",
        },
        {name: 'レコード数', query: 'SELECT COUNT(*) FROM table_name;'},
        {
            name: 'テーブル作成',
            query: 'CREATE TABLE table_name (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);',
        },
        {name: 'インデックス一覧', query: "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'table_name';"},
    ];

    // LocalStorageから保存クエリを読み込む
    useEffect(() => {
        const saved = localStorage.getItem('saved-queries');

        if (saved) {
            try {
                setSavedQueries(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved queries:', e);
            }
        }
    }, []);

    // 結果が更新されたときに親コンポーネントに通知
    useEffect(() => {
        if (onResultsChange && results) {
            console.log('[QueryEditor] 親コンポーネントに結果を通知:', results);
            onResultsChange(results);
        }
    }, [results, onResultsChange]);

    // クエリ実行
    const executeCurrentQuery = async () => {
        if (!query.trim()) return;

        try {
            console.log('クエリを実行:', query);
            await execute(query);
        } catch (err) {
            console.error('クエリ実行エラー:', err);
        }
    };

    // クエリ保存
    const saveCurrentQuery = () => {
        if (!query.trim() || !queryName.trim()) return;

        const tags = queryTags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

        const newQuery: SavedQuery = {
            id: Date.now().toString(),
            name: queryName,
            query: query,
            createdAt: new Date().toISOString(),
            tags: tags.length > 0 ? tags : undefined,
        };

        const updatedQueries = [...savedQueries, newQuery];

        setSavedQueries(updatedQueries);
        localStorage.setItem('saved-queries', JSON.stringify(updatedQueries));

        setQueryName('');
        setQueryTags('');
        setLoadedQueryId(newQuery.id);
    };

    // 保存済みクエリの更新
    const updateSavedQuery = () => {
        if (!loadedQueryId || !query.trim()) return;

        const updatedQueries = savedQueries.map((sq) =>
            sq.id === loadedQueryId
                ? {
                      ...sq,
                      query: query,
                      tags: queryTags
                          .split(',')
                          .map((t) => t.trim())
                          .filter((t) => t.length > 0),
                  }
                : sq,
        );

        setSavedQueries(updatedQueries);
        localStorage.setItem('saved-queries', JSON.stringify(updatedQueries));
    };

    // クエリ読み込み
    const loadQuery = (id: string) => {
        const selected = savedQueries.find((q) => q.id === id);

        if (selected) {
            setQuery(selected.query);
            setQueryName(selected.name);
            setQueryTags(selected.tags?.join(', ') || '');
            setLoadedQueryId(id);
            setSelectedTab('editor');
        }
    };

    // クエリ削除
    const deleteQuery = (id: string) => {
        const updatedQueries = savedQueries.filter((q) => q.id !== id);

        setSavedQueries(updatedQueries);
        localStorage.setItem('saved-queries', JSON.stringify(updatedQueries));

        if (loadedQueryId === id) {
            setLoadedQueryId(null);
        }
    };

    // スニペット挿入
    const insertSnippet = (snippetQuery: string) => {
        setQuery((prev) => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n') + snippetQuery);
    };

    // キーボードイベントハンドラ
    const handleKeyDown = (event: React.KeyboardEvent, callback: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    };

    return (
        <Card>
            <CardHeader className='pb-0'>
                <div className='flex items-center justify-between'>
                    <h3 className='text-xl font-bold'>クエリエディタ</h3>
                    <div className='mx-3 flex'>
                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    endContent={<ChevronDown size={16} />}
                                    variant='flat'>
                                    スニペット
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label='SQL snippets'>
                                {snippets.map((snippet, index) => (
                                    <DropdownItem
                                        key={index}
                                        onPress={() => insertSnippet(snippet.query)}>
                                        {snippet.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            </CardHeader>
            <CardBody>
                <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={setSelectedTab as any}>
                    <Tab
                        key='editor'
                        title='エディタ'>
                        <div className='space-y-4 py-2'>
                            <Textarea
                                className='min-h-[200px] font-mono text-base'
                                placeholder='SELECT * FROM your_table;'
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />

                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                <div className='flex flex-wrap items-center gap-2'>
                                    <Input
                                        className='max-w-[200px]'
                                        placeholder='クエリ名'
                                        type='text'
                                        value={queryName}
                                        onChange={(e) => setQueryName(e.target.value)}
                                    />
                                    <Input
                                        className='max-w-[250px]'
                                        placeholder='タグ (カンマ区切り)'
                                        type='text'
                                        value={queryTags}
                                        onChange={(e) => setQueryTags(e.target.value)}
                                    />
                                    {loadedQueryId ? (
                                        <Button
                                            color='primary'
                                            isDisabled={!query.trim()}
                                            startContent={<Save size={16} />}
                                            variant='flat'
                                            onPress={updateSavedQuery}>
                                            更新
                                        </Button>
                                    ) : (
                                        <Button
                                            color='primary'
                                            isDisabled={!query.trim() || !queryName.trim()}
                                            startContent={<Save size={16} />}
                                            variant='flat'
                                            onPress={saveCurrentQuery}>
                                            保存
                                        </Button>
                                    )}
                                </div>
                                <Button
                                    color='primary'
                                    isDisabled={!query.trim() || isLoading}
                                    startContent={isLoading ? <Spinner size='sm' /> : <Play size={16} />}
                                    onPress={executeCurrentQuery}>
                                    {isLoading ? '実行中...' : '実行'}
                                </Button>
                            </div>
                        </div>
                    </Tab>
                    <Tab
                        key='saved'
                        title='保存済みクエリ'>
                        <div className='py-2'>
                            {savedQueries.length === 0 ? (
                                <p className='py-4 text-default-500'>保存済みクエリはありません</p>
                            ) : (
                                <div className='space-y-2'>
                                    {savedQueries.map((savedQuery) => (
                                        <div
                                            key={savedQuery.id}
                                            className={`flex items-center justify-between rounded-md p-3 transition-colors ${
                                                loadedQueryId === savedQuery.id
                                                    ? 'bg-primary-100 dark:bg-primary-900/30'
                                                    : 'hover:bg-default-100 dark:hover:bg-default-50/10'
                                            }`}>
                                            <div className='flex-1'>
                                                <button
                                                    className='w-full cursor-pointer text-left font-medium'
                                                    onClick={() => loadQuery(savedQuery.id)}
                                                    onKeyDown={(e) => handleKeyDown(e, () => loadQuery(savedQuery.id))}
                                                    aria-label={`クエリ読み込み: ${savedQuery.name}`}>
                                                    {savedQuery.name}
                                                </button>
                                                <div className='mt-1 flex flex-wrap gap-1'>
                                                    {savedQuery.tags?.map((tag) => (
                                                        <Chip
                                                            key={tag}
                                                            size='sm'
                                                            variant='flat'>
                                                            {tag}
                                                        </Chip>
                                                    ))}
                                                </div>
                                                <div className='mt-1 text-xs text-default-400'>{new Date(savedQuery.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className='flex gap-2'>
                                                <Button
                                                    isIconOnly
                                                    color='primary'
                                                    size='sm'
                                                    variant='light'
                                                    onClick={() => loadQuery(savedQuery.id)}
                                                    aria-label={`クエリを読み込む: ${savedQuery.name}`}>
                                                    <FileText size={16} />
                                                </Button>
                                                <Button
                                                    isIconOnly
                                                    color='danger'
                                                    size='sm'
                                                    variant='light'
                                                    onClick={() => deleteQuery(savedQuery.id)}
                                                    aria-label={`クエリを削除: ${savedQuery.name}`}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>

                {error && (
                    <div className='mt-4 rounded-md bg-danger-50 p-3 text-danger'>
                        <p className='font-medium'>エラー:</p>
                        <p className='whitespace-pre-wrap font-mono text-sm'>{error}</p>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
