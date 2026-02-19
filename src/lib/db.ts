import Database from 'better-sqlite3';
import path from 'path';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');

let db: Database.Database | null = null;
let isInitialized = false;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  
  // Initialize database and run migrations once on first access
  if (!isInitialized) {
    initializeDatabase(db);
    isInitialized = true;
  }
  
  return db;
}

// Run migrations for existing databases
function runMigrations(database: Database.Database): void {
  try {
    // Check if matches table exists
    const tableExists = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='matches'
    `).get();
    
    if (tableExists) {
      const tableInfo = database.prepare("PRAGMA table_info(matches)").all() as Array<{ name: string }>;
      const columnNames = tableInfo.map(col => col.name);
      
      if (!columnNames.includes('latitude')) {
        database.exec('ALTER TABLE matches ADD COLUMN latitude REAL');
        console.log('Migration: Added latitude column to matches table');
      }
      if (!columnNames.includes('longitude')) {
        database.exec('ALTER TABLE matches ADD COLUMN longitude REAL');
        console.log('Migration: Added longitude column to matches table');
      }
    }
  } catch (err) {
    // Migration failed - log but don't throw
    console.warn('Migration check for matches table columns:', err instanceof Error ? err.message : err);
  }
}

// Internal initialization function (doesn't call getDb to avoid recursion)
function initializeDatabase(database: Database.Database): void {
  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Alerts table
  database.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      criteria TEXT NOT NULL,
      sources TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      check_frequency TEXT DEFAULT '1hour',
      last_checked DATETIME,
      last_match_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notify_methods TEXT DEFAULT '["app"]',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Matches table
  database.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      alert_id TEXT NOT NULL,
      title TEXT NOT NULL,
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'TWD',
      location TEXT,
      area REAL,
      image_url TEXT,
      source_url TEXT NOT NULL,
      source TEXT NOT NULL,
      metadata TEXT,
      is_favorite INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
    )
  `);

  // Run migrations for existing databases
  runMigrations(database);

  // Notifications table
  database.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      alert_id TEXT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL
    )
  `);

  // Scraping logs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS scraping_logs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT NOT NULL,
      items_found INTEGER DEFAULT 0,
      error_message TEXT,
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  database.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_matches_alert_id ON matches(alert_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_matches_source_url ON matches(source_url)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  database.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read)`);
  
  console.log('Database initialized successfully');
}

// Public initDb function (for explicit initialization)
export function initDb(): void {
  const database = getDb();
  // Database is already initialized by getDb(), but we can call initializeDatabase again safely
  // since it uses CREATE TABLE IF NOT EXISTS
  initializeDatabase(database);
}
