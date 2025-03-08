import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

function checkSession(request: NextRequest) {
    const sessionId = request.cookies.get('postgres-session')?.value;

    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, SessionID: ${sessionId ? sessionId.substring(0, 8) + '...' : 'missing'}`);
    console.log(`[Middleware] Headers: ${JSON.stringify(Object.fromEntries(request.headers))}`);

    if (sessionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
        console.warn(`[Middleware] Invalid session format: ${sessionId.substring(0, 8)}...`);
        return null;
    }

    return sessionId;
}

export function middleware(request: NextRequest) {
    const sessionId = checkSession(request);
    const forcePath = request.nextUrl.searchParams.get('force') === 'true';

    const addDebugHeaders = (response: NextResponse) => {
        response.headers.set('X-Debug-Session', sessionId || 'none');
        response.headers.set('X-Debug-Path', request.nextUrl.pathname);
        return response;
    };

    if (request.nextUrl.pathname.startsWith('/dashboard') && !sessionId) {
        console.log(`[Middleware] Redirecting to login from ${request.nextUrl.pathname} (no session)`);

        const response = NextResponse.redirect(new URL('/login', request.url));
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return addDebugHeaders(response);
    }

    if (request.nextUrl.pathname === '/login' && sessionId && !forcePath) {
        console.log(`[Middleware] Redirecting to dashboard from login (session: ${sessionId.substring(0, 8)}...)`);

        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return addDebugHeaders(response);
    }

    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return addDebugHeaders(response);
}

export const config = {
    matcher: ['/dashboard', '/login', '/dashboard/:path*', '/api/postgres/:path*'],
};
