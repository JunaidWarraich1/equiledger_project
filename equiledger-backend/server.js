import express from 'express';
import cors from 'cors';
import splitRoute from './routes/split.js';
import roundingRoute from './routes/rounding.js';
import historyRoute from './routes/history.js';

const app = express();
const PORT = process.env.PORT || 5000;

// In production, set ALLOWED_ORIGIN to your deployed frontend's URL
// (e.g. https://equiledger.vercel.app). Locally, leaving it unset allows
// all origins so you don't get blocked while developing.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', splitRoute);
app.use('/api', roundingRoute);
app.use('/api', historyRoute);

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));

// Generic error handler — catches anything thrown in a route
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`EquiLedger backend running on http://localhost:${PORT}`);
});
