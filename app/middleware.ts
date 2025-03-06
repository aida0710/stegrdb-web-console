import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';

// セッション確認用のヘルパー関数
function checkSession(request: NextRequest) {
    const sessionId = request.cookies.get('postgres-session')?.value;
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, SessionID: ${sessionId ? 'exists' : 'missing'}`);

    // すべてのCookieをデバッグ用に出力
    const allCookies = Array.from(request.cookies.getAll())
        .map((c) => `${c.name}=${c.value.substring(0, 5)}...`)
        .join(', ');

    console.log(`[Middleware] All cookies: ${allCookies}`);

    return sessionId;
}

export function middleware(request: NextRequest) {
    // セッションを確認
    const sessionId = checkSession(request);
    const forcePath = request.nextUrl.searchParams.get('force') === 'true';

    // ダッシュボードアクセス時にセッションがなければログインページへ
    if (request.nextUrl.pathname.startsWith('/dashboard') && !sessionId) {
        console.log(`[Middleware] Redirecting to login from ${request.nextUrl.pathname}`);

        // キャッシュ無効化ヘッダーを追加
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    }

    // ログインページアクセス時にセッションがあればダッシュボードへ
    // ただし、forceパラメータがtrueの場合はリダイレクトしない
    if (request.nextUrl.pathname === '/login' && sessionId && !forcePath) {
        console.log('[Middleware] Redirecting to dashboard from login');

        // キャッシュ無効化ヘッダーを追加
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');

        return response;
    }

    // それ以外のケースは通常通り処理
    // キャッシュ無効化ヘッダーのみ追加
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
}

export const config = {
    matcher: ['/dashboard', '/login', '/dashboard/:path*'],
};
