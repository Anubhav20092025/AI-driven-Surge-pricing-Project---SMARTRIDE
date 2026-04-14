/**
 * Distance Service
 * Implements Euclidean distance for high-performance city-to-city matching.
 */

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Euclidean Distance Formula: sqrt((x2-x1)^2 + (y2-y1)^2)
  // Scale factor of 100 to approximate KM for regional city hubs
  const x = lat2 - lat1;
  const y = lon2 - lon1;
  const rawDistance = Math.sqrt(x * x + y * y);
  
  // Apply scale factor (Heuristic based on regional geography)
  return parseFloat((rawDistance * 100).toFixed(2));
};

module.exports = { calculateDistance };
