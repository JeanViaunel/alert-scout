import { getDb } from "./db";
import type { Alert, PropertyCriteria, ProductCriteria } from "@/types";

/** Parse a date string that may be SQLite CURRENT_TIMESTAMP format (UTC, no TZ marker)
 *  or a proper ISO 8601 string. Always returns a UTC-correct Date. */
function parseDate(s: string): Date {
  // ISO format already has 'T' and optionally 'Z'/offset — use as-is
  if (s.includes('T')) return new Date(s);
  // SQLite CURRENT_TIMESTAMP: 'YYYY-MM-DD HH:MM:SS' — treat as UTC
  return new Date(s.replace(' ', 'T') + 'Z');
}

export const runtime = 'nodejs';

export function createAlert(
  userId: string,
  type: 'property' | 'product',
  name: string,
  criteria: PropertyCriteria | ProductCriteria,
  sources: string[],
  checkFrequency: string = '1hour',
  notifyMethods: string[] = ['app']
): Alert {
  const db = getDb();
  const crypto = require('crypto');
  const id = crypto.randomUUID();
  
  const stmt = db.prepare(`
    INSERT INTO alerts (id, user_id, type, name, criteria, sources, is_active, check_frequency, notify_methods)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  stmt.run(
    id,
    userId,
    type,
    name,
    JSON.stringify(criteria),
    JSON.stringify(sources),
    checkFrequency,
    JSON.stringify(notifyMethods)
  );
  
  return {
    id,
    userId,
    type,
    name,
    criteria,
    sources,
    isActive: true,
    checkFrequency: checkFrequency as any,
    lastMatchCount: 0,
    createdAt: new Date(),
    notifyMethods: notifyMethods as any,
  };
}

export function getAlertsByUser(userId: string): Alert[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC');
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    criteria: JSON.parse(row.criteria),
    sources: JSON.parse(row.sources),
    isActive: Boolean(row.is_active),
    checkFrequency: row.check_frequency,
    lastChecked: row.last_checked ? parseDate(row.last_checked) : undefined,
    lastMatchCount: row.last_match_count,
    createdAt: parseDate(row.created_at),
    notifyMethods: JSON.parse(row.notify_methods),
  }));
}

export function getAlertById(id: string): Alert | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return null;
  
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    criteria: JSON.parse(row.criteria),
    sources: JSON.parse(row.sources),
    isActive: Boolean(row.is_active),
    checkFrequency: row.check_frequency,
    lastChecked: row.last_checked ? parseDate(row.last_checked) : undefined,
    lastMatchCount: row.last_match_count,
    createdAt: parseDate(row.created_at),
    notifyMethods: JSON.parse(row.notify_methods),
  };
}

export function updateAlertStatus(id: string, isActive: boolean): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE alerts SET is_active = ? WHERE id = ?');
  stmt.run(isActive ? 1 : 0, id);
}

export function deleteAlert(id: string): void {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM alerts WHERE id = ?');
  stmt.run(id);
}

export function getActiveAlerts(): Alert[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts WHERE is_active = 1');
  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    criteria: JSON.parse(row.criteria),
    sources: JSON.parse(row.sources),
    isActive: Boolean(row.is_active),
    checkFrequency: row.check_frequency,
    lastChecked: row.last_checked ? parseDate(row.last_checked) : undefined,
    lastMatchCount: row.last_match_count,
    createdAt: parseDate(row.created_at),
    notifyMethods: JSON.parse(row.notify_methods),
  }));
}

export function updateAlertLastChecked(id: string, matchCount: number): void {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE alerts SET last_checked = ?, last_match_count = ? WHERE id = ?'
  );
  stmt.run(new Date().toISOString(), matchCount, id);
}
