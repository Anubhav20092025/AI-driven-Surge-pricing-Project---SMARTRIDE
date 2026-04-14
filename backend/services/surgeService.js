const axios = require('axios');
const { analyticsDb } = require('../database/database');

/**
 * Surge Pricing Service
 * Calculates demand ratios and invokes Ollama (Llama3) for smart pricing.
 */

const getSurgeMultiplier = async (currentHour) => {
  try {
    // 1. Calculate Demand Ratio
    // Fetch historical average for this hour
    const historical = analyticsDb.prepare(`
      SELECT AVG(trip_count) as avg_trips FROM hourly_demand 
      WHERE hour = ?
    `).get(currentHour);

    const avgTrips = historical?.avg_trips || 10; // Default fallback if no history

    // Fetch current hour bookings
    const current = analyticsDb.prepare(`
      SELECT trip_count FROM hourly_demand 
      WHERE hour = ? AND created_at = DATE('now')
    `).get(currentHour);

    const currentTrips = current?.trip_count || 1;
    const demandRatio = currentTrips / avgTrips;

    // 2. Attempt AI Pricing (Ollama)
    let surgeMultiplier = 1.0;
    let discountPercent = 0.0;
    let reasoning = "Baseline pricing.";

    try {
      const aiResponse = await axios.post('http://localhost:11434/api/generate', {
        model: "llama3",
        prompt: `System: You are a ride-sharing market analyst. 
Context: Current trip demand ratio is ${demandRatio.toFixed(2)} (where 1.0 is normal).
Task: Provide a surge multiplier (1.0 to 2.5) and a discount percent (0 to 20) in JSON format.
Example JSON: {"surge": 1.5, "discount": 0, "reason": "High demand detected"}
Response:`,
        stream: false,
        format: "json"
      }, { timeout: 3000 });

      const suggestion = JSON.parse(aiResponse.data.response);
      surgeMultiplier = suggestion.surge || 1.0;
      discountPercent = suggestion.discount || 0;
      reasoning = suggestion.reason || "AI Insight applied.";
    } catch (err) {
      // AI Fallback: Rule-Based Logic
      console.log("Ollama offline, using rule-based fallback.");
      if (demandRatio > 2.0) {
        surgeMultiplier = 1.8;
        reasoning = "Rule-based: Extreme Demand.";
      } else if (demandRatio > 1.5) {
        surgeMultiplier = 1.5;
        reasoning = "Rule-based: High Demand.";
      } else if (demandRatio > 1.2) {
        surgeMultiplier = 1.2;
        reasoning = "Rule-based: Moderate Surge.";
      }
    }

    // 3. Log Result for Analytics
    analyticsDb.prepare(`
      INSERT INTO ai_pricing_log (demand_ratio, surge_multiplier, ai_reasoning)
      VALUES (?, ?, ?)
    `).run(demandRatio, surgeMultiplier, reasoning);

    return { surgeMultiplier, discountPercent, reasoning };
  } catch (error) {
    console.error("Surge service error:", error);
    return { surgeMultiplier: 1.0, discountPercent: 0, reasoning: "System error fallback." };
  }
};

module.exports = { getSurgeMultiplier };
