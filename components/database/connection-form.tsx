'use client';

import type {ConnectionInfo} from '@/types/database';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Card, CardBody, CardFooter, CardHeader} from '@heroui/card';
import {Input} from '@heroui/input';
import {Button} from '@heroui/button';
import {Select, SelectItem} from '@heroui/select';
import {Database, Save, Trash2} from 'lucide-react';

import {useConnectionStore} from '@/lib/utils/connection-store';
import {useConnection} from '@/lib/hook/use-connection';

interface ConnectionFormProps {
    onConnected?: () => void;
    defaultConnection?: string;
}

const DEFAULT_PORT = '5432';

export function ConnectionForm({onConnected, defaultConnection}: ConnectionFormProps) {
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

    const {connect} = useConnection();
    const {connections, addConnection, getConnection, removeConnection, setActiveConnection} = useConnectionStore();

    useEffect(() => {
        if (defaultConnection && connections[defaultConnection]) {
            handleConnectionSelect(defaultConnection);
        }
    }, [defaultConnection, connections]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | {target: {name: string; value: string}}) => {
        const {name, value} = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        setSuccessMessage('');
    };

    const handleConnectionSelect = (value: string) => {
        if (!value) return;

        const connection = getConnection(value);

        if (connection) {
            setFormData({
                host: connection.host,
                port: connection.port,
                database: connection.database,
                username: connection.username,
                password: connection.password,
            });
            setConnectionName(value);
            setError('');
            setSuccessMessage('');
        }
    };

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const connected = await connect(formData);

            if (connected) {
                setActiveConnection(connectionName);
                if (onConnected) {
                    onConnected();
                } else {
                    router.push('/dashboard');
                }
            } else {
                throw new Error('接続に失敗しました');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '接続に失敗しました。入力情報を確認してください。');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!successMessage) return;

        const timer = setTimeout(() => {
            setSuccessMessage('');
        }, 3000);

        return () => clearTimeout(timer);
    }, [successMessage]);

    return (
        <Card className='w-full'>
            <CardHeader className='pb-0'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        <Database className='h-6 w-6' />
                        <h1 className='text-xl font-bold'>StagRDB Web Console</h1>
                    </div>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardBody className='gap-4'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='savedConnections'
                            className='text-sm font-medium'>
                            保存済みの接続
                        </label>
                        <Select
                            id='savedConnections'
                            placeholder='接続を選択'
                            selectedKeys={connectionName ? [connectionName] : []}
                            onChange={(e) => handleConnectionSelect(e.target.value)}>
                            {Object.entries(connections).map(([name, connection]) => (
                                <SelectItem key={name}>
                                    {name} ({connection.host})
                                </SelectItem>
                            ))}
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <label
                            className='text-sm font-medium'
                            htmlFor='connectionName'>
                            接続名
                        </label>
                        <Input
                            id='connectionName'
                            placeholder='接続名を入力'
                            value={connectionName}
                            onChange={(e) => setConnectionName(e.target.value)}
                        />
                    </div>

                    <div className='space-y-2'>
                        <label
                            className='text-sm font-medium'
                            htmlFor='host'>
                            ホスト名
                        </label>
                        <Input
                            required
                            id='host'
                            name='host'
                            placeholder='localhost'
                            value={formData.host}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className='space-y-2'>
                        <label
                            className='text-sm font-medium'
                            htmlFor='port'>
                            ポート
                        </label>
                        <Input
                            required
                            id='port'
                            name='port'
                            placeholder='5432'
                            value={formData.port}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className='space-y-2'>
                        <label
                            className='text-sm font-medium'
                            htmlFor='database'>
                            データベース名
                        </label>
                        <Input
                            required
                            id='database'
                            name='database'
                            placeholder='postgres'
                            value={formData.database}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className='space-y-2'>
                        <label
                            className='text-sm font-medium'
                            htmlFor='username'>
                            ユーザー名
                        </label>
                        <Input
                            required
                            id='username'
                            name='username'
                            placeholder='postgres'
                            value={formData.username}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className='space-y-2'>
                        <label
                            className='text-sm font-medium'
                            htmlFor='password'>
                            パスワード
                        </label>
                        <Input
                            required
                            id='password'
                            name='password'
                            type='password'
                            value={formData.password}
                            onChange={handleInputChange}
                        />
                    </div>

                    {error && (
                        <div className='rounded-md bg-danger-50 p-3 text-danger'>
                            <p className='text-sm'>{error}</p>
                        </div>
                    )}

                    {successMessage && (
                        <div className='rounded-md bg-success-50 p-3 text-success'>
                            <p className='text-sm'>{successMessage}</p>
                        </div>
                    )}
                </CardBody>

                <CardFooter>
                    <div className='flex w-full space-x-2'>
                        <Button
                            className='flex-1'
                            color='primary'
                            isDisabled={isLoading}
                            isLoading={isLoading}
                            type='submit'>
                            {isLoading ? '接続中...' : '接続'}
                        </Button>

                        <Button
                            isDisabled={isSaving || !connectionName.trim()}
                            startContent={<Save className='h-4 w-4' />}
                            type='button'
                            variant='flat'
                            onPress={handleSaveConnection}>
                            保存
                        </Button>

                        {connectionName && (
                            <Button
                                isIconOnly
                                color='danger'
                                type='button'
                                variant='light'
                                onPress={() => handleDeleteConnection(connectionName)}>
                                <Trash2 className='h-4 w-4' />
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
