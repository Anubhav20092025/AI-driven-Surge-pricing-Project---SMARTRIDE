import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DriverDashboard = ({ user }) => {
  const [pendingTrips, setPendingTrips] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/driver/${user.id}/dashboard`);
      setPendingTrips(res.data.pending);
      setActiveTrips(res.data.active);
    } catch (err) {
      console.error("Failed to load dashboard.");
    }
  };

  const handleAccept = async (tripId) => {
    try {
      await axios.put(`http://localhost:5000/api/trips/${tripId}/accept`, { driverId: user.id });
      loadDashboard();
    } catch (err) {
      alert("Accept failed.");
    }
  };

  const handleComplete = async (tripId) => {
    try {
      await axios.put(`http://localhost:5000/api/trips/${tripId}/complete/${user.id}`);
      loadDashboard();
    } catch (err) {
      alert("Completion failed.");
    }
  };

  return (
    <div className="dashboard glass-card">
      <h1>Driver Terminal: {user.username}</h1>
      <div className="stats-bar">
        <span>Status: {user.is_available ? "Online" : "Offline"}</span>
        <span>Seats Occupied: {user.seats_taken}/4</span>
      </div>

      <div className="section">
        <h2>Incoming Requests</h2>
        {pendingTrips.length === 0 && <p>No pending requests.</p>}
        {pendingTrips.map(trip => (
          <div key={trip.id} className="trip-card">
            <p>From: {trip.pickup_city} To: {trip.dest_city}</p>
            <p>Passengers: {trip.passengers}</p>
            <button onClick={() => handleAccept(trip.id)}>Accept Ride</button>
          </div>
        ))}
      </div>

      <div className="section">
        <h2>Active Rides</h2>
        {activeTrips.map(trip => (
          <div key={trip.id} className="trip-card active">
            <p>Customer: {trip.customer_name}</p>
            <p>Destination: {trip.dest_city}</p>
            <button onClick={() => handleComplete(trip.id)} className="finish-btn">Complete Trip</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DriverDashboard;
