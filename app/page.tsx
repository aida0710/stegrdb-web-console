import React from 'react';
import Link from 'next/link';
import {Activity, ArrowRight, Database, Lock, Search, Settings, Shield} from 'lucide-react';
import {Button} from '@heroui/button';
import {Card, CardBody, CardHeader} from '@heroui/card';

export default function HomePage() {
    return (
        <div className='min-h-screen bg-background'>
            <section className='container mx-auto px-4 pb-16 pt-20 text-center'>
                <div className='mx-auto max-w-3xl'>
                    <h1 className='mb-6 text-5xl font-bold tracking-tight'>StagRDB</h1>
                    <p className='mb-8 text-xl text-default-500'>
                        データベースを介した革新的な通信トンネリングソフトウェア
                        <br />
                        完全な通信ログの追跡と管理を実現
                    </p>
                    <div className='flex justify-center gap-4'>
                        <Link href='/login'>
                            <Button
                                color='primary'
                                endContent={<ArrowRight className='h-5 w-5' />}
                                size='lg'>
                                管理コンソールへ
                            </Button>
                        </Link>
                        <Link href='#features'>
                            <Button
                                size='lg'
                                variant='flat'>
                                詳しく見る
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <section
                className='container mx-auto px-4 py-16'
                id='features'>
                <h2 className='mb-12 text-center text-3xl font-bold'>主な特徴</h2>
                <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Database className='h-8 w-8 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>PostgresQL Timescale DBを利用</h3>
                                <p className='text-sm text-default-500'>既存のデータベースインフラを活用し、安全で信頼性の高い通信を実現</p>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Shield className='h-8 w-8 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>完全な監査証跡</h3>
                                <p className='text-sm text-default-500'>すべての通信をL2レベルで記録し、完全な監査証跡を確保</p>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Search className='h-8 w-8 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>高度な分析</h3>
                                <p className='text-sm text-default-500'>RDBによる通信ログのリアルタイム分析とWebコンソールによる可視化</p>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            <section className='bg-default-50 py-16 dark:bg-default-900/20'>
                <div className='container mx-auto px-4'>
                    <h2 className='mb-12 text-center text-3xl font-bold'>StagRDBの仕組み</h2>
                    <div className='mx-auto max-w-4xl'>
                        <div className='grid gap-8 md:grid-cols-2'>
                            <Card>
                                <CardHeader>
                                    <h3 className='text-xl font-bold'>トンネリングの仕組み</h3>
                                </CardHeader>
                                <CardBody>
                                    <p className='text-default-600'>
                                        トンネルクライアントがすべての通信をデータベースに書き込み、読み取って、L2レベルで送信することで実現。
                                        これにより、通信の完全な追跡と制御が可能になります。
                                    </p>
                                </CardBody>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <h3 className='text-xl font-bold'>Web管理ツール</h3>
                                </CardHeader>
                                <CardBody>
                                    <p className='text-default-600'>
                                        直感的なWebインターフェースを通じて、通信ログの分析、設定管理、レポート生成などが可能。
                                        リアルタイムモニタリングにも対応しています。
                                    </p>
                                </CardBody>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            <section className='container mx-auto px-4 py-16'>
                <h2 className='mb-12 text-center text-3xl font-bold'>主な機能</h2>
                <div className='grid gap-6 md:grid-cols-2'>
                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Activity className='h-6 w-6 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>リアルタイムモニタリング</h3>
                                <p className='text-sm text-default-500'>通信フローをリアルタイムで監視し、異常を即座に検知</p>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Lock className='h-6 w-6 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>アクセス制御</h3>
                                <p className='text-sm text-default-500'>詳細なアクセス制御ポリシーの設定と管理が可能</p>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Search className='h-6 w-6 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>ログ分析</h3>
                                <p className='text-sm text-default-500'>高度な検索機能と分析ツールで通信ログを詳細に分析</p>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex gap-3'>
                            <Settings className='h-6 w-6 text-primary' />
                            <div className='flex flex-col'>
                                <h3 className='text-xl font-bold'>簡単設定</h3>
                                <p className='text-sm text-default-500'>直感的なWebインターフェースによる容易な設定と管理</p>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </section>
        </div>
    );
}
