import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerDashboard = ({ user }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cities for the prototype
  const cities = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata"];

  useEffect(() => {
    loadTrips();
    const interval = setInterval(loadTrips, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  const loadTrips = async () => {
    // In a real app, this would hit /api/trips/customer/:id
    // For prototype, we'll simulate or fetch from a global endpoint
  };

  const handleBook = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/trips/create', {
        customerId: user.id,
        pickupCityId: pickup.substring(0, 3).toUpperCase(),
        destCityId: destination.substring(0, 3).toUpperCase(),
        passengers
      });
      alert(`Ride Booked! Price: ₹${res.data.finalPrice}. ${res.data.pricingReason}`);
      loadTrips();
    } catch (err) {
      alert("Booking failed.");
    }
    setLoading(false);
  };

  return (
    <div className="dashboard glass-card">
      <h1>Welcome, {user.username}</h1>
      <div className="booking-section">
        <h2>Book a Ride</h2>
        <div className="form-group">
          <select onChange={(e) => setPickup(e.target.value)}>
            <option>Select Pickup</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select onChange={(e) => setDestination(e.target.value)}>
            <option>Select Destination</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" min="1" max="4" value={passengers} onChange={(e) => setPassengers(e.target.value)} />
          <button onClick={handleBook} disabled={loading}>
            {loading ? "Calculating AI Price..." : "Book Now"}
          </button>
        </div>
      </div>

      <div className="trips-section">
        <h2>Your Trips</h2>
        {/* Render trips list here */}
      </div>
    </div>
  );
};

export default CustomerDashboard;
