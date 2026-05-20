/**
 * SmartRide Database Seeding Script
 * 
 * This script initializes and populates both the operational
 * and analytics databases with realistic mock data for local testing.
 * 
 * Run using:
 * node seed.js
 */

const { db, analyticsDb, initDb } = require('./database/database');

console.log('🧼 Initializing and cleaning databases...');
// Initialize tables (if not already created)
initDb();

// Clear existing records to ensure clean slate
db.prepare('DELETE FROM trips').run();
db.prepare('DELETE FROM users').run();
analyticsDb.prepare('DELETE FROM hourly_demand').run();
analyticsDb.prepare('DELETE FROM ai_pricing_log').run();

console.log('📦 Seeding users (drivers & customers)...');

// Helper to insert users
const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, role, is_available, seats_taken, avg_rating, total_ratings, mileage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const users = [
    // Drivers
    ['driver_amit', 'Amit Sharma', 'password123', 'driver', 1, 0, 4.8, 15, 14.5],
    ['driver_rahul', 'Rahul Verma', 'password123', 'driver', 1, 0, 4.6, 8, 12.0],
    ['driver_vikram', 'Vikram Singh', 'password123', 'driver', 1, 0, 4.9, 22, 18.0],
    ['driver_priya', 'Priya Patel', 'password123', 'driver', 1, 0, 4.7, 10, 15.5],
    ['driver_karan', 'Karan Johar', 'password123', 'driver', 1, 0, 4.5, 4, 10.0],
    
    // Customers
    ['rider_anubhav', 'Anubhav Choudhary', 'password123', 'customer', 1, 0, 5.0, 5, 0.0],
    ['rider_sneha', 'Sneha Gupta', 'password123', 'customer', 1, 0, 4.9, 12, 0.0],
    ['rider_rohit', 'Rohit Sen', 'password123', 'customer', 1, 0, 4.8, 3, 0.0],
    ['rider_pooja', 'Pooja Roy', 'password123', 'customer', 1, 0, 4.7, 9, 0.0]
];

for (const user of users) {
    insertUser.run(user);
}

console.log('🚗 Seeding sample trip history...');

// Helper to insert trips
const insertTrip = db.prepare(`
    INSERT INTO trips (
        id, customer_id, driver_id, pickup_city, dest_city, 
        pickup_lat, pickup_lon, dest_lat, dest_lon, distance, 
        base_price, surge_multiplier, discount_percent, final_price, status, passengers, rating
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const trips = [
    [
        'trip_001', 'rider_anubhav', 'driver_amit', 'Pune', 'Mumbai',
        18.5204, 73.8567, 19.0760, 72.8777, 148.5,
        2500.0, 1.2, 0.0, 3000.0, 'completed', 1, 5
    ],
    [
        'trip_002', 'rider_sneha', 'driver_vikram', 'Delhi', 'Agra',
        28.6139, 77.2090, 27.1767, 78.0081, 233.0,
        3200.0, 1.5, 10.0, 4320.0, 'completed', 2, 4
    ],
    [
        'trip_003', 'rider_rohit', 'driver_rahul', 'Bengaluru', 'Coimbatore',
        12.9716, 77.5946, 11.0168, 76.9558, 365.2,
        4500.0, 1.0, 0.0, 4500.0, 'requested', 1, null
    ]
];

for (const trip of trips) {
    insertTrip.run(trip);
}

console.log('📈 Seeding analytics: 24-hour historical demand averages...');

// Helper to insert demand
const insertDemand = analyticsDb.prepare(`
    INSERT INTO hourly_demand (hour, day_type, trip_count, created_at)
    VALUES (?, ?, ?, DATE('now', ?))
`);

const baseDemandPattern = [
    { hour: 0, count: 15 }, { hour: 1, count: 8 },  { hour: 2, count: 5 },  { hour: 3, count: 3 },
    { hour: 4, count: 6 },  { hour: 5, count: 12 }, { hour: 6, count: 25 }, { hour: 7, count: 45 },
    { hour: 8, count: 75 }, { hour: 9, count: 90 }, { hour: 10, count: 80 },{ hour: 11, count: 60 },
    { hour: 12, count: 55 },{ hour: 13, count: 50 },{ hour: 14, count: 45 },{ hour: 15, count: 50 },
    { hour: 16, count: 65 },{ hour: 17, count: 85 },{ hour: 18, count: 100 },{ hour: 19, count: 95 },
    { hour: 20, count: 80 },{ hour: 21, count: 60 },{ hour: 22, count: 40 },{ hour: 23, count: 25 }
];

// Insert weekday and weekend demand baselines across multiple virtual history dates (-1 day, -2 days, etc.)
for (let offset = -5; offset <= 0; offset++) {
    const offsetStr = `${offset} days`;
    for (const d of baseDemandPattern) {
        const tripCount = Math.round(d.count * (0.85 + Math.random() * 0.3)); // Add slight variance
        const dayType = (offset === 0 || offset === -1) ? 'weekday' : 'weekend'; // Simple simulation
        insertDemand.run([d.hour, dayType, tripCount, offsetStr]);
    }
}

console.log('🤖 Seeding analytics: AI pricing audit logs...');

const insertAILog = analyticsDb.prepare(`
    INSERT INTO ai_pricing_log (trip_id, demand_ratio, surge_multiplier, ai_reasoning)
    VALUES (?, ?, ?, ?)
`);

const aiLogs = [
    ['trip_001', 1.25, 1.20, 'Demand ratio is moderately high at 1.25x compared to the 3-day average. Suggesting a 1.2x surge multiplier to recruit additional driver availability in the Pune corridor.'],
    ['trip_002', 1.85, 1.50, 'High demand detected in Delhi-Agra route (1.85x baseline). Recommending 1.5x surge to control traffic request influx and compensate longer driver commutes.'],
    ['trip_003', 0.95, 1.00, 'Baseline demand conditions met (0.95x ratio). Regular fare calculations apply with no active surge multiplier. No discounts suggested.']
];

for (const log of aiLogs) {
    insertAILog.run(log);
}

console.log('🎉 Seeding successfully completed! smartride.db and smartride_analytics.db are populated.');
process.exit(0);
