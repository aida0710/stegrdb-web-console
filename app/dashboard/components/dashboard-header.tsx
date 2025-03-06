import React from 'react';
import Link from 'next/link';
import {Navbar, NavbarBrand, NavbarContent, NavbarItem} from '@heroui/navbar';
import {Settings, Terminal} from 'lucide-react';

export function DashboardHeader() {
    return (
        <Navbar
            isBordered
            position='sticky'>
            <NavbarBrand>
                <Link
                    className='flex items-center gap-2'
                    href='/dashboard'>
                    <span className='font-bold text-inherit'>Dashboard Header</span>
                </Link>
            </NavbarBrand>

            <NavbarContent
                className='hidden gap-4 sm:flex'
                justify='end'>
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
        </Navbar>
    );
}
