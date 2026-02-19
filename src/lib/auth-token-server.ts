import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getUserById } from '@/lib/auth';
import type { User } from '@/types';

/**
 * Server-side: Extract and verify token from NextRequest, then return the user.
 * Checks both cookie and Authorization header.
 * Returns null if token is missing or invalid.
 * 
 * This file is server-only and should never be imported in client components.
 */
export function getUserFromToken(request: NextRequest): User | null {
  // Get token from cookie or Authorization header
  const cookie = request.cookies.get('auth-token')?.value;
  const authHeader = request.headers.get('authorization');
  const token = cookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);
  
  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    const user = getUserById(payload.userId);
    return user;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}
