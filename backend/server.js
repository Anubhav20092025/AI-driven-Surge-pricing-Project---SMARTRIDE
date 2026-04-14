const express = require('express');
const cors = require('cors');
const { initDb } = require('./database/database');
const tripController = require('./controllers/tripController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Databases
initDb();

// Routes
app.post('/api/trips/create', tripController.createTrip);
app.put('/api/trips/:tripId/accept', tripController.acceptTrip);
app.put('/api/trips/:tripId/complete/:driverId', tripController.completeTrip);

// Basic Auth Simulation (for prototype)
app.get('/api/users/:id', (req, res) => {
    const { db } = require('./database/database');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
});

// Driver Dashboard Data
app.get('/api/driver/:driverId/dashboard', (req, res) => {
    const { db } = require('./database/database');
    const pending = db.prepare(`
        SELECT t.*, u.username as customer_name 
        FROM trips t 
        JOIN users u ON t.customer_id = u.id 
        WHERE t.driver_id = ? AND t.status = 'requested'
    `).all(req.params.driverId);

    const active = db.prepare(`
        SELECT t.*, u.username as customer_name 
        FROM trips t 
        JOIN users u ON t.customer_id = u.id 
        WHERE t.driver_id = ? AND t.status = 'accepted'
    `).all(req.params.driverId);

    res.json({ pending, active });
});

app.listen(PORT, () => {
  console.log(`SmartRide Backend running on port ${PORT}`);
});
