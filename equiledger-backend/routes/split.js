import { Router } from 'express';
import { hamiltonAllocate, naiveAllocate, sum } from '../utils/hamilton.js';
import { logEntry } from '../db.js';

const router = Router();

router.post('/split', async (req, res) => {
  const { amount, weights } = req.body ?? {};

  // --- Validation ---
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (!Array.isArray(weights) || weights.length < 2 || weights.length > 50) {
    return res.status(400).json({ error: 'weights must be an array of 2 to 50 numbers' });
  }
  if (weights.some((w) => typeof w !== 'number' || !Number.isFinite(w) || w <= 0)) {
    return res.status(400).json({ error: 'every weight must be a positive number' });
  }

  // --- Core logic: integer cents only, never floats, for the real result ---
  const totalCents = Math.round(amount * 100);
  const exactCents = hamiltonAllocate(totalCents, weights);
  const exactDollars = exactCents.map((c) => c / 100);
  const exactSumCents = sum(exactCents);

  // --- Naive comparison, shown for education ---
  const naive = naiveAllocate(amount, weights);
  const naiveSum = +sum(naive).toFixed(2);

  const result = {
    input: { amount, weights },
    naive: {
      shares: naive,
      total: naiveSum,
      discrepancy: +(amount - naiveSum).toFixed(2),
    },
    exact: {
      shares: exactDollars,
      total: exactSumCents / 100,
      discrepancy: +((totalCents - exactSumCents) / 100).toFixed(2),
    },
  };

  await logEntry({ type: 'split', ...result });
  res.json(result);
});

export default router;
