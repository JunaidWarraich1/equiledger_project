import { Router } from 'express';
import { getHistory } from '../db.js';

const router = Router();

router.get('/history', (req, res) => {
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  res.json({ history: getHistory(limit) });
});

export default router;
