'use client';

import {useTheme} from 'next-themes';
import React, {useEffect, useState} from 'react';
import {Button} from '@heroui/button';
import {Moon, Sun} from 'lucide-react';

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const {setTheme, theme} = useTheme();

    // Toggle theme
    const toggleTheme = (): void => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    // Only render after component is mounted to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const isDarkTheme = theme === 'dark';
    const Icon = isDarkTheme ? Sun : Moon;
    const ariaLabel = isDarkTheme ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

    return (
        <Button
            isIconOnly
            aria-label={ariaLabel}
            color='default'
            variant='light'
            onPress={toggleTheme}>
            <Icon size={20} />
        </Button>
    );
}
