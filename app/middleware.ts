import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export function middleware(request: NextRequest) {
    const sessionId = request.cookies.get('postgres-session')?.value;

    console.log('middleware: ' + sessionId);

    if (request.nextUrl.pathname === '/dashboard' && !sessionId) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (request.nextUrl.pathname === '/login' && sessionId) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard', '/login', '/dashboard/:path*'],
};
