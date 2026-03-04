import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getMatchById } from '@/lib/matches';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    const { id } = await params;

    const match = getMatchById(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.userId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();

    // Prefer the dedicated price_history table if it has data for this match.
    const rows = db.prepare(`
      SELECT price, currency, scraped_at
      FROM price_history
      WHERE match_id = ?
      ORDER BY scraped_at ASC
    `).all(id) as Array<{ price: number; currency: string; scraped_at: string }>;

    if (rows.length > 0) {
      const history = rows.map(row => ({
        price: row.price,
        currency: row.currency,
        scrapedAt: row.scraped_at,
      }));
      return NextResponse.json({ history });
    }

    // Fallback: derive history from matches.price_history JSON (Feature 1 backend)
    const raw = db.prepare(`
      SELECT price_history, currency, created_at
      FROM matches
      WHERE id = ?
    `).get(id) as { price_history?: string | null; currency?: string | null; created_at?: string } | undefined;

    if (!raw) {
      return NextResponse.json({ history: [] });
    }

    const currency = raw.currency || 'TWD';
    let parsed: Array<{ price: number; date?: string }> = [];
    if (raw.price_history) {
      try {
        const arr = JSON.parse(raw.price_history);
        if (Array.isArray(arr)) {
          parsed = arr.filter((p: any) => typeof p?.price === 'number');
        }
      } catch {
        // ignore malformed JSON and fall through to using current price only
      }
    }

    // If no history points, at least seed one from created_at
    if (parsed.length === 0 && raw.created_at) {
      parsed = [{ price: (match as any).price, date: raw.created_at }];
    }

    const history = parsed.map(p => ({
      price: p.price,
      currency,
      scrapedAt: p.date || new Date().toISOString(),
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
