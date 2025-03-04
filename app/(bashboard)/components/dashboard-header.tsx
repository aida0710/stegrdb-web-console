import React from 'react';
import Link from 'next/link';
import {Navbar, NavbarBrand, NavbarContent, NavbarItem} from '@heroui/navbar';
import {Database, Settings, Terminal} from 'lucide-react';

import {ThemeToggle} from '@/components/layout/ThemeToggle';
import {LogoutButton} from '@/components/common/LogoutButton';

export function DashboardHeader() {
    return (
        <Navbar
            isBordered
            maxWidth='xl'
            position='sticky'>
            <NavbarBrand>
                <Link
                    className='flex items-center gap-2'
                    href='/'>
                    <Database className='h-6 w-6' />
                    <span className='font-bold text-inherit'>RDB Tunnel</span>
                </Link>
            </NavbarBrand>

            <NavbarContent
                className='hidden gap-4 sm:flex'
                justify='center'>
                <NavbarItem isActive>
                    <Link
                        className='flex items-center gap-1'
                        href='/dashboard'>
                        <Terminal size={18} />
                        <span>クエリ実行</span>
                    </Link>
                </NavbarItem>
                <NavbarItem>
                    <Link
                        className='flex items-center gap-1'
                        href='/dashboard/settings'>
                        <Settings size={18} />
                        <span>設定</span>
                    </Link>
                </NavbarItem>
            </NavbarContent>

            <NavbarContent justify='end'>
                <NavbarItem>
                    <ThemeToggle />
                </NavbarItem>
                <NavbarItem>
                    <LogoutButton />
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
}
