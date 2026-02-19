import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

/**
 * Middleware Configuration
 * 
 * Edge Runtime Middleware for:
 * - Authentication check
 * - Security headers
 * - Rate limiting preparation
 * - Geographic restrictions (if needed)
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public assets and API health check
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/favicon') ||
    pathname === '/api/health'
  ) {
    return NextResponse.next();
  }

  // Security headers for all routes
  const response = NextResponse.next();
  
  // Add security headers (in addition to next.config.js)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control for authenticated routes
  response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  // Check if the request is for a protected route
  const protectedPaths = ['/dashboard', '/alerts', '/matches', '/profile'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  
  if (!isProtected) {
    return response;
  }
  
  // Get token from cookie or Authorization header
  const token = request.cookies.get('auth-token')?.value || 
    request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Verify token using jose (Edge compatible)
    await jwtVerify(token, JWT_SECRET);
    return response;
  } catch (error) {
    // Clear invalid token and redirect
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.cookies.delete('auth-token');
    return redirectResponse;
  }
}

/**
 * Matcher Configuration
 * 
 * This controls which paths run through middleware.
 * The regex excludes static files and api routes that don't need auth.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
