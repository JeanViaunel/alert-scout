/**
 * Price Drop Tracker - Feature 1
 * 
 * Tracks price changes on existing matches and notifies users when prices decrease.
 * Runs daily via cron job.
 */

import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';
import { scrape591Listing } from './scrapers/591';

export interface PriceChange {
  id: string;
  matchId: string;
  oldPrice: number;
  newPrice: number;
  changeAmount: number;
  changePercent: number;
  detectedAt: Date;
}

export interface PriceDropNotification {
  userId: string;
  matchId: string;
  listingTitle: string;
  oldPrice: number;
  newPrice: number;
  savings: number;
  savingsPercent: number;
  listingUrl: string;
  imageUrl: string;
}

/**
 * Check price changes for all active matches
 * Runs daily - prices don't change hourly
 */
export async function checkPriceChanges(): Promise<PriceChange[]> {
  const db = getDb();
  const priceChanges: PriceChange[] = [];
  
  console.log('🔍 Checking price changes for active matches...');
  
  // Get all active matches from last 30 days (not favorited yet)
  const matches = db.prepare(`
    SELECT m.id, m.source_url, m.price, m.title, m.alert_id, a.user_id
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    WHERE a.is_active = 1
      AND m.created_at > datetime('now', '-30 days')
      AND m.is_favorite = 0
    LIMIT 500  -- Batch process to avoid rate limiting
  `).all() as Array<{
    id: string;
    source_url: string;
    price: number;
    title: string;
    alert_id: string;
    user_id: string;
  }>;
  
  console.log(`📊 Found ${matches.length} matches to check`);
  
  for (const match of matches) {
    try {
      // Re-scrape the listing
      const listingData = await scrape591Listing(match.source_url);
      
      if (!listingData) {
        console.log(`⚠️  Could not scrape ${match.source_url}`);
        continue;
      }
      
      const newPrice = listingData.price;
      const oldPrice = match.price;
      
      // Update last price check timestamp
      db.prepare(`
        UPDATE matches 
        SET last_price_check = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(match.id);
      
      // Check if price changed
      if (newPrice !== oldPrice) {
        const changeAmount = newPrice - oldPrice;
        const changePercent = (changeAmount / oldPrice) * 100;
        
        // Record price change
        const priceChange: PriceChange = {
          id: uuidv4(),
          matchId: match.id,
          oldPrice,
          newPrice,
          changeAmount,
          changePercent,
          detectedAt: new Date(),
        };
        
        db.prepare(`
          INSERT INTO price_changes (id, match_id, old_price, new_price, change_amount, change_percent, detected_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          priceChange.id,
          priceChange.matchId,
          priceChange.oldPrice,
          priceChange.newPrice,
          priceChange.changeAmount,
          priceChange.changePercent,
          priceChange.detectedAt.toISOString()
        );
        
        // Update match price
        db.prepare(`
          UPDATE matches 
          SET price = ?, 
              is_price_dropped = CASE WHEN ? < 0 THEN 1 ELSE 0 END
          WHERE id = ?
        `).run(newPrice, changeAmount, match.id);
        
        // Update price history
        const existingHistory = db.prepare(`
          SELECT price_history FROM matches WHERE id = ?
        `).get(match.id) as { price_history: string } | undefined;
        
        const history = existingHistory?.price_history 
          ? JSON.parse(existingHistory.price_history) 
          : [];
        
        history.push({
          price: newPrice,
          date: new Date().toISOString(),
        });
        
        // Keep last 10 price points
        const trimmedHistory = history.slice(-10);
        
        db.prepare(`
          UPDATE matches SET price_history = ? WHERE id = ?
        `).run(JSON.stringify(trimmedHistory), match.id);
        
        priceChanges.push(priceChange);
        
        console.log(`💰 Price change detected: ${match.title}`);
        console.log(`   Old: NT$${oldPrice.toLocaleString()} → New: NT$${newPrice.toLocaleString()} (${changePercent.toFixed(1)}%)`);
        
        // Create notification if price dropped >= 5%
        if (changePercent <= -5) {
          await createPriceDropNotification({
            userId: match.user_id,
            matchId: match.id,
            listingTitle: match.title,
            oldPrice,
            newPrice,
            savings: Math.abs(changeAmount),
            savingsPercent: Math.abs(changePercent),
            listingUrl: match.source_url,
            imageUrl: '', // Would need to fetch from listing
          });
        }
      }
      
      // Rate limiting - be nice to 591
      await sleep(1000);
      
    } catch (error) {
      console.error(`❌ Error checking price for ${match.source_url}:`, error);
      
      // Log error
      db.prepare(`
        INSERT INTO scraping_logs (id, source, url, status_code, error_message, duration_ms)
        VALUES (?, '591', ?, 'error', ?, 0)
      `).run(uuidv4(), match.source_url, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  console.log(`✅ Price check complete. ${priceChanges.length} changes detected.`);
  return priceChanges;
}

/**
 * Create notification for significant price drop
 */
async function createPriceDropNotification(data: PriceDropNotification) {
  const db = getDb();
  
  // Check if user was notified for this match in last 24h
  const existingNotification = db.prepare(`
    SELECT id FROM notifications 
    WHERE user_id = ? 
      AND type = 'price_drop'
      AND data LIKE ?
      AND created_at > datetime('now', '-1 day')
  `).get(data.userId, `%${data.matchId}%`);
  
  if (existingNotification) {
    console.log(`⏭️  Skipping notification - user already notified in last 24h`);
    return;
  }
  
  // Create notification
  const notification = {
    id: uuidv4(),
    user_id: data.userId,
    alert_id: null,
    type: 'price_drop',
    title: '💰 Price Drop Alert!',
    message: `${data.listingTitle} dropped by NT$${data.savings.toLocaleString()} (${data.savingsPercent.toFixed(1)}%)`,
    data: JSON.stringify({
      matchId: data.matchId,
      oldPrice: data.oldPrice,
      newPrice: data.newPrice,
      savings: data.savings,
      savingsPercent: data.savingsPercent,
      listingUrl: data.listingUrl,
    }),
    is_read: 0,
    created_at: new Date().toISOString(),
  };
  
  db.prepare(`
    INSERT INTO notifications (id, user_id, alert_id, type, title, message, data, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    notification.id,
    notification.user_id,
    notification.alert_id,
    notification.type,
    notification.title,
    notification.message,
    notification.data,
    notification.is_read,
    notification.created_at
  );
  
  console.log(`📬 Created price drop notification for user ${data.userId}`);
}

/**
 * Get price history for a specific match
 */
export function getPriceHistory(matchId: string): PriceChange[] {
  const db = getDb();
  
  const changes = db.prepare(`
    SELECT * FROM price_changes 
    WHERE match_id = ? 
    ORDER BY detected_at DESC
  `).all(matchId) as Array<{
    id: string;
    match_id: string;
    old_price: number;
    new_price: number;
    change_amount: number;
    change_percent: number;
    detected_at: string;
  }>;
  
  return changes.map(c => ({
    id: c.id,
    matchId: c.match_id,
    oldPrice: c.old_price,
    newPrice: c.new_price,
    changeAmount: c.change_amount,
    changePercent: c.change_percent,
    detectedAt: new Date(c.detected_at),
  }));
}

/**
 * Get all price drop matches for a user
 */
export function getPriceDropMatches(userId: string, limit = 20) {
  const db = getDb();
  
  return db.prepare(`
    SELECT DISTINCT m.*, pc.old_price, pc.change_amount, pc.change_percent
    FROM matches m
    JOIN alerts a ON m.alert_id = a.id
    JOIN price_changes pc ON m.id = pc.match_id
    WHERE a.user_id = ?
      AND m.is_price_dropped = 1
      AND pc.detected_at > datetime('now', '-7 days')
    ORDER BY pc.detected_at DESC
    LIMIT ?
  `).all(userId, limit) as Array<{
    id: string;
    title: string;
    price: number;
    old_price: number;
    change_amount: number;
    change_percent: number;
    source_url: string;
    image_url: string;
  }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export for API routes
export const priceTracker = {
  checkPriceChanges,
  getPriceHistory,
  getPriceDropMatches,
};
