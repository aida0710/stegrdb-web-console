import {CheckIcon, XIcon} from 'lucide-react';
import {Metadata} from 'next';
import {NextFont} from 'next/dist/compiled/@next/font';
import {Inter} from 'next/font/google';
import React, {ReactNode} from 'react';
import '@/styles/globals.css';
import {Toaster} from 'react-hot-toast';
import Providers from '@/app/providers';

const site_name: string = 'RDB-Tunnel WebConsole';
const site_description: string = 'rdb runnel用管理ツールです';

export const metadata: Metadata = {
    title: {
        default: `${site_name}`,
        template: `%s | ${site_name}`,
    },
    description: site_description,
};

const inter: NextFont = Inter({weight: '400', subsets: ['latin']});

/**
 * @param children
 * @constructor
 */
export default function RootLayout({children}: Readonly<{ children: ReactNode }>) {
    return (
        <html lang='ja'>
            <body className={inter.className}>
                <Toaster
                    position='bottom-right'
                    reverseOrder={false}
                    toastOptions={{
                        className: 'border border-default-200 bg-white',
                        success: {
                            icon: <CheckIcon color='#22c55e' />,
                        },
                        error: {
                            icon: <XIcon color='#ef4444' />,
                        },
                    }}
                />
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}