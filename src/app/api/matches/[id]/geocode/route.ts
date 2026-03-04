import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getMatchById } from '@/lib/matches';
import { getDb } from '@/lib/db';
import { geocodeAddressCached } from '@/lib/geocode';

export const runtime = 'nodejs';

export async function POST(
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

    // If we already have coordinates, just return them.
    if (match.latitude != null && match.longitude != null) {
      return NextResponse.json({
        latitude: match.latitude,
        longitude: match.longitude,
        accuracy: 'existing',
      });
    }

    const metadata: any = match.metadata || {};
    const rentDetail: any =
      metadata && typeof metadata === 'object' && metadata.rentDetail && typeof metadata.rentDetail === 'object'
        ? metadata.rentDetail
        : null;
    const positionRound: any =
      rentDetail && typeof rentDetail === 'object' && rentDetail.positionRound && typeof rentDetail.positionRound === 'object'
        ? rentDetail.positionRound
        : null;

    const maybeAddress =
      (positionRound && typeof positionRound.address === 'string' && positionRound.address.trim()) ||
      (typeof match.location === 'string' && match.location.trim()) ||
      '';

    if (!maybeAddress) {
      return NextResponse.json(
        { error: 'No address available to geocode' },
        { status: 400 }
      );
    }

    const geocoded = await geocodeAddressCached(maybeAddress);
    if (!geocoded) {
      return NextResponse.json(
        { error: 'Unable to geocode address' },
        { status: 502 }
      );
    }

    const db = getDb();
    db.prepare(
      `
      UPDATE matches
      SET latitude = ?, longitude = ?, geocode_accuracy = ?
      WHERE id = ?
    `
    ).run(geocoded.latitude, geocoded.longitude, geocoded.accuracy, id);

    return NextResponse.json({
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      accuracy: geocoded.accuracy,
      address: maybeAddress,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

