import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getMatchesByUser, getMatchesByAlert } from '@/lib/matches';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    const matches = alertId
      ? getMatchesByAlert(alertId)
      : getMatchesByUser(payload.userId);

    return NextResponse.json({ matches });

  } catch (error: any) {
    console.error('Get matches error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
