import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  
  // Check if user is authenticated for protected routes
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith('/student') || 
                           pathname.startsWith('/shop') || 
                           pathname.startsWith('/admin') ||
                           pathname.startsWith('/dashboard');
  
  // Check for session cookies
  const sessionCookie = request.cookies.get('next-auth.session-token');
  
  // Log environment variables for debugging
  console.log('🔍 Middleware Debug:', {
    pathname,
    isProtectedRoute,
    hasSessionCookie: !!sessionCookie,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nodeEnv: process.env.NODE_ENV
  });
  
  // If trying to access protected route without authentication, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    console.log(`🔒 Blocking access to ${pathname} - no session found`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Add performance headers
  const response = NextResponse.next();
  
  // Cache static assets
  if (request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Cache images
  if (request.nextUrl.pathname.startsWith('/images')) {
    response.headers.set('Cache-Control', 'public, max-age=86400');
  }
  
  // Cache API responses for 5 minutes
  if (request.nextUrl.pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'public, max-age=300');
  }
  
  // Add compression
  response.headers.set('Content-Encoding', 'gzip');
  
  // Log performance
  const duration = Date.now() - start;
  console.log(`Request to ${request.nextUrl.pathname} took ${duration}ms`);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
