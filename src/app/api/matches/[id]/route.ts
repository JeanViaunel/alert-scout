import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getMatchById } from '@/lib/matches';

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

    return NextResponse.json({ match });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
