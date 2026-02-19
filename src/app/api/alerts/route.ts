import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
// Server-side auth helper - must import from auth-token-server, not auth-token
import { getUserFromToken } from '@/lib/auth-token-server';

/**
 * Route Segment Config for API Routes
 * 
 * - dynamic: 'force-dynamic' - Don't cache, always execute on server
 * - runtime: 'nodejs' - Use Node.js runtime (required for better-sqlite3)
 * - maxDuration: 60 - Maximum execution time in seconds
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Revalidate time for ISR (not applicable for force-dynamic, but good for documentation)
export const revalidate = 0;

/**
 * GET /api/alerts
 * Get all alerts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = getDb();
    const alerts = db.prepare(`
      SELECT 
        a.*,
        COUNT(m.id) as match_count
      FROM alerts a
      LEFT JOIN matches m ON a.id = m.alert_id
      WHERE a.user_id = ?
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all(user.id);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/alerts
 * Create a new alert
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, name, criteria, sources, checkFrequency, notifyMethods } = body;

    // Validation
    if (!type || !name || !criteria || !sources) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    const db = getDb();
    db.prepare(`
      INSERT INTO alerts (
        id, user_id, type, name, criteria, sources, 
        check_frequency, notify_methods, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      user.id,
      type,
      name,
      JSON.stringify(criteria),
      JSON.stringify(sources),
      checkFrequency || '1hour',
      JSON.stringify(notifyMethods || ['app'])
    );

    return NextResponse.json({ 
      success: true, 
      alert: { id, type, name, is_active: 1 }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
