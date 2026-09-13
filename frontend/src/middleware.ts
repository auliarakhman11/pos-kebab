import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('pos_access_token')?.value;
  const { pathname } = request.nextUrl;

  // Rute yang membutuhkan autentikasi
  const protectedRoutes = ['/buka-toko', '/kasir'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 1. Jika belum login dan mencoba mengakses rute terproteksi, redirect ke /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Jika sudah login dan mengakses /login atau root /, redirect langsung ke /buka-toko
  if ((pathname === '/login' || pathname === '/') && token) {
    return NextResponse.redirect(new URL('/buka-toko', request.url));
  }

  // 3. Jika mengakses root / dan belum login, redirect ke /login
  if (pathname === '/' && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/buka-toko/:path*',
    '/kasir/:path*',
  ],
};
