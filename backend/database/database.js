const Database = require('better-sqlite3');
const path = require('path');

// Operational Database
const db = new Database(path.join(__dirname, '../../smartride.db'), { verbose: console.log });
db.pragma('journal_mode = WAL');

// Analytics Database
const analyticsDb = new Database(path.join(__dirname, '../../smartride_analytics.db'), { verbose: console.log });
analyticsDb.pragma('journal_mode = WAL');

/**
 * Initialize Tables
 */
const initDb = () => {
  // Users Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('customer', 'driver', 'admin')),
      is_available BOOLEAN DEFAULT 1,
      seats_taken INTEGER DEFAULT 0 CHECK(seats_taken >= 0),
      avg_rating REAL DEFAULT 0,
      total_ratings INTEGER DEFAULT 0,
      mileage REAL DEFAULT 15.0
    )
  `).run();

  // Trips Table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      driver_id TEXT,
      pickup_city TEXT,
      dest_city TEXT,
      pickup_lat REAL,
      pickup_lon REAL,
      dest_lat REAL,
      dest_lon REAL,
      distance REAL,
      base_price REAL,
      surge_multiplier REAL DEFAULT 1.0,
      discount_percent REAL DEFAULT 0.0,
      final_price REAL,
      status TEXT CHECK(status IN ('requested', 'accepted', 'completed', 'cancelled')),
      passengers INTEGER DEFAULT 1,
      rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(customer_id) REFERENCES users(id),
      FOREIGN KEY(driver_id) REFERENCES users(id)
    )
  `).run();

  // Analytics: Hourly Demand
  analyticsDb.prepare(`
    CREATE TABLE IF NOT EXISTS hourly_demand (
      hour INTEGER, -- 0 to 23
      day_type TEXT, -- weekday/weekend
      trip_count INTEGER DEFAULT 0,
      created_at DATE DEFAULT (DATE('now')),
      UNIQUE(hour, created_at)
    )
  `).run();

  // Analytics: AI Pricing Log
  analyticsDb.prepare(`
    CREATE TABLE IF NOT EXISTS ai_pricing_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT,
      demand_ratio REAL,
      surge_multiplier REAL,
      ai_reasoning TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  console.log("Databases initialized successfully.");
};

module.exports = { db, analyticsDb, initDb };
