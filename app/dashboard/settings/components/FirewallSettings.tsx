'use client';

import React, {useEffect, useState} from 'react';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {Button} from '@heroui/button';
import {Input} from '@heroui/input';
import {Spinner} from '@heroui/spinner';
import {Plus, Trash2} from 'lucide-react';
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/table';
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from '@heroui/modal';
import {Select, SelectItem} from '@heroui/select';
import {Chip} from '@heroui/chip';

interface FirewallRule {
    id: number;
    node_id: number | null;
    filter_type: string;
    filter_value: string;
    priority: number;
    policy: string;
    node_name?: string;
}

interface Node {
    id: number;
    name: string;
}

const FILTER_TYPES = ['SrcIpAddress', 'DstIpAddress', 'SrcPort', 'DstPort', 'EtherType', 'IpProtocol'];
const POLICIES = ['Whitelist', 'Blacklist'];

export default function ImprovedFirewallSettings() {
    const [rules, setRules] = useState<FirewallRule[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newRule, setNewRule] = useState<Partial<FirewallRule>>({
        node_id: undefined, // undefined にして未選択状態にする
        filter_type: 'SrcIpAddress',
        filter_value: '',
        priority: 100,
        policy: 'Whitelist',
    });

    // Modal controls
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

    // ファイアウォールルールを読み込む
    const loadRules = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        SELECT f.id, f.node_id, f.filter_type, f.filter_value, f.priority, f.policy, n.name as node_name
                        FROM firewall_settings f
                                 LEFT JOIN node_list n ON f.node_id = n.id
                        ORDER BY f.priority DESC, f.id
                    `,
                }),
            });

            const data = await response.json();
            console.log('Firewall rules response:', data);

            if (!response.ok) {
                setError('ファイアウォールルールの読み込みに失敗しました。');
                return;
            }

            if (data.success && data.results && data.results.rows) {
                setRules(data.results.rows);
            } else {
                setError('データの形式が不正です。');
            }
        } catch (err) {
            console.error('Error loading firewall rules:', err);
            setError('ファイアウォールルールの読み込みに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    // ノード一覧を読み込む
    const loadNodes = async () => {
        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'SELECT id, name FROM node_list ORDER BY id',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Failed to load nodes');
                return;
            }

            if (data.success && data.results && data.results.rows) {
                setNodes(data.results.rows);
            }
        } catch (err) {
            console.error('Error loading nodes:', err);
        }
    };

    // ルールを追加する
    const addRule = async () => {
        // ノードIDも必須項目に追加
        if (!newRule.node_id || !newRule.filter_value || !newRule.filter_type || !newRule.policy) {
            setError('ノード、フィルタータイプ、値、ポリシーは必須です。');
            return;
        }

        const nodeIdValue = newRule.node_id;

        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        INSERT INTO firewall_settings (node_id, filter_type, filter_value, priority, policy)
                        VALUES (${nodeIdValue}, '${newRule.filter_type}', '${newRule.filter_value}',
                                ${newRule.priority},
                                '${newRule.policy}')
                    `,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError('ルールの追加に失敗しました。');
                return;
            }

            // 追加成功したらリストを更新
            await loadRules();

            // フォームをリセット
            setNewRule({
                node_id: undefined, // 未選択状態に戻す
                filter_type: 'SrcIpAddress',
                filter_value: '',
                priority: 100,
                policy: 'Whitelist',
            });

            // モーダルを閉じる
            onClose();
        } catch (err) {
            console.error('Error adding rule:', err);
            setError('ルールの追加に失敗しました。');
        }
    };

    // ルールを削除する
    const deleteRule = async (id: number) => {
        try {
            const response = await fetch('/api/postgres/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `DELETE
                            FROM firewall_settings
                            WHERE id = ${id}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError('ルールの削除に失敗しました。');
                return;
            }

            // 削除成功したらリストを更新
            await loadRules();

            // モーダルを閉じる
            onDeleteClose();
        } catch (err) {
            console.error('Error deleting rule:', err);
            setError('ルールの削除に失敗しました。');
        }
    };

    // 入力フィールドの変更を処理
    const handleInputChange = (
        e:
            | React.ChangeEvent<HTMLInputElement>
            | {
                  target: {name: string; value: string | number | null};
              },
    ) => {
        const {name, value} = e.target;

        let processedValue = value;
        if (name === 'priority') {
            processedValue = parseInt(value as string) || 100;
        } else if (name === 'node_id' && value === 'null') {
            processedValue = null;
        } else if (name === 'node_id' && value !== null) {
            processedValue = parseInt(value as string);
        }

        setNewRule((prev) => ({
            ...prev,
            [name]: processedValue,
        }));
    };

    // セレクトフィールドの変更を処理
    const handleSelectChange = (name: string, value: string) => {
        setNewRule((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // 削除確認ダイアログを表示
    const confirmDelete = (id: number) => {
        setDeleteConfirmId(id);
        onDeleteOpen();
    };

    // コンポーネントマウント時にデータ読み込み
    useEffect(() => {
        const loadData = async () => {
            await loadNodes();
            await loadRules();
        };

        loadData();
    }, []);

    if (loading && rules.length === 0) {
        return (
            <div className='flex h-40 items-center justify-center'>
                <Spinner size='lg' />
                <p className='ml-2'>ファイアウォールルールを読み込み中...</p>
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

            <div className='flex justify-end'>
                <Button
                    color='primary'
                    startContent={<Plus size={16} />}
                    onPress={onOpen}>
                    新しいルールを追加
                </Button>
            </div>

            <Card  shadow="none">
                <CardHeader>
                    <h3 className='text-lg font-semibold'>ファイアウォールルール一覧</h3>
                </CardHeader>
                <CardBody>
                    {rules.length === 0 ? (
                        <p className='py-4 text-center text-default-500'>
                            ファイアウォールルールがありません。上の「新しいルールを追加」ボタンから追加してください。
                        </p>
                    ) : (
                        <Table aria-label='ファイアウォールルール一覧'>
                            <TableHeader>
                                <TableColumn>ID</TableColumn>
                                <TableColumn>ノード</TableColumn>
                                <TableColumn>フィルタータイプ</TableColumn>
                                <TableColumn>フィルター値</TableColumn>
                                <TableColumn>優先度</TableColumn>
                                <TableColumn>ポリシー</TableColumn>
                                <TableColumn>アクション</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {rules.map((rule) => (
                                    <TableRow key={rule.id}>
                                        <TableCell>{rule.id}</TableCell>
                                        <TableCell>
                                            {rule.node_id ? (
                                                <Chip size='sm'>{rule.node_name || rule.node_id}</Chip>
                                            ) : (
                                                <span className='text-default-400'>グローバル</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{rule.filter_type}</TableCell>
                                        <TableCell>
                                            <code className='rounded bg-default-100 px-2 py-1 text-sm'>{rule.filter_value}</code>
                                        </TableCell>
                                        <TableCell>{rule.priority}</TableCell>
                                        <TableCell>
                                            <Chip
                                                color={rule.policy === 'Whitelist' ? 'success' : 'danger'}
                                                size='sm'>
                                                {rule.policy}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                isIconOnly
                                                color='danger'
                                                variant='light'
                                                size='sm'
                                                onPress={() => confirmDelete(rule.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardBody>
            </Card>

            {/* 新規ルール追加モーダル */}
            <Modal
                isOpen={isOpen}
                onClose={onClose}>
                <ModalContent>
                    <ModalHeader>新しいファイアウォールルールを追加</ModalHeader>
                    <ModalBody>
                        <div className='space-y-4'>
                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='nodeId'>
                                    ノード (必須)
                                </label>
                                <Select
                                    id='nodeId'
                                    name='node_id'
                                    placeholder='ノードを選択 (必須)'
                                    selectedKeys={newRule.node_id ? [`${newRule.node_id}`] : []}
                                    onSelectionChange={(keys) => {
                                        const key = keys.values().next().value;
                                        if (key) {
                                            handleInputChange({
                                                target: {
                                                    name: 'node_id',
                                                    value: parseInt(key),
                                                },
                                            });
                                        }
                                    }}
                                    isRequired>
                                    {nodes.map((node) => (
                                        <SelectItem key={node.id.toString()}>
                                            {node.name} (ID: {node.id})
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='filterType'>
                                    フィルタータイプ (必須)
                                </label>
                                <Select
                                    id='filterType'
                                    name='filter_type'
                                    placeholder='フィルタータイプを選択'
                                    selectedKeys={[newRule.filter_type || 'SrcIpAddress']}
                                    onSelectionChange={(keys) => {
                                        const key = keys.values().next().value;
                                        handleSelectChange('filter_type', key);
                                    }}>
                                    {FILTER_TYPES.map((type) => (
                                        <SelectItem key={type}>{type}</SelectItem>
                                    ))}
                                </Select>
                            </div>

                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='filterValue'>
                                    フィルター値 (必須)
                                </label>
                                <Input
                                    id='filterValue'
                                    name='filter_value'
                                    placeholder='例: 192.168.0.1'
                                    value={newRule.filter_value || ''}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='priority'>
                                    優先度
                                </label>
                                <Input
                                    id='priority'
                                    name='priority'
                                    type='number'
                                    placeholder='優先度 (大きいほど優先)'
                                    value={newRule.priority?.toString() || '100'}
                                    onChange={handleInputChange}
                                />
                                <p className='mt-1 text-xs text-default-400'>値が大きいほど優先度が高くなります</p>
                            </div>

                            <div>
                                <label
                                    className='mb-1 block text-sm font-medium'
                                    htmlFor='policy'>
                                    ポリシー (必須)
                                </label>
                                <Select
                                    id='policy'
                                    name='policy'
                                    placeholder='ポリシーを選択'
                                    selectedKeys={[newRule.policy || 'Whitelist']}
                                    onSelectionChange={(keys) => {
                                        const key = keys.values().next().value;
                                        handleSelectChange('policy', key);
                                    }}>
                                    {POLICIES.map((policy) => (
                                        <SelectItem key={policy}>{policy}</SelectItem>
                                    ))}
                                </Select>
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
                            onPress={addRule}>
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
                    <ModalHeader>ルールの削除</ModalHeader>
                    <ModalBody>
                        <p>本当にこのファイアウォールルール (ID: {deleteConfirmId}) を削除しますか？</p>
                        <p className='mt-2 text-danger'>この操作は元に戻せません。</p>
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
                            onPress={() => deleteConfirmId && deleteRule(deleteConfirmId)}>
                            削除
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
