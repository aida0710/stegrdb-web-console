'use client';

import React from 'react';
import Link from 'next/link';
import {Navbar, NavbarBrand, NavbarContent, NavbarItem} from '@heroui/navbar';
import {Button} from '@heroui/button';
import {Database} from 'lucide-react';

import {ThemeToggle} from '@/components/layout/ThemeToggle';
import {useConnection} from '@/lib/hook/use-connection';
import {LogoutButton} from '@/components/common/LogoutButton';

const menuItems = [
    {
        title: '特徴',
        href: '#features',
    },
    {
        title: '仕組み',
        href: '#mechanism',
    },
    {
        title: '機能',
        href: '#functions',
    },
    {
        title: 'ドキュメント',
        href: '/docs',
    },
] as const;

export function Header() {
    const {isConnected} = useConnection();

    return (
        <Navbar
            isBordered
            className='bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
            position='sticky'>
            <NavbarBrand>
                <Link
                    className='flex items-center gap-2'
                    href='/'>
                    <Database className='h-6 w-6' />
                    <span className='font-bold text-inherit'>StagRDB</span>
                </Link>
            </NavbarBrand>

            <NavbarContent
                className='hidden gap-4 sm:flex'
                justify='center'>
                {menuItems.map((item) => (
                    <NavbarItem key={item.title}>
                        <Link
                            className='text-default-600 transition-colors hover:text-primary'
                            href={item.href}>
                            {item.title}
                        </Link>
                    </NavbarItem>
                ))}
            </NavbarContent>

            <NavbarContent justify='end'>
                <NavbarItem>
                    <ThemeToggle />
                </NavbarItem>
                {isConnected ? (
                    <>
                        <NavbarItem>
                            <Link href='/dashboard'>
                                <Button variant='flat'>管理コンソールへ</Button>
                            </Link>
                        </NavbarItem>
                        <LogoutButton />
                    </>
                ) : (
                    <NavbarItem>
                        <Link href='/login'>
                            <Button variant='flat'>ログイン</Button>
                        </Link>
                    </NavbarItem>
                )}
            </NavbarContent>
        </Navbar>
    );
}
