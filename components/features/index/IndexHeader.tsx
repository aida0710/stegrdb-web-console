import Link from 'next/link';
import {Database} from 'lucide-react';
import {NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle} from '@/components/ui/navigation-menu';
import {Button} from '@/components/ui/button';
import {ThemeToggle} from '@/components/theme-toggle-button';
import React from 'react';

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

export function IndexHeader() {
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

                        <NavigationMenu>
                            <NavigationMenuList>
                                {menuItems.map((item) => (
                                    <NavigationMenuItem key={item.title}>
                                        <Link
                                            href={item.href}
                                            legacyBehavior
                                            passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>{item.title}</NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className='flex items-center gap-2'>
                        <ThemeToggle />
                        <Link href='/login'>
                            <Button variant='outline'>ログイン</Button>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
