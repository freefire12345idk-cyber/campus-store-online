import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const start = Date.now();
  
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
