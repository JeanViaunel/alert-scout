import { getDb } from "./db";

export interface CommuteDestination {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  defaultMode: 'transit' | 'driving' | 'walking' | 'bicycling';
}

export interface CommuteResult {
  matchId: string;
  destinationId: string;
  durationMinutes: number;
  distanceKm: number;
  mode: string;
}

export async function getCommuteTime(
  matchId: string, 
  destinationId: string
): Promise<CommuteResult | null> {
  const db = getDb();
  
  // 1. Check cache
  const cached = db.prepare(`
    SELECT * FROM match_commute 
    WHERE match_id = ? AND destination_id = ?
  `).get(matchId, destinationId) as any;

  if (cached) {
    return {
      matchId: cached.match_id,
      destinationId: cached.destination_id,
      durationMinutes: cached.duration_minutes,
      distanceKm: cached.distance_km || 0,
      mode: cached.mode
    };
  }

  // 2. Not in cache, would call Google Maps API here
  // For now, simulate a result based on straight-line distance if possible
  const match = db.prepare('SELECT latitude, longitude FROM matches WHERE id = ?').get(matchId) as any;
  const dest = db.prepare('SELECT latitude, longitude FROM commute_destinations WHERE id = ?').get(destinationId) as any;

  if (match?.latitude && dest?.latitude) {
    // Simple estimation: 1.5 min per km + base time
    const dist = calculateDistance(match.latitude, match.longitude, dest.latitude, dest.longitude);
    const duration = Math.round(dist * 3 + 10); // Simulated transit time
    
    const result = {
      matchId,
      destinationId,
      durationMinutes: duration,
      distanceKm: parseFloat(dist.toFixed(2)),
      mode: 'transit'
    };

    // Cache it
    db.prepare(`
      INSERT INTO match_commute (match_id, destination_id, duration_minutes, mode)
      VALUES (?, ?, ?, ?)
    `).run(matchId, destinationId, duration, 'transit');

    return result;
  }

  return null;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function getUserDestinations(userId: string): Promise<CommuteDestination[]> {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM commute_destinations WHERE user_id = ?').all(userId) as any[];
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    defaultMode: r.default_mode
  }));
}
