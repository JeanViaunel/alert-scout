import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-token-server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/interactions
 * Logs user actions like views, favorites, and contacts for use in recommendations.
 */
export async function POST(request: NextRequest) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchId, action, durationMs } = await request.json();

    if (!matchId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validActions = ['view', 'favorite', 'contact', 'skip', 'share'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO user_interactions (id, user_id, match_id, action, duration_ms)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user.id, matchId, action, durationMs || null);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error logging interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
