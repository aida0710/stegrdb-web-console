'use client';

import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Activity, Clock, Database, Play} from 'lucide-react';
import {DashboardHeader} from '@/app/dashboard/components/dashboard-header';
import {useConnection} from '@/hooks/use-connection';

export default function DashboardPage() {
    const [query, setQuery] = useState('');
    const {isChecking} = useConnection();

    if (isChecking) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <p>接続を確認中...</p>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-background'>
            <DashboardHeader />

            <main className='container mx-auto p-4'>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>実行中のトンネル</CardTitle>
                            <Database className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>2</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>アクティブな接続</CardTitle>
                            <Activity className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>54</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>平均レイテンシ</CardTitle>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>124ms</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle className='text-sm font-medium'>総転送量</CardTitle>
                            <Activity className='h-4 w-4 text-muted-foreground' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-2xl font-bold'>1.2GB</div>
                        </CardContent>
                    </Card>
                </div>

                <div className='mt-8'>
                    <Card>
                        <CardHeader>
                            <CardTitle>クエリエディタ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className='space-y-4'>
                                <Textarea
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder='SQLクエリを入力...'
                                    className='min-h-[200px] font-mono'
                                />
                                <div className='flex justify-end'>
                                    <Button className='gap-2'>
                                        <Play className='h-4 w-4' />
                                        実行
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
