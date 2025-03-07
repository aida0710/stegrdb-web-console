'use client';

import React, {useState} from 'react';
import {Tab, Tabs} from '@heroui/tabs';
import {Card, CardBody, CardHeader} from '@heroui/card';
import {DatabaseBackup, Server, Shield} from 'lucide-react';

import NodeSettings from './components/NodeSettings';
import FirewallSettings from './components/FirewallSettings';
import DatabaseInitializer from './components/DatabaseInitializer';

export default function Page() {
    const [selectedTab, setSelectedTab] = useState<string>('nodes');

    return (
        <div className='space-y-6'>
            <h1 className='text-2xl font-bold'>システム設定</h1>

            <Card>
                <CardHeader>
                    <Tabs
                        selectedKey={selectedTab}
                        onSelectionChange={(key) => setSelectedTab(key as string)}>
                        <Tab
                            key='nodes'
                            title={
                                <div className='flex items-center gap-2'>
                                    <Server size={18} />
                                    <span>ノード設定</span>
                                </div>
                            }
                        />
                        <Tab
                            key='firewall'
                            title={
                                <div className='flex items-center gap-2'>
                                    <Shield size={18} />
                                    <span>ファイアウォール設定</span>
                                </div>
                            }
                        />
                        <Tab
                            key='db'
                            title={
                                <div className='flex items-center gap-2'>
                                    <DatabaseBackup size={18} />
                                    <span>データベース初期化</span>
                                </div>
                            }
                        />
                    </Tabs>
                </CardHeader>
                <CardBody>
                    {selectedTab === 'nodes' && <NodeSettings />}
                    {selectedTab === 'firewall' && <FirewallSettings />}
                    {selectedTab === 'db' && <DatabaseInitializer />}
                </CardBody>
            </Card>
        </div>
    );
}
