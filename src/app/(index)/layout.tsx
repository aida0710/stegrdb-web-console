'use client';

import React from 'react';

export default function Layout({children}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className='h-full w-full'>
            <div className='flex text-wrap'>
                <div className='flex-1 p-4'>{children}</div>
            </div>
        </div>
    );
}
