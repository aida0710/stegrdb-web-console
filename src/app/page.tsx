import React from 'react';
import Link from 'next/link';
import {Activity, ArrowRight, Database, Lock, Search, Settings, Shield} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {IndexHeader} from '@/app/index/components/index-header';

export default function Page() {
    return (
        <div className='min-h-screen bg-background'>
            <IndexHeader />

            <section className='container mx-auto px-4 pb-16 pt-20 text-center'>
                <div className='mx-auto max-w-3xl'>
                    <h1 className='mb-6 text-5xl font-bold tracking-tight'>RDB Tunnel</h1>
                    <p className='mb-8 text-xl text-muted-foreground'>
                        データベースを介した革新的な通信トンネリングソリューション。
                        <br />
                        完全な通信ログの追跡と管理を実現します。
                    </p>
                    <div className='flex justify-center gap-4'>
                        <Link href='/login'>
                            <Button
                                size='lg'
                                className='gap-2'>
                                管理コンソールへ
                                <ArrowRight className='h-5 w-5' />
                            </Button>
                        </Link>
                        <Link href='#features'>
                            <Button
                                size='lg'
                                variant='outline'>
                                詳しく見る
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section
                id='features'
                className='container mx-auto px-4 py-16'>
                <h2 className='mb-12 text-center text-3xl font-bold'>主な特徴</h2>
                <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                    <Card className='border-border'>
                        <CardHeader>
                            <Database className='h-8 w-8 text-primary' />
                            <CardTitle>データベース活用</CardTitle>
                            <CardDescription>既存のデータベースインフラを活用し、 安全で信頼性の高い通信を実現</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Shield className='h-8 w-8 text-primary' />
                            <CardTitle>完全な監査証跡</CardTitle>
                            <CardDescription>すべての通信をL2レベルで記録し、 完全な監査証跡を確保</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Search className='h-8 w-8 text-primary' />
                            <CardTitle>高度な分析</CardTitle>
                            <CardDescription>Web管理ツールによる通信ログの リアルタイム分析と可視化</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            <section className='border-t bg-muted/50 py-16'>
                <div className='container mx-auto px-4'>
                    <h2 className='mb-12 text-center text-3xl font-bold'>RDB Tunnelの仕組み</h2>
                    <div className='mx-auto max-w-4xl'>
                        <div className='grid gap-8 md:grid-cols-2'>
                            <Card>
                                <CardHeader>
                                    <CardTitle>トンネリングの仕組み</CardTitle>
                                    <CardDescription>
                                        トンネルクライアントがすべての通信をデータベースに書き込み、 読み取って、L2レベルで送信することで実現。
                                        これにより、通信の完全な追跡と制御が可能になります。
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Web管理ツール</CardTitle>
                                    <CardDescription>
                                        直感的なWebインターフェースを通じて、 通信ログの分析、設定管理、レポート生成などが可能。
                                        リアルタイムモニタリングにも対応しています。
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            <section className='container mx-auto px-4 py-16'>
                <h2 className='mb-12 text-center text-3xl font-bold'>主な機能</h2>
                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader>
                            <Activity className='h-6 w-6 text-primary' />
                            <CardTitle>リアルタイムモニタリング</CardTitle>
                            <CardDescription>通信フローをリアルタイムで監視し、 異常を即座に検知</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Lock className='h-6 w-6 text-primary' />
                            <CardTitle>アクセス制御</CardTitle>
                            <CardDescription>詳細なアクセス制御ポリシーの設定と 管理が可能</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Search className='h-6 w-6 text-primary' />
                            <CardTitle>ログ分析</CardTitle>
                            <CardDescription>高度な検索機能と分析ツールで 通信ログを詳細に分析</CardDescription>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Settings className='h-6 w-6 text-primary' />
                            <CardTitle>簡単設定</CardTitle>
                            <CardDescription>直感的なWebインターフェースによる 容易な設定と管理</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            <footer className='border-t bg-muted/50 py-8'>
                <div className='container mx-auto px-4 text-center text-muted-foreground'>
                    <p>© 2024 RDB Tunnel. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
