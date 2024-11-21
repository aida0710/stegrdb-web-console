import React from 'react';
import {ThemeToggle} from '@/components/theme-toggle-button';
import Link from 'next/link';
import {Database} from 'lucide-react';
import {LogoutButton} from '@/components/logout-button';

export function DashboardHeader() {
    return (
        <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='container mx-auto px-4'>
                <div className='flex h-14 items-center justify-between'>
                    <div className='flex items-center gap-6 md:gap-10'>
                        <Link
                            href='/'
                            className='flex items-center space-x-2'>
                            <Database className='h-6 w-6' />
                            <span className='inline-block font-bold'>RDB Tunnel</span>
                        </Link>
                    </div>

                    <div className='flex items-center gap-2'>
                        <ThemeToggle />
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
