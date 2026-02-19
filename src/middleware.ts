import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request: NextRequest) {
  // Check if the request is for a protected route
  const protectedPaths = ['/dashboard', '/alerts', '/matches', '/profile'];
  const isProtected = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (!isProtected) {
    return NextResponse.next();
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
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/alerts/:path*', '/matches/:path*', '/profile/:path*'],
};
