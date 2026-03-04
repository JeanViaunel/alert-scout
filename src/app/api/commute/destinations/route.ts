import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth-token-server';
import { getDb } from '@/lib/db';
import { getUserDestinations } from '@/lib/commute';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/commute/destinations
 * Returns all saved commute destinations for the user.
 * 
 * POST /api/commute/destinations
 * Saves a new commute destination.
 */

export async function GET(request: NextRequest) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const destinations = await getUserDestinations(user.id);
    return NextResponse.json(destinations);
  } catch (error) {
    console.error('Error fetching commute destinations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, address, latitude, longitude, defaultMode, arrivalTime } = await request.json();

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields (name, address, latitude, longitude)' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO commute_destinations (id, user_id, name, address, latitude, longitude, default_mode, arrival_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, user.id, name, address, latitude, longitude, defaultMode || 'transit', arrivalTime || null);

    return NextResponse.json({ 
      success: true, 
      id,
      destination: {
        id,
        userId: user.id,
        name,
        address,
        latitude,
        longitude,
        defaultMode: defaultMode || 'transit',
        arrivalTime: arrivalTime || null
      }
    });
  } catch (error) {
    console.error('Error creating commute destination:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
