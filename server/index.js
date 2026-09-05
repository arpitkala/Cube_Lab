/**
 * index.js — CUBE LAB Backend API & Leaderboard Service
 * 
 * Express server providing APIs for:
 * - API Health Check
 * - WCA Speedcubing Leaderboard & Stats
 * - Solve Record Submission & Sync
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory solve history store (can be connected to MongoDB/PostgreSQL)
const solveRecords = [
  { id: 1, solver: 'Arpit Kala', timeMs: 12450, timeFormatted: '00:12.4', moves: 38, puzzle: '3x3', timestamp: new Date().toISOString() },
  { id: 2, solver: 'Akshat Agrawal', timeMs: 14820, timeFormatted: '00:14.8', moves: 42, puzzle: '3x3', timestamp: new Date().toISOString() },
];

/** Health Check Endpoint */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Cube Lab API Server', timestamp: new Date().toISOString() });
});

/** Get Global Leaderboard */
app.get('/api/leaderboard', (req, res) => {
  const sorted = [...solveRecords].sort((a, b) => a.timeMs - b.timeMs);
  res.json({ success: true, leaderboard: sorted });
});

/** Submit a new solve record */
app.post('/api/solves', (req, res) => {
  const { solver, timeMs, timeFormatted, moves, puzzle } = req.body;

  if (!timeMs || !puzzle) {
    return res.status(400).json({ success: false, error: 'Invalid solve data payload' });
  }

  const record = {
    id: solveRecords.length + 1,
    solver: solver || 'Anonymous Cubing Pro',
    timeMs: Number(timeMs),
    timeFormatted: timeFormatted || `${(timeMs / 1000).toFixed(2)}s`,
    moves: Number(moves || 0),
    puzzle,
    timestamp: new Date().toISOString(),
  };

  solveRecords.push(record);
  res.status(201).json({ success: true, record });
});

app.listen(PORT, () => {
  console.log(`[CubeLab Server] 🚀 API Server listening on http://localhost:${PORT}`);
});
