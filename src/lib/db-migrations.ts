/**
 * Database Migration Script - Alert Scout v2.0
 * Run with: npx ts-node src/lib/db-migrations.ts
 * 
 * Adds support for Features 1,2,3,4,7,8,17,18
 */

import { getDb, initDb } from './db';

export function runMigrations() {
  console.log('🔄 Running database migrations...\n');

  const db = getDb();
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');

  // ============================================
  // Feature 1: Price Drop Alerts
  // ============================================
  console.log('📊 Feature 1: Price Drop Alerts');
  
  // Add columns without non-constant defaults (SQLite limitation)
  try { db.exec(`ALTER TABLE matches ADD COLUMN price_history JSON`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN first_seen_at DATETIME`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN last_price_check DATETIME`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN is_price_dropped BOOLEAN DEFAULT 0`); } catch (e) { /* Column may exist */ }
  
  db.exec(`
    -- Price changes tracking table
    CREATE TABLE IF NOT EXISTS price_changes (
      id TEXT PRIMARY KEY,
      match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
      old_price INTEGER NOT NULL,
      new_price INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      change_percent REAL NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_price_changes_match ON price_changes(match_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_price_dropped ON matches(is_price_dropped)`);
  
  console.log('  ✓ Price tracking columns added');
  console.log('  ✓ price_changes table created\n');

  // ============================================
  // Feature 2: Multi-Source Comparison
  // ============================================
  console.log('📊 Feature 2: Multi-Source Comparison');
  
  try { db.exec(`ALTER TABLE matches ADD COLUMN source_id TEXT`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN external_id TEXT`); } catch (e) { /* Column may exist */ }
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS listing_clusters (
      id TEXT PRIMARY KEY,
      cluster_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS cluster_members (
      cluster_id TEXT REFERENCES listing_clusters(id) ON DELETE CASCADE,
      match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      price INTEGER NOT NULL,
      ping REAL,
      floor TEXT,
      UNIQUE(cluster_id, match_id)
    );
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS cluster_confidence (
      cluster_id TEXT PRIMARY KEY REFERENCES listing_clusters(id) ON DELETE CASCADE,
      confidence_score REAL NOT NULL,
      matching_factors JSON
    );
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_cluster_members_match ON cluster_members(match_id)`);
  
  console.log('  ✓ Multi-source columns added');
  console.log('  ✓ listing_clusters table created');
  console.log('  ✓ cluster_members table created\n');

  // ============================================
  // Feature 3: Smart Recommendations
  // ============================================
  console.log('📊 Feature 3: Smart Recommendations');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_interactions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK(action IN ('view', 'favorite', 'contact', 'skip', 'share')),
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_interactions_user ON user_interactions(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_interactions_match ON user_interactions(match_id)`);
  
  console.log('  ✓ user_interactions table created\n');

  // ============================================
  // Feature 4: Map View
  // ============================================
  console.log('📊 Feature 4: Map View');
  
  try { db.exec(`ALTER TABLE matches ADD COLUMN latitude REAL`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN longitude REAL`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN geocode_accuracy TEXT`); } catch (e) { /* Column may exist */ }
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_matches_location ON matches(latitude, longitude)`);
  
  console.log('  ✓ Geocoding columns added');
  console.log('  ✓ Location index created\n');

  // ============================================
  // Feature 7: Commute Time Filter
  // ============================================
  console.log('📊 Feature 7: Commute Time Filter');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS commute_destinations (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      default_mode TEXT DEFAULT 'transit',
      arrival_time TEXT
    );
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_commute_dest_user ON commute_destinations(user_id)`);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS match_commute (
      match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
      destination_id TEXT REFERENCES commute_destinations(id) ON DELETE CASCADE,
      duration_minutes INTEGER NOT NULL,
      distance_km REAL DEFAULT 0,
      mode TEXT NOT NULL,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (match_id, destination_id)
    );
  `);
  
  console.log('  ✓ commute_destinations table created');
  console.log('  ✓ match_commute table created\n');

  // ============================================
  // Feature 8: Image Analysis
  // ============================================
  console.log('📊 Feature 8: Image Analysis');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS image_analysis (
      match_id TEXT PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
      analysis_json JSON NOT NULL,
      analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  try { db.exec(`ALTER TABLE matches ADD COLUMN has_ac BOOLEAN`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN has_furniture BOOLEAN`); } catch (e) { /* Column may exist */ }
  try { db.exec(`ALTER TABLE matches ADD COLUMN image_quality_score INTEGER`); } catch (e) { /* Column may exist */ }
  
  console.log('  ✓ image_analysis table created');
  console.log('  ✓ Image feature columns added\n');

  // ============================================
  // Feature 17: Market Reports
  // ============================================
  console.log('📊 Feature 17: Market Reports');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      whatsapp_enabled BOOLEAN DEFAULT 0,
      email_enabled BOOLEAN DEFAULT 0,
      frequency TEXT DEFAULT 'weekly',
      districts TEXT DEFAULT '["east", "north"]',
      last_sent_at DATETIME
    );
  `);
  
  console.log('  ✓ report_preferences table created\n');

  // ============================================
  // Feature 18: Investment Calculator
  // ============================================
  console.log('📊 Feature 18: Investment Calculator');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_analyses (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
      purchase_price INTEGER NOT NULL,
      down_payment_percent REAL NOT NULL,
      interest_rate REAL NOT NULL,
      loan_years INTEGER NOT NULL,
      estimated_rent INTEGER NOT NULL,
      analysis_json JSON NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_investment_user ON investment_analyses(user_id)`);
  
  console.log('  ✓ investment_analyses table created\n');

  // ============================================
  // Additional Useful Tables
  // ============================================
  console.log('📊 Additional Tables');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS scraping_logs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      url TEXT,
      status_code INTEGER,
      error_message TEXT,
      duration_ms INTEGER,
      listings_found INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_scraping_logs_source ON scraping_logs(source)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_scraping_logs_created ON scraping_logs(created_at)`);
  
  console.log('  ✓ scraping_logs table created');
  console.log('\n✅ All migrations completed successfully!\n');
}

// Run if executed directly
if (require.main === module) {
  try {
    initDb();
    runMigrations();
    console.log('🎉 Database is ready for v2.0 features!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}
