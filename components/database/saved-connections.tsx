'use client';

import type {SavedConnection} from '@/types/database';

import React from 'react';
import {Card, CardHeader, CardBody} from '@heroui/card';
import {Button} from '@heroui/button';
import {Database, Calendar, Trash2, ExternalLink} from 'lucide-react';

import {useConnectionStore} from '@/lib/utils/connection-store';

interface SavedConnectionsProps {
    onSelect: (connectionName: string) => void;
    onDelete: (connectionName: string) => void;
}

export function SavedConnections({onSelect, onDelete}: SavedConnectionsProps) {
    const {connections, activeConnection} = useConnectionStore();

    // 接続が保存されていない場合
    if (Object.keys(connections).length === 0) {
        return (
            <Card>
                <CardHeader>
                    <h2 className='text-xl font-bold'>保存済み接続</h2>
                </CardHeader>
                <CardBody>
                    <p className='text-default-500'>保存された接続はありません。</p>
                    <p className='mt-2 text-sm'>接続フォームから新しい接続を作成し、保存ボタンをクリックすると、ここに表示されます。</p>
                </CardBody>
            </Card>
        );
    }

    // 日付フォーマット用関数
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card>
            <CardHeader>
                <h2 className='text-xl font-bold'>保存済み接続</h2>
            </CardHeader>
            <CardBody>
                <div className='space-y-4'>
                    {Object.entries(connections).map(([name, connection]) => (
                        <ConnectionItem
                            key={name}
                            connection={connection}
                            isActive={name === activeConnection}
                            onDelete={() => onDelete(name)}
                            onSelect={() => onSelect(name)}
                        />
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

interface ConnectionItemProps {
    connection: SavedConnection;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

function ConnectionItem({connection, isActive, onSelect, onDelete}: ConnectionItemProps) {
    // 最終使用日のフォーマット
    const lastUsed = new Date(connection.lastUsed).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div
            className={`rounded-lg border p-4 transition-colors ${
                isActive ? 'border-primary bg-primary-50 dark:bg-primary-900/20' : 'border-default-200 hover:border-primary-300 hover:bg-default-50'
            }`}>
            <div className='flex items-start justify-between'>
                <div className='flex-1'>
                    <div className='flex items-center gap-2'>
                        <Database className='h-5 w-5 text-primary' />
                        <h3 className='font-medium'>{connection.name}</h3>
                        {isActive && (
                            <span className='inline-flex items-center rounded-full bg-success-100 px-2 py-1 text-xs font-medium text-success-800'>
                                アクティブ
                            </span>
                        )}
                    </div>

                    <div className='mt-2 space-y-1 text-sm text-default-600'>
                        <p>
                            <span className='font-medium'>ホスト:</span> {connection.host}:{connection.port}
                        </p>
                        <p>
                            <span className='font-medium'>データベース:</span> {connection.database}
                        </p>
                        <p>
                            <span className='font-medium'>ユーザー:</span> {connection.username}
                        </p>
                        <div className='mt-2 flex items-center gap-1 text-xs text-default-400'>
                            <Calendar className='h-3 w-3' />
                            <span>最終使用: {lastUsed}</span>
                        </div>

                        {connection.lastError && (
                            <div className='mt-2 rounded bg-danger-50 p-2 text-xs text-danger-600'>
                                <p className='font-medium'>前回のエラー:</p>
                                <p>{connection.lastError}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex flex-col gap-2'>
                    <Button
                        isIconOnly
                        color='primary'
                        size='sm'
                        title='この接続を使用'
                        variant='flat'
                        onPress={onSelect}>
                        <ExternalLink size={16} />
                    </Button>

                    <Button
                        isIconOnly
                        color='danger'
                        size='sm'
                        title='この接続を削除'
                        variant='light'
                        onPress={onDelete}>
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>
        </div>
    );
}
