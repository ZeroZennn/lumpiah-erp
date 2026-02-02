import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookies
  const token = request.cookies.get('access_token');
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const protectedPaths = ['/dashboard', '/branches', '/products', '/production', '/transactions', '/reports', '/attendance', '/users'];
  
  // Public paths (always accessible)
  const publicPaths = ['/login', '/register'];

  // Check if path is protected
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // Check if path is exactly the root (redirect to dashboard or login)
  const isRoot = pathname === '/';

  // Case 1: Unauthenticated user trying to access protected route
  if (!token && isProtectedPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Case 2: Authenticated user trying to access auth pages (login/register)
  if (token && publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Case 3: Root path handling
  if (isRoot) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
