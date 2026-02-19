import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts, updateAlertLastChecked } from '@/lib/alerts';
import { scrape591, filterListings } from '@/lib/scrapers/591';
import { getDb } from '@/lib/db';
import type { ScrapedListing } from '@/lib/scrapers/591';

export const runtime = 'nodejs';

// Check if listing already exists
function listingExists(alertId: string, sourceUrl: string): boolean {
  const db = getDb();
  const stmt = db.prepare('SELECT 1 FROM matches WHERE alert_id = ? AND source_url = ?');
  return !!stmt.get(alertId, sourceUrl);
}

// Save match to database
function saveMatch(alertId: string, listing: ScrapedListing): void {
  const db = getDb();
  const crypto = require('crypto');
  const id = crypto.randomUUID();
  
  const stmt = db.prepare(`
    INSERT INTO matches (id, alert_id, title, price, currency, location, area, image_url, source_url, source, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    alertId,
    listing.title,
    listing.price,
    'TWD',
    listing.location,
    listing.area || null,
    listing.imageUrl || null,
    listing.sourceUrl,
    listing.source,
    JSON.stringify(listing.metadata)
  );
}

export async function POST(request: NextRequest) {
  try {
    const results: Array<{ alertId: string; alertName: string; newMatches: number }> = [];
    
    // Get all active alerts
    const alerts = getActiveAlerts();
    console.log(`Checking ${alerts.length} active alerts`);
    
    for (const alert of alerts) {
      try {
        let newMatches = 0;
        
        if (alert.type === 'property' && alert.sources.includes('591')) {
          // Scrape 591
          const listings = await scrape591(alert.criteria as any);
          const filtered = filterListings(listings, alert.criteria as any);
          
          // Check for new matches
          for (const listing of filtered) {
            if (!listingExists(alert.id, listing.sourceUrl)) {
              saveMatch(alert.id, listing);
              newMatches++;
            }
          }
        }
        
        // Update alert last checked
        updateAlertLastChecked(alert.id, newMatches);
        
        results.push({
          alertId: alert.id,
          alertName: alert.name,
          newMatches,
        });
        
        console.log(`Alert "${alert.name}": ${newMatches} new matches`);
        
      } catch (err) {
        console.error(`Error checking alert ${alert.id}:`, err);
      }
    }
    
    return NextResponse.json({
      message: 'Alert check completed',
      results,
    });
    
  } catch (error: any) {
    console.error('Check alerts error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
