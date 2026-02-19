import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
// Server-side auth helper - must import from auth-token-server, not auth-token
import { getUserFromToken } from '@/lib/auth-token-server';

function parseDate(s: string): string {
  // If it already looks like ISO, keep it (Next/React handles it fine)
  if (s.includes("T")) return s;
  // SQLite CURRENT_TIMESTAMP: 'YYYY-MM-DD HH:MM:SS' (UTC, no TZ marker)
  return new Date(s.replace(" ", "T") + "Z").toISOString();
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

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
    const rows = db.prepare(`
      SELECT 
        a.*,
        COUNT(m.id) as match_count
      FROM alerts a
      LEFT JOIN matches m ON a.id = m.alert_id
      WHERE a.user_id = ?
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `).all(user.id);

    const alerts = (rows as any[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      name: row.name,
      criteria: safeJsonParse<Record<string, unknown>>(row.criteria, {}),
      sources: safeJsonParse<string[]>(row.sources, []),
      isActive: Boolean(row.is_active),
      checkFrequency: row.check_frequency,
      lastChecked: row.last_checked ? parseDate(String(row.last_checked)) : undefined,
      // Prefer stored last_match_count if present; otherwise fall back to joined count
      lastMatchCount:
        typeof row.last_match_count === "number"
          ? row.last_match_count
          : Number(row.match_count || 0),
      createdAt: row.created_at ? parseDate(String(row.created_at)) : new Date().toISOString(),
      notifyMethods: safeJsonParse<string[]>(row.notify_methods, ["app"]),
      matchCount: Number(row.match_count || 0),
    }));

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
      alert: {
        id,
        userId: user.id,
        type,
        name,
        criteria,
        sources,
        isActive: true,
        checkFrequency: checkFrequency || "1hour",
        lastMatchCount: 0,
        createdAt: new Date().toISOString(),
        notifyMethods: notifyMethods || ["app"],
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
