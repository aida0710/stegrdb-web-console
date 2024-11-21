"use client";

import {useTheme} from 'next-themes';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {Button} from '@/components/ui/button';
import {Moon, Sun} from 'lucide-react';
import React from 'react';

export function ThemeToggle() {
    const { setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">テーマを切り替え</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    ライト
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    ダーク
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    システム
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}