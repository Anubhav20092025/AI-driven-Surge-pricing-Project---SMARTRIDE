const { db, analyticsDb } = require('../database/database');
const { calculateDistance } = require('../services/distanceService');
const { getSurgeMultiplier } = require('../services/surgeService');
const { CITIES } = require('../utils/cities');
const { v4: uuidv4 } = require('uuid');

/**
 * Create Trip
 * Handles solo and carpool booking with AI pricing.
 */
const createTrip = async (req, res) => {
  const { customerId, pickupCityId, destCityId, passengers } = req.body;

  try {
    // 1. Geography Lookup
    const pickup = CITIES.find(c => c.id === pickupCityId);
    const dest = CITIES.find(c => c.id === destCityId);
    if (!pickup || !dest) return res.status(400).json({ error: "Invalid cities." });

    // 2. Distance & Price
    const distance = calculateDistance(pickup.lat, pickup.lon, dest.lat, dest.lon);
    const currentHour = new Date().getHours();
    const pricing = await getSurgeMultiplier(currentHour);

    const basePrice = distance * 12; // Base factor of 12
    const finalPrice = (basePrice * pricing.surgeMultiplier) * (1 - (pricing.discountPercent / 100));

    // 3. Driver Assignment (Pooling Logic)
    // Find a driver who is available OR heading in the same direction with seats
    let assignedDriver = null;

    // Check for carpool match first
    const poolMatch = db.prepare(`
      SELECT driver_id FROM trips 
      WHERE pickup_city = ? AND dest_city = ? AND status IN ('requested', 'accepted')
      GROUP BY driver_id
      HAVING SUM(passengers) + ? <= 4
      LIMIT 1
    `).get(pickupCityId, destCityId, passengers);

    if (poolMatch) {
      assignedDriver = poolMatch.driver_id;
    } else {
      // Find a fresh available driver
      const driver = db.prepare(`
        SELECT id FROM users 
        WHERE role = 'driver' AND is_available = 1 AND seats_taken + ? <= 4
        LIMIT 1
      `).get(passengers);
      if (!driver) return res.status(404).json({ error: "No drivers available." });
      assignedDriver = driver.id;
    }

    // 4. Create Trip Record
    const tripId = uuidv4();
    db.prepare(`
      INSERT INTO trips (
        id, customer_id, driver_id, pickup_city, dest_city, 
        pickup_lat, pickup_lon, dest_lat, dest_lon, distance, 
        base_price, surge_multiplier, discount_percent, final_price, 
        status, passengers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', ?)
    `).run(
      tripId, customerId, assignedDriver, pickupCityId, destCityId,
      pickup.lat, pickup.lon, dest.lat, dest.lon, distance,
      basePrice, pricing.surgeMultiplier, pricing.discountPercent, finalPrice,
      passengers
    );

    // Update Analytics
    analyticsDb.prepare(`
        INSERT INTO hourly_demand (hour, trip_count) 
        VALUES (?, 1)
        ON CONFLICT(hour, created_at) DO UPDATE SET trip_count = trip_count + 1
    `).run(currentHour);

    res.json({ 
      tripId, 
      finalPrice: finalPrice.toFixed(2), 
      pricingReason: pricing.reasoning,
      driverId: assignedDriver
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Booking failed." });
  }
};

const acceptTrip = (req, res) => {
  const { tripId } = req.params;
  const { driverId } = req.body;

  try {
    const trip = db.prepare('SELECT passengers FROM trips WHERE id = ?').get(tripId);
    
    db.transaction(() => {
      db.prepare('UPDATE trips SET status = "accepted" WHERE id = ?').run(tripId);
      db.prepare('UPDATE users SET seats_taken = seats_taken + ? WHERE id = ?').run(trip.passengers, driverId);
    })();

    res.json({ message: "Trip accepted." });
  } catch (error) {
    res.status(500).json({ error: "Acceptance failed." });
  }
};

const completeTrip = (req, res) => {
  const { tripId } = req.params;
  const { driverId } = req.params; // or body

  try {
    const trip = db.prepare('SELECT passengers FROM trips WHERE id = ?').get(tripId);

    db.transaction(() => {
      db.prepare('UPDATE trips SET status = "completed" WHERE id = ?').run(tripId);
      db.prepare('UPDATE users SET seats_taken = seats_taken - ? WHERE id = ?').run(trip.passengers, driverId);
    })();

    res.json({ message: "Trip completed." });
  } catch (error) {
    res.status(500).json({ error: "Completion failed." });
  }
};

module.exports = { createTrip, acceptTrip, completeTrip };
