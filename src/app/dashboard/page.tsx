import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * Route Segment Config for Page Routes
 * 
 * - dynamic: 'force-dynamic' - Session-based auth requires dynamic rendering
 * - runtime: 'nodejs' - Required for JWT verification and database
 * 
 * For static pages, use:
 * - dynamic: 'force-static' or 'auto'
 * - revalidate: 3600 (ISR - revalidate every hour)
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Dashboard | Alert Scout',
  description: 'Manage your alerts and view matches',
};

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back! Manage your alerts and track new matches here.
      </p>
      {/* Dashboard content */}
    </div>
  );
}
