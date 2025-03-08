import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

function checkSession(request: NextRequest) {
    const sessionId = request.cookies.get('postgres-session')?.value;

    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, SessionID: ${sessionId ? sessionId.substring(0, 8) + '...' : 'missing'}`);

    // リクエストヘッダーの詳細をログに出力（デバッグ用）
    const headers = Object.fromEntries(request.headers);
    console.log(`[Middleware] Request method: ${request.method}`);
    console.log(`[Middleware] Cookie header: ${headers.cookie || 'not present'}`);

    // セッションIDの形式を検証
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
        response.headers.set('X-Debug-Method', request.method);
        return response;
    };

    // キャッシュヘッダーを設定する関数
    const addCacheHeaders = (response: NextResponse) => {
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        return response;
    };

    // ダッシュボードへのアクセスでセッションがない場合、ログインページにリダイレクト
    if (request.nextUrl.pathname.startsWith('/dashboard') && !sessionId) {
        console.log(`[Middleware] Redirecting to login from ${request.nextUrl.pathname} (no session)`);

        const response = NextResponse.redirect(new URL('/login', request.url));
        return addCacheHeaders(addDebugHeaders(response));
    }

    // ログインページへのアクセスですでにセッションがある場合、ダッシュボードにリダイレクト
    if (request.nextUrl.pathname === '/login' && sessionId && !forcePath) {
        console.log(`[Middleware] Redirecting to dashboard from login (session: ${sessionId.substring(0, 8)}...)`);

        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        return addCacheHeaders(addDebugHeaders(response));
    }

    // API リクエストの場合に特別な処理
    if (request.nextUrl.pathname.startsWith('/api/postgres/')) {
        // APIリクエストのセッション検証
        if (!sessionId &&
            !request.nextUrl.pathname.endsWith('/connect') &&
            request.method !== 'OPTIONS') {
            console.log(`[Middleware] API request rejected due to missing session: ${request.nextUrl.pathname}`);

            const response = NextResponse.json(
                {
                    success: false,
                    message: 'セッションが見つかりません。再ログインしてください。'
                },
                { status: 401 }
            );

            return addCacheHeaders(addDebugHeaders(response));
        }

        // OPTIONS リクエスト（プリフライト）の場合は許可
        if (request.method === 'OPTIONS') {
            const response = new NextResponse(null, { status: 204 });
            response.headers.set('Access-Control-Allow-Origin', '*');
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            response.headers.set('Access-Control-Max-Age', '86400');

            return addCacheHeaders(addDebugHeaders(response));
        }
    }

    // デフォルトの動作：リクエストを許可してデバッグヘッダーを追加
    const response = NextResponse.next();
    return addCacheHeaders(addDebugHeaders(response));
}

export const config = {
    matcher: ['/dashboard', '/login', '/dashboard/:path*', '/api/postgres/:path*'],
};