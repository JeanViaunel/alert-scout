import axios from 'axios';
import { getDb } from './db';

export const runtime = 'nodejs';

/**
 * Simple in-memory cache for geocoding results
 * Key: normalized address, Value: { lat, lng, timestamp }
 */
const geocodeCache = new Map<string, { latitude: number; longitude: number; timestamp: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Geocode a Taiwan address to latitude/longitude using Nominatim (OpenStreetMap).
 * Rate limit: 1 request per second (we'll add a simple delay if needed).
 * 
 * @param address - Full address string (e.g., "台北市信義區信義路五段7號")
 * @returns Promise with { latitude, longitude } or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !address.trim()) {
    return null;
  }

  try {
    // Add "Taiwan" to improve geocoding accuracy for Taiwan addresses
    const query = address.includes('台灣') || address.includes('台湾') || address.includes('Taiwan')
      ? address.trim()
      : `${address.trim()}, Taiwan`;

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 1,
        countrycodes: 'tw', // Restrict to Taiwan
        addressdetails: 0,
      },
      headers: {
        'User-Agent': 'AlertScout/1.0 (contact: support@alertscout.com)', // Required by Nominatim
      },
      timeout: 5000,
    });

    const results = response.data;
    if (Array.isArray(results) && results.length > 0) {
      const result = results[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        return { latitude: lat, longitude: lon };
      }
    }

    return null;
  } catch (error) {
    console.error(`Geocoding failed for address "${address}":`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Simple rate limiter: wait if last call was < 1 second ago.
 * This is a basic implementation; for production, consider a proper rate limiter.
 */
let lastGeocodeTime = 0;
const MIN_INTERVAL_MS = 1000; // 1 second

export async function geocodeAddressWithRateLimit(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const now = Date.now();
  const timeSinceLastCall = now - lastGeocodeTime;
  
  if (timeSinceLastCall < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLastCall));
  }
  
  lastGeocodeTime = Date.now();
  return geocodeAddress(address);
}

/**
 * Geocode with cache (memory + database)
 */
export async function geocodeAddressCached(address: string): Promise<{ latitude: number; longitude: number; accuracy: string } | null> {
  const normalizedAddress = address.trim().toLowerCase();
  
  // Check memory cache
  const cached = geocodeCache.get(normalizedAddress);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return { latitude: cached.latitude, longitude: cached.longitude, accuracy: 'cache' };
  }
  
  // Check database cache
  const db = getDb();
  const dbResult = db.prepare(`
    SELECT latitude, longitude, geocode_accuracy
    FROM matches
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    AND location = ?
    LIMIT 1
  `).get(address) as { latitude: number; longitude: number; geocode_accuracy: string } | undefined;
  
  if (dbResult) {
    geocodeCache.set(normalizedAddress, {
      latitude: dbResult.latitude,
      longitude: dbResult.longitude,
      timestamp: Date.now(),
    });
    return { ...dbResult, accuracy: dbResult.geocode_accuracy || 'database' };
  }
  
  // Geocode fresh
  const result = await geocodeAddressWithRateLimit(address);
  if (result) {
    geocodeCache.set(normalizedAddress, {
      ...result,
      timestamp: Date.now(),
    });
    return { ...result, accuracy: 'fresh' };
  }
  
  return null;
}

/**
 * Batch geocode multiple addresses
 * Processes with rate limiting and returns results in same order
 */
export async function batchGeocodeAddresses(addresses: string[]): Promise<Array<{ address: string; latitude: number | null; longitude: number | null }>> {
  const results: Array<{ address: string; latitude: number | null; longitude: number | null }> = [];
  
  for (const address of addresses) {
    try {
      const result = await geocodeAddressWithRateLimit(address);
      results.push({
        address,
        latitude: result?.latitude || null,
        longitude: result?.longitude || null,
      });
    } catch (error) {
      console.error(`Batch geocode failed for ${address}:`, error);
      results.push({ address, latitude: null, longitude: null });
    }
  }
  
  return results;
}

/**
 * Geocode all un-geocoded matches (batch operation)
 */
export async function geocodeUngeocodedMatches(limit = 100): Promise<number> {
  const db = getDb();
  
  const matches = db.prepare(`
    SELECT id, location
    FROM matches
    WHERE latitude IS NULL OR longitude IS NULL
    LIMIT ?
  `).all(limit) as Array<{ id: string; location: string }>;
  
  let geocoded = 0;
  
  for (const match of matches) {
    if (!match.location) continue;
    
    const result = await geocodeAddressWithRateLimit(match.location);
    
    if (result) {
      db.prepare(`
        UPDATE matches
        SET latitude = ?, longitude = ?, geocode_accuracy = 'street'
        WHERE id = ?
      `).run(result.latitude, result.longitude, match.id);
      geocoded++;
    }
  }
  
  console.log(`📍 Geocoded ${geocoded}/${matches.length} matches`);
  return geocoded;
}
