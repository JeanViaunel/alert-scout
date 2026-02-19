import { getDb } from "./db";
import type { Match } from "@/types";

export const runtime = 'nodejs';

export function getMatchesByUser(userId: string): Match[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT m.*, a.name as alert_name 
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE a.user_id = ?
    ORDER BY m.created_at DESC
  `);
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
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
    alertName: row.alert_name,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  }));
}

export function getMatchesByAlert(alertId: string): Match[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM matches WHERE alert_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(alertId) as any[];
  
  return rows.map(row => ({
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
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  }));
}

export function getMatchById(matchId: string): (Match & { alertName?: string; alertType?: string; userId?: string }) | null {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT m.*, a.name as alert_name, a.type as alert_type, a.user_id
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE m.id = ?
  `);
  const row = stmt.get(matchId) as any;
  if (!row) return null;
  return {
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
    alertName: row.alert_name,
    alertType: row.alert_type,
    userId: row.user_id,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
  };
}

export function toggleFavorite(matchId: string, isFavorite: boolean): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE matches SET is_favorite = ? WHERE id = ?');
  stmt.run(isFavorite ? 1 : 0, matchId);
}

export function getFavoriteCount(userId: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE a.user_id = ? AND m.is_favorite = 1
  `);
  const result = stmt.get(userId) as any;
  return result?.count || 0;
}

export function getMatchCount(userId: string): number {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE a.user_id = ?
  `);
  const result = stmt.get(userId) as any;
  return result?.count || 0;
}
