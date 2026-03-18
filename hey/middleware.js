import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Auth pages
  const authPages = ['/login', '/signup'];
  
  // Protected pages
  const protectedPages = ['/dashboard', '/notes', '/feedback', '/contact', '/profile'];
  
  // Admin pages
  const adminPages = ['/admin'];

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (session && authPages.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not logged in and tries to access protected pages, redirect to login
  if (!session && (protectedPages.some((page) => pathname.startsWith(page)) || adminPages.some((page) => pathname.startsWith(page)))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is not admin and tries to access admin pages, redirect to dashboard
  if (session && adminPages.some((page) => pathname.startsWith(page)) && session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/signup', '/notes/:path*', '/feedback/:path*', '/contact/:path*', '/profile/:path*'],
};
