import { getDb } from "../db";
import { Match } from "@/types";

interface UserPreferenceProfile {
  avgPrice: number;
  avgPing: number;
  preferredDistrict: string;
  preferredRooms: number;
}

interface ScoredRecommendation {
  match: Match;
  score: number;
  reasons: string[];
}

/**
 * Generates a preference profile for a user based on their favorite matches.
 */
async function getUserPreferenceProfile(userId: string): Promise<UserPreferenceProfile | null> {
  const db = getDb();
  const favorites = db.prepare(`
    SELECT m.* 
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE a.user_id = ? AND m.is_favorite = 1
  `).all(userId) as any[];

  if (favorites.length === 0) return null;

  let totalPrice = 0;
  let totalPing = 0;
  const districtCounts: Record<string, number> = {};
  const roomCounts: Record<number, number> = {};

  for (const fav of favorites) {
    totalPrice += fav.price;
    totalPing += fav.area || 0;
    
    const district = (fav.location || '').split(' ')[1] || ''; // Crude district extraction
    districtCounts[district] = (districtCounts[district] || 0) + 1;
    
    const metadata = JSON.parse(fav.metadata || '{}');
    const rooms = metadata.rooms || 0;
    roomCounts[rooms] = (roomCounts[rooms] || 0) + 1;
  }

  const preferredDistrict = Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0][0];
  const preferredRooms = parseInt(Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0][0], 10);

  return {
    avgPrice: totalPrice / favorites.length,
    avgPing: totalPing / favorites.length,
    preferredDistrict,
    preferredRooms
  };
}

export async function generateRecommendations(userId: string, limit = 10): Promise<ScoredRecommendation[]> {
  const prefs = await getUserPreferenceProfile(userId);
  if (!prefs) return [];

  const db = getDb();
  // Get listings the user hasn't seen/interacted with much
  // For now, get recent matches not favorited by this user
  const candidates = db.prepare(`
    SELECT m.* 
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE a.user_id = ? AND m.is_favorite = 0
    ORDER BY m.created_at DESC
    LIMIT 100
  `).all(userId) as any[];

  const scored: ScoredRecommendation[] = candidates.map(row => {
    const match: Match = {
      id: row.id,
      alertId: row.alert_id,
      title: row.title,
      price: row.price,
      currency: row.currency,
      location: row.location,
      area: row.area,
      imageUrl: row.image_url,
      sourceUrl: row.source_url,
      source: row.source,
      metadata: JSON.parse(row.metadata || '{}'),
      isFavorite: Boolean(row.is_favorite),
      createdAt: new Date(row.created_at),
    };

    let score = 0;
    const reasons: string[] = [];

    // 1. Price alignment (30%)
    const priceScore = Math.max(0, 1 - Math.abs(match.price - prefs.avgPrice) / prefs.avgPrice);
    score += priceScore * 0.3;
    if (priceScore > 0.8) reasons.push("Matches your budget");

    // 2. Location match (25%)
    if (match.location?.includes(prefs.preferredDistrict)) {
      score += 0.25;
      reasons.push(`In your preferred district (${prefs.preferredDistrict})`);
    }

    // 3. Size match (20%)
    if (match.area && prefs.avgPing > 0) {
      const sizeScore = Math.max(0, 1 - Math.abs(match.area - prefs.avgPing) / prefs.avgPing);
      score += sizeScore * 0.2;
      if (sizeScore > 0.8) reasons.push("Similar size to your favorites");
    }

    // 4. Room match (15%)
    if (match.metadata.rooms === prefs.preferredRooms) {
      score += 0.15;
      reasons.push(`${match.metadata.rooms} rooms (most common in your saves)`);
    }

    // 5. Recency bonus (10%)
    const ageInDays = (Date.now() - match.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, (30 - ageInDays) / 30);
    score += recencyScore * 0.1;
    if (ageInDays < 2) reasons.push("Newly listed");

    return { match, score, reasons };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
