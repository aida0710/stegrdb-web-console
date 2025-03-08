'use client';

import React, {useEffect, useState} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Button} from '@heroui/button';
import {Input, Textarea} from '@heroui/input';
import {Spinner} from '@heroui/spinner';
import {Plus, Trash2} from 'lucide-react';
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/table';
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from '@heroui/modal';

interface Node {
    id: number;
    name: string;
    description: string;
}

export default function ImprovedNodeSettings() {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newNode, setNewNode] = useState<Partial<Node>>({id: 0, name: '', description: ''});

    // Modal controls
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

    // ノードデータを読み込む
    const loadNodes = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'SELECT id, name, description FROM node_list ORDER BY id',
                }),
            });

            const data = await response.json();
            console.log('Node query response:', data);

            if (!response.ok) {
                setError('ノード一覧の読み込みに失敗しました。');
                return;
            }

            if (data.success && data.results && data.results.rows) {
                setNodes(data.results.rows);
            } else {
                setError('データの形式が不正です。');
            }
        } catch (err) {
            console.error('Error loading nodes:', err);
            setError('ノード一覧の読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    // ノードを追加する
    const addNode = async () => {
        if (!newNode.id || !newNode.name) {
            setError('ノードIDと名前は必須です。');
            return;
        }

        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        INSERT INTO node_list (id, name, description)
                        VALUES (${newNode.id}, '${newNode.name}', '${newNode.description || ''}')
                        ON CONFLICT
                            (id)
                        DO NOTHING
                    `,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError('ノードの追加に失敗しました。');
                return;
            }

            // 追加成功したらリストを更新
            await loadNodes();

            // フォームをリセット
            setNewNode({id: 0, name: '', description: ''});

            // モーダルを閉じる
            onClose();
        } catch (err) {
            console.error('Error adding node:', err);
            setError('ノードの追加に失敗しました。');
        }
    };

    // ノードを削除する
    const deleteNode = async (id: number) => {
        try {
            // まず関連テーブルからの削除
            await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        DELETE
                        FROM node_activity
                        WHERE node_id = ${id};
                        DELETE
                        FROM firewall_settings
                        WHERE node_id = ${id};
                    `,
                }),
            });

            // 次にノード自体を削除
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `DELETE
                            FROM node_list
                            WHERE id = ${id}`,
                }),
            });

            if (!response.ok) {
                setError('ノードの削除に失敗しました。');
                return;
            }

            // 削除成功したらリストを更新
            await loadNodes();

            // モーダルを閉じる
            onDeleteClose();
        } catch (err) {
            console.error('Error deleting node:', err);
            setError('ノードの削除に失敗しました。');
        }
    };

    // 入力フィールドの変更を処理
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setNewNode((prev) => ({
            ...prev,
            [name]: name === 'id' ? parseInt(value) || 0 : value,
        }));
    };

    // 削除確認ダイアログを表示
    const confirmDelete = (id: number) => {
        setDeleteConfirmId(id);
        onDeleteOpen();
    };

    // コンポーネントマウント時にデータ読み込み
    useEffect(() => {
        loadNodes();
    }, []);

    if (loading && nodes.length === 0) {
        return (
            <div className='flex h-40 items-center justify-center'>
                <Spinner size='lg' />
                <p className='ml-2'>ノード情報を読み込み中...</p>
            </div>
        );
    }

    return (
        <div className='space-y-6'>
            {error && (
                <div className='rounded-md bg-danger-50 p-3 text-danger'>
                    <p>{error}</p>
                </div>
            )}

            <Card shadow='none'>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <h3 className='text-lg font-semibold'>ノード一覧</h3>
                        <Button
                            color='primary'
                            startContent={<Plus size={16} />}
                            onPress={onOpen}>
                            新しいノードを追加
                        </Button>
                    </div>
                </CardHeader>
                <CardBody>
                    {nodes.length === 0 ? (
                        <p className='py-4 text-center text-default-500'>ノードがありません。上の「新しいノードを追加」ボタンから追加してください。</p>
                    ) : (
                        <Table aria-label='ノード一覧'>
                            <TableHeader>
                                <TableColumn>ID</TableColumn>
                                <TableColumn>名前</TableColumn>
                                <TableColumn>説明</TableColumn>
                                <TableColumn>アクション</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {nodes.map((node) => (
                                    <TableRow key={node.id}>
                                        <TableCell>{node.id}</TableCell>
                                        <TableCell>{node.name}</TableCell>
                                        <TableCell>
                                            <div className='max-w-md'>{node.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                color='danger'
                                                variant='light'
                                                size='md'
                                                onPress={() => confirmDelete(node.id)}>
                                                <div className='flex items-center gap-1'>
                                                    <Trash2 size={16} />
                                                    <p>削除</p>
                                                </div>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* 新規ノード追加モーダル */}
            <Modal
                isOpen={isOpen}
                onClose={onClose}>
                <ModalContent>
                    <ModalHeader>新しいノードを追加</ModalHeader>
                    <ModalBody>
                        <div className='space-y-4'>
                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='nodeId'>
                                    ノードID (必須)
                                </label>
                                <Input
                                    id='nodeId'
                                    name='id'
                                    type='number'
                                    placeholder='例: 153'
                                    value={newNode.id?.toString() || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='nodeName'>
                                    ノード名 (必須)
                                </label>
                                <Input
                                    id='nodeName'
                                    name='name'
                                    placeholder='例: Application Server'
                                    value={newNode.name || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='nodeDescription'>
                                    説明
                                </label>
                                <Textarea
                                    id='nodeDescription'
                                    name='description'
                                    placeholder='このノードの説明を入力してください'
                                    value={newNode.description || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color='default'
                            variant='light'
                            onPress={onClose}>
                            キャンセル
                        </Button>
                        <Button
                            color='primary'
                            onPress={addNode}>
                            追加
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* 削除確認モーダル */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={onDeleteClose}>
                <ModalContent>
                    <ModalHeader>ノードの削除</ModalHeader>
                    <ModalBody>
                        <p>本当にこのノード (ID: {deleteConfirmId}) を削除しますか？</p>
                        <p className='mt-2 text-danger'>この操作は元に戻せません。関連するファイアウォール設定も削除されます。</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color='default'
                            variant='light'
                            onPress={onDeleteClose}>
                            キャンセル
                        </Button>
                        <Button
                            color='danger'
                            onPress={() => deleteConfirmId && deleteNode(deleteConfirmId)}>
                            削除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
