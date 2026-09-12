import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // Verificar qualquer cookie de sessão do Supabase (formato sb-*)
    const cookies = request.cookies.getAll();
    const hasSupabaseSession = cookies.some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    if (!hasSupabaseSession) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirected', 'true');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
