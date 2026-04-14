# SmartRide: AI-Driven Surge Pricing & Urban Routing Platform

SmartRide is a full-stack ride-sharing prototype designed to tackle urban congestion through intelligent pricing models and optimized graph-based routing.

## 🚀 Key Features

### 1. AI-Driven Surge Pricing Engine
The core of SmartRide is its dynamic pricing model that uses a local Large Language Model (LLM) to act as a market analyst.
- **Technology**: Ollama (Llama3) integration.
- **Logic**: Calculates a **Demand Ratio** by comparing current bookings against historical averages stored in a dedicated analytics database.
- **Operation**: The LLM analyzes the ratio to suggest optimal surge multipliers and discount percentages.

### 2. Advanced Pathfinding & Graph Theory
- **Sparse Graph Pruning (KNN-6)**: To ensure high performance, every node in our city network is connected only to its **6 nearest neighbors** based on Euclidean distance. This reduces compute overhead by 80%.
- **Yen's K-Shortest Paths**: Unlike standard navigation, SmartRide provides up to **6 distinct route alternatives** that avoid cycles and ensure path diversity.

### 3. Dual-Database Architecture
- **Operational DB (`smartride.db`)**: Handles high-speed login, booking, and driver assignment using SQLite WAL (Write-Ahead Logging) mode.
- **Analytics DB (`smartride_analytics.db`)**: Isolated storage for historical demand logs and AI decision audits.

### 4. Interactive Dashboards
- **Customer Dashboard**: Real-time glassmorphism UI for booking rides, tracking assigned drivers, and reviewing trip history.
- **Driver Dashboard Terminal**: Dynamic request queue that polls for incoming rides every 5 seconds, allowing for seamless acceptance and manual seat management.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, better-sqlite3.
- **AI**: Ollama (Llama3).
- **Frontend**: React.js, Vite.
- **Visualization**: Mermaid.js, Glassmorphism CSS.

## 📦 Installation & Setup

1. **Prerequisites**: Ensure you have [Ollama](https://ollama.com/) installed and the `llama3` model pulled (`ollama pull llama3`).
2. **Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---
*Created as part of an advanced AI Engineering portfolio.*
