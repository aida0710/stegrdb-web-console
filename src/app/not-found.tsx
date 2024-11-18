import {Metadata} from 'next';
import React from 'react';
import Link from "next/link";

export const metadata: Metadata = {
    title: '404 Not Found',
};

export default function Page() {
    return (
        <div className='p-20 max-md:p-5'>
            <h1 className='mt-8 text-6xl font-bold'>404</h1>
            <p className='mt-2 text-5xl font-bold'>Page not found</p>
            <p className='mt-6 text-lg'>このページは存在しません。</p>
            <Link
                className='mt-6 block text-blue-600 hover:underline'
                href='/'>
                ← ホームに戻る
            </Link>
        </div>
    );
}
