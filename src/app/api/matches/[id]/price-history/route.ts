import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getMatchById } from '@/lib/matches';
import { getDb } from '@/lib/db';

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
    const rows = db.prepare(`
      SELECT price, currency, scraped_at
      FROM price_history
      WHERE match_id = ?
      ORDER BY scraped_at ASC
    `).all(id) as Array<{ price: number; currency: string; scraped_at: string }>;

    const history = rows.map(row => ({
      price: row.price,
      currency: row.currency,
      scrapedAt: row.scraped_at,
    }));

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
