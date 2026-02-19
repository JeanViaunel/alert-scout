import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, hashPassword, generateToken, createUser } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      );
    }
    
    const { email, name, password, phone } = result.data;
    
    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    // Create user
    const user = await createUser(email, name, password, phone);
    
    // Generate token
    const token = generateToken(user);

    const isProd = process.env.NODE_ENV === 'production';
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set('auth-token', token, {
      path: '/',
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
