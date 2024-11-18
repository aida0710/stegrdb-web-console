'use client';

import {ThemeProvider as NextThemesProvider} from 'next-themes';
import {useRouter} from 'next/navigation';
import React, {Component, ErrorInfo, ReactNode} from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return {hasError: true, error};
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h1>Something went wrong.</h1>
                    <details style={{whiteSpace: 'pre-wrap'}}>
                        {this.state.error && this.state.error.toString()}
                        <br/>
                        {this.state.errorInfo?.componentStack}
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

interface IProvidersProps {
    children: React.ReactNode;
}

export default function Providers({children}: Readonly<IProvidersProps>) {
    const router = useRouter();

    return (
        <ErrorBoundary>
            <NextThemesProvider
                defaultTheme="light"
                attribute="class"
                enableSystem={false}
                forcedTheme="light"
                disableTransitionOnChange
            >
                <NextUIProvider navigate={router.push}>
                    {children}
                </NextUIProvider>
            </NextThemesProvider>
        </ErrorBoundary>
    );
}