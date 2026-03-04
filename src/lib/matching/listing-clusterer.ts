import { getDb } from "../db";
import { v4 as uuidv4 } from "uuid";

export interface Listing {
  id: string;
  address: string;
  price: number;
  ping: number;
  rooms?: number;
  floor?: string;
  source: string;
  sourceUrl: string;
}

/**
 * Normalizes a Taiwan address for fuzzy matching.
 * Removes common terms and symbols to focus on the core address components.
 */
function normalizeAddress(address: string): string {
  if (!address) return '';
  return address
    .replace(/[市區路街段巷弄號樓\-]/g, '') // Remove administrative levels and thoroughfare terms
    .replace(/\s+/g, '')                    // Remove whitespace
    .replace(/[A-Za-z]/g, '')               // Remove English characters
    .toLowerCase();
}

/**
 * Simple fuzzy match for addresses.
 */
function fuzzyMatch(addr1: string, addr2: string): boolean {
  const n1 = normalizeAddress(addr1);
  const n2 = normalizeAddress(addr2);
  
  if (!n1 || !n2) return false;
  if (n1 === n2) return true;
  
  // If one contains the other and it's long enough
  if (n1.length > 5 && n2.length > 5) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }
  
  return false;
}

function priceWithinRange(p1: number, p2: number, tolerance: number): boolean {
  if (p1 <= 0 || p2 <= 0) return false;
  const diff = Math.abs(p1 - p2);
  const maxAllowed = Math.max(p1, p2) * tolerance;
  return diff <= maxAllowed;
}

export function calculateSimilarity(listing1: Listing, listing2: Listing): number {
  let score = 0;
  
  // Address match (fuzzy) - 40% weight
  if (fuzzyMatch(listing1.address, listing2.address)) score += 0.4;
  
  // Price within 10% - 25% weight
  if (priceWithinRange(listing1.price, listing2.price, 0.1)) score += 0.25;
  
  // Same ping (area) within 5% - 20% weight
  if (listing1.ping > 0 && listing2.ping > 0) {
    if (Math.abs(listing1.ping - listing2.ping) / listing1.ping < 0.05) score += 0.2;
  }
  
  // Same room count - 10% weight
  if (listing1.rooms && listing2.rooms && listing1.rooms === listing2.rooms) {
    score += 0.1;
  }
  
  // Same floor - 5% weight
  if (listing1.floor && listing2.floor && listing1.floor === listing2.floor) {
    score += 0.05;
  }
  
  return score;
}

const CLUSTER_THRESHOLD = 0.7;

export async function findOrCreateCluster(newListing: Listing): Promise<string> {
  const db = getDb();
  
  // 1. Find potential candidate matches (same city/district, similar price)
  // For now, we'll fetch all matches from the last 30 days to compare
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const candidates = db.prepare(`
    SELECT m.*, cm.cluster_id
    FROM matches m
    LEFT JOIN cluster_members cm ON m.id = cm.match_id
    WHERE m.price BETWEEN ? AND ?
    AND m.created_at > ?
  `).all(
    newListing.price * 0.8, 
    newListing.price * 1.2,
    thirtyDaysAgo.toISOString()
  ) as any[];

  for (const candidate of candidates) {
    const candidateListing: Listing = {
      id: candidate.id,
      address: candidate.location || '',
      price: candidate.price,
      ping: candidate.area || 0,
      rooms: JSON.parse(candidate.metadata || '{}').rooms,
      floor: JSON.parse(candidate.metadata || '{}').floor,
      source: candidate.source,
      sourceUrl: candidate.source_url
    };

    const similarity = calculateSimilarity(newListing, candidateListing);
    
    if (similarity >= CLUSTER_THRESHOLD) {
      if (candidate.cluster_id) {
        // Add to existing cluster
        addToCluster(candidate.cluster_id, newListing);
        return candidate.cluster_id;
      } else {
        // Create new cluster with both
        const clusterId = createCluster([candidateListing, newListing]);
        return clusterId;
      }
    }
  }

  // No match found, don't create a cluster yet if it's solo? 
  // Actually, the spec implies clusters can have 1+ members.
  // But usually we only cluster when we find a match.
  return "";
}

function createCluster(members: Listing[]): string {
  const db = getDb();
  const clusterId = uuidv4();
  
  db.prepare('INSERT INTO listing_clusters (id, cluster_key) VALUES (?, ?)').run(
    clusterId, 
    normalizeAddress(members[0].address)
  );
  
  for (const member of members) {
    addToCluster(clusterId, member);
  }
  
  return clusterId;
}

function addToCluster(clusterId: string, member: Listing): void {
  const db = getDb();
  try {
    db.prepare(`
      INSERT OR IGNORE INTO cluster_members (cluster_id, match_id, source, source_url, price)
      VALUES (?, ?, ?, ?, ?)
    `).run(clusterId, member.id, member.source, member.sourceUrl, member.price);
  } catch (err) {
    console.error('Error adding to cluster:', err);
  }
}
