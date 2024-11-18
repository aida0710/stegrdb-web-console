'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Database, Save, TestTube, Trash2} from 'lucide-react';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useConnectionStore} from '@/lib/connection-store';
import type {ConnectionInfo} from '@/types/database';

const DEFAULT_PORT = '5432';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<ConnectionInfo>({
        host: '',
        port: DEFAULT_PORT,
        database: '',
        username: '',
        password: '',
    });

    const [connectionName, setConnectionName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isTesting, setIsTesting] = useState<boolean>(false);

    const {connections, addConnection, getConnection, removeConnection, setActiveConnection} = useConnectionStore();

    // フォーム入力の処理
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        setSuccessMessage('');
    };

    // 保存済み接続の選択
    const handleConnectionSelect = (name: string) => {
        const connection = getConnection(name);
        if (connection) {
            setFormData({
                host: connection.host,
                port: connection.port,
                database: connection.database,
                username: connection.username,
                password: connection.password,
            });
            setConnectionName(name);
            setError('');
            setSuccessMessage('');
        }
    };

    // 接続情報の保存
    const handleSaveConnection = async () => {
        if (!connectionName.trim()) {
            setError('接続名を入力してください');
            return;
        }

        setIsSaving(true);
        try {
            addConnection(connectionName, formData);
            setSuccessMessage('接続情報を保存しました');
            setError('');
        } catch (err) {
            setError('接続情報の保存に失敗しました');
        } finally {
            setIsSaving(false);
        }
    };

    // 接続情報の削除
    const handleDeleteConnection = (name: string) => {
        try {
            removeConnection(name);
            if (name === connectionName) {
                setConnectionName('');
                setFormData({
                    host: '',
                    port: DEFAULT_PORT,
                    database: '',
                    username: '',
                    password: '',
                });
            }
            setSuccessMessage('接続情報を削除しました');
            setError('');
        } catch (err) {
            setError('接続情報の削除に失敗しました');
        }
    };

    // 接続テスト
    const handleTestConnection = async () => {
        setIsTesting(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/postgres/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccessMessage('接続テストに成功しました');
            } else {
                throw new Error(data.message || '接続テストに失敗しました');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '接続テストに失敗しました');
        } finally {
            setIsTesting(false);
        }
    };

    // 接続処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/postgres/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '接続に失敗しました');
            }

            setActiveConnection(connectionName);
            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : '接続に失敗しました。入力情報を確認してください。');
        } finally {
            setIsLoading(false);
        }
    };

    // メッセージのクリア
    useEffect(() => {
        const timer = setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    return (
        <div className='flex min-h-screen items-center justify-center p-4'>
            <Card className='w-full max-w-xl'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-2'>
                            <Database className='h-6 w-6' />
                            <CardTitle>RDB Tunnel Web Console</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className='mb-4'>
                        <Label>保存済みの接続</Label>
                        <div className='flex space-x-2'>
                            <Select
                                onValueChange={handleConnectionSelect}
                                value={connectionName}>
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder='接続を選択' />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(connections).map(([name, connection]) => (
                                        <SelectItem
                                            key={name}
                                            value={name}>
                                            {name} ({connection.host})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='connectionName'>接続名</Label>
                            <Input
                                id='connectionName'
                                value={connectionName}
                                onChange={(e) => setConnectionName(e.target.value)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='host'>ホスト名</Label>
                            <Input
                                id='host'
                                name='host'
                                value={formData.host}
                                onChange={handleInputChange}
                                placeholder='localhost'
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='port'>ポート</Label>
                            <Input
                                id='port'
                                name='port'
                                value={formData.port}
                                onChange={handleInputChange}
                                placeholder='5432'
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='database'>データベース名</Label>
                            <Input
                                id='database'
                                name='database'
                                value={formData.database}
                                onChange={handleInputChange}
                                placeholder='postgres'
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='username'>ユーザー名</Label>
                            <Input
                                id='username'
                                name='username'
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder='postgres'
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='password'>パスワード</Label>
                            <Input
                                id='password'
                                name='password'
                                type='password'
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        {error && (
                            <Alert variant='destructive'>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {successMessage && (
                            <Alert>
                                <AlertDescription>{successMessage}</AlertDescription>
                            </Alert>
                        )}

                        <div className='flex space-x-2'>
                            <Button
                                type='submit'
                                className='flex-1'
                                disabled={isLoading}>
                                {isLoading ? '接続中...' : '接続'}
                            </Button>

                            <Button
                                type='button'
                                variant='outline'
                                onClick={handleSaveConnection}
                                disabled={isSaving}>
                                <Save className='mr-2 h-4 w-4' />
                                保存
                            </Button>

                            <Button
                                type='button'
                                variant='outline'
                                onClick={handleTestConnection}
                                disabled={isTesting}>
                                <TestTube className='mr-2 h-4 w-4' />
                                テスト
                            </Button>

                            {connectionName && (
                                <Button
                                    type='button'
                                    variant='destructive'
                                    onClick={() => handleDeleteConnection(connectionName)}>
                                    <Trash2 className='h-4 w-4' />
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
