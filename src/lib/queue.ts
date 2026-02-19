import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { getActiveAlerts, getAlertById, updateAlertLastChecked } from './alerts';
import { scrape591, filterListings } from './scrapers/591';
import { scrapeMomo } from './scrapers/momo';
import { scrapePChome } from './scrapers/pchome';
import { scrapeShopee } from './scrapers/shopee';
import { scrapeAmazon } from './scrapers/amazon';
import { getDb } from './db';
import { geocodeAddressWithRateLimit } from './geocode';
import type { Alert, PropertyCriteria, EcommerceCriteria } from '@/types';
import type { ScrapedListing } from './scrapers/591';
import type { ScrapedProduct } from './scrapers/momo';

let scheduledTask: ScheduledTask | null = null;
let isRunning = false;

// ---------------------------------------------------------------------------
// Frequency → milliseconds
// ---------------------------------------------------------------------------

const FREQUENCY_MS: Record<string, number> = {
  '5min':  5  * 60 * 1000,
  '15min': 15 * 60 * 1000,
  '30min': 30 * 60 * 1000,
  '1hour': 60 * 60 * 1000,
  'daily': 24 * 60 * 60 * 1000,
};

function isDue(alert: Alert): boolean {
  if (!alert.lastChecked) return true; // never run — always due
  const freq = FREQUENCY_MS[alert.checkFrequency] ?? FREQUENCY_MS['1hour'];
  return Date.now() - alert.lastChecked.getTime() >= freq;
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

function listingExists(alertId: string, sourceUrl: string): boolean {
  const db = getDb();
  return !!db.prepare('SELECT 1 FROM matches WHERE alert_id = ? AND source_url = ?').get(alertId, sourceUrl);
}

async function saveMatch(alertId: string, listing: ScrapedListing | ScrapedProduct, latitude?: number | null, longitude?: number | null): Promise<void> {
  const db = getDb();
  const { randomUUID } = require('crypto');
  const loc = 'location' in listing ? listing.location : null;
  const area = 'area' in listing ? (listing.area ?? null) : null;
  const currency = (listing as ScrapedProduct).metadata?.currency ?? (listing.source === 'amazon' ? 'USD' : 'TWD');
  db.prepare(`
    INSERT INTO matches (id, alert_id, title, price, currency, location, area, image_url, source_url, source, metadata, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    alertId,
    listing.title,
    listing.price,
    currency,
    loc,
    area,
    listing.imageUrl ?? null,
    listing.sourceUrl,
    listing.source,
    JSON.stringify(listing.metadata),
    latitude ?? null,
    longitude ?? null,
  );
}

// ---------------------------------------------------------------------------
// Core: run one alert
// ---------------------------------------------------------------------------

async function processAlertById(alertId: string): Promise<{ newMatches: number }> {
  const alert = getAlertById(alertId);
  if (!alert || !alert.isActive) return { newMatches: 0 };

  let newMatches = 0;

  try {
    if (alert.type === 'property' && alert.sources.includes('591')) {
      const listings = await scrape591(alert.criteria as PropertyCriteria);
      const filtered  = filterListings(listings, alert.criteria as PropertyCriteria);

      for (const listing of filtered) {
        if (!listingExists(alert.id, listing.sourceUrl)) {
          // Geocode address for property listings
          let latitude: number | null = null;
          let longitude: number | null = null;
          
          if (listing.location) {
            try {
              const coords = await geocodeAddressWithRateLimit(listing.location);
              if (coords) {
                latitude = coords.latitude;
                longitude = coords.longitude;
              }
            } catch (err) {
              console.warn(`Geocoding failed for listing "${listing.title}" at "${listing.location}":`, err);
              // Continue without coordinates - listing will still be saved
            }
          }
          
          await saveMatch(alert.id, listing, latitude, longitude);
          newMatches++;
        }
      }
    }

    if (alert.sources.includes('momo')) {
      const products = await scrapeMomo(alert.criteria as EcommerceCriteria);
      for (const p of products) {
        if (!listingExists(alert.id, p.sourceUrl)) {
          await saveMatch(alert.id, p, null, null);
          newMatches++;
        }
      }
    }

    if (alert.sources.includes('pchome')) {
      const products = await scrapePChome(alert.criteria as EcommerceCriteria);
      for (const p of products) {
        if (!listingExists(alert.id, p.sourceUrl)) {
          await saveMatch(alert.id, p, null, null);
          newMatches++;
        }
      }
    }

    if (alert.sources.includes('shopee')) {
      const products = await scrapeShopee(alert.criteria as EcommerceCriteria);
      for (const p of products) {
        if (!listingExists(alert.id, p.sourceUrl)) {
          await saveMatch(alert.id, p, null, null);
          newMatches++;
        }
      }
    }

    if (alert.sources.includes('amazon')) {
      const products = await scrapeAmazon(alert.criteria as EcommerceCriteria);
      for (const p of products) {
        if (!listingExists(alert.id, p.sourceUrl)) {
          await saveMatch(alert.id, p, null, null);
          newMatches++;
        }
      }
    }
  } catch (err) {
    console.error(`✗ Error scraping alert "${alert.name}" (${alertId}):`, err);
  }

  updateAlertLastChecked(alertId, newMatches);

  if (newMatches > 0) {
    console.log(`✓ Alert "${alert.name}": ${newMatches} new match${newMatches !== 1 ? 'es' : ''}`);
  }

  return { newMatches };
}

// ---------------------------------------------------------------------------
// Core: run all due alerts (called by cron)
// ---------------------------------------------------------------------------

async function processAlertCheck(): Promise<{
  success: boolean;
  results: Array<{ alertId: string; alertName: string; newMatches: number }>;
}> {
  if (isRunning) return { success: true, results: [] };

  isRunning = true;
  const results: Array<{ alertId: string; alertName: string; newMatches: number }> = [];

  try {
    const alerts = getActiveAlerts();
    const due = alerts.filter(isDue);

    if (due.length > 0) {
      console.log(`[${new Date().toISOString()}] ${due.length}/${alerts.length} alert(s) due for checking`);
    }

    for (const alert of due) {
      try {
        const { newMatches } = await processAlertById(alert.id);
        results.push({ alertId: alert.id, alertName: alert.name, newMatches });
      } catch (err) {
        console.error(`✗ Unhandled error for alert ${alert.id}:`, err);
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('Alert check loop failed:', error);
    throw error;
  } finally {
    isRunning = false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Start the frequency-aware scheduler (runs every minute, checks isDue per alert). */
export function scheduleAlertChecks(): void {
  if (scheduledTask) scheduledTask.stop();

  scheduledTask = cron.schedule('* * * * *', async () => {
    try {
      await processAlertCheck();
    } catch (err) {
      console.error('Scheduled check failed:', err);
    }
  });

  console.log('Alert scheduler started (frequency-aware, polling every minute)');
}

/** Stop the scheduler. */
export function stopAlertChecks(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Alert scheduler stopped');
  }
}

/**
 * Run a single alert immediately (fire-and-forget safe).
 * Used right after alert creation so users see results without waiting.
 */
export async function runAlertNow(alertId: string): Promise<{ newMatches: number }> {
  console.log(`[immediate] Running alert ${alertId}`);
  return processAlertById(alertId);
}

/** Manual trigger for all due alerts (used by the /api/queue endpoint). */
export async function triggerAlertCheck(): Promise<any> {
  return processAlertCheck();
}

/** Current scheduler status. */
export function getSchedulerStatus(): { isRunning: boolean; isScheduled: boolean } {
  return { isRunning, isScheduled: scheduledTask !== null };
}
