import axios from 'axios';

export const runtime = 'nodejs';

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
