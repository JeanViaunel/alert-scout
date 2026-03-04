import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-token-server';
import { getDb } from '@/lib/db';

/**
 * GET /api/matches/map
 * Returns listing matches within a bounding box (n, s, e, w) for a user.
 */
export async function GET(request: NextRequest) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const n = parseFloat(searchParams.get('n') || '');
    const s = parseFloat(searchParams.get('s') || '');
    const e = parseFloat(searchParams.get('e') || '');
    const w = parseFloat(searchParams.get('w') || '');
    const alertId = searchParams.get('alertId');

    if (isNaN(n) || isNaN(s) || isNaN(e) || isNaN(w)) {
      return NextResponse.json({ error: 'Invalid bounds. Required: n, s, e, w' }, { status: 400 });
    }

    const db = getDb();
    let query = `
      SELECT m.* 
      FROM matches m
      JOIN alerts a ON m.alert_id = a.id
      WHERE a.user_id = ? 
      AND m.latitude BETWEEN ? AND ? 
      AND m.longitude BETWEEN ? AND ?
    `;
    const params: any[] = [user.id, s, n, w, e];

    if (alertId) {
      query += ' AND m.alert_id = ?';
      params.push(alertId);
    }

    const matches = db.prepare(query).all(...params);

    // Map matches to include parsed metadata and formatted response
    const results = matches.map((m: any) => ({
      id: m.id,
      alertId: m.alert_id,
      title: m.title,
      price: m.price,
      currency: m.currency,
      location: m.location,
      latitude: m.latitude,
      longitude: m.longitude,
      area: m.area,
      imageUrl: m.image_url,
      sourceUrl: m.source_url,
      source: m.source,
      metadata: JSON.parse(m.metadata || '{}'),
      isFavorite: Boolean(m.is_favorite),
      createdAt: m.created_at
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching map matches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
