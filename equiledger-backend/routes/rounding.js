import { Router } from 'express';
import { simulate, STRATEGIES, ROUNDING_UNITS, isValidStrategy, isValidRoundingUnit } from '../utils/rounding.js';
import { logEntry } from '../db.js';

const router = Router();

router.get('/strategies', (_req, res) => {
  res.json({ strategies: STRATEGIES, roundingUnits: ROUNDING_UNITS });
});

router.post('/simulate-rounding', async (req, res) => {
  const { unitPrice, count, strategyId, roundingUnit } = req.body ?? {};

  // --- Validation ---
  if (typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice <= 0) {
    return res.status(400).json({ error: 'unitPrice must be a positive number' });
  }
  if (!Number.isInteger(count) || count < 1 || count > 200000) {
    return res.status(400).json({ error: 'count must be an integer between 1 and 200000' });
  }
  if (!isValidStrategy(strategyId)) {
    return res.status(400).json({ error: `strategyId must be one of: ${STRATEGIES.map((s) => s.id).join(', ')}` });
  }
  if (!isValidRoundingUnit(roundingUnit)) {
    return res.status(400).json({ error: `roundingUnit must be one of: ${ROUNDING_UNITS.map((u) => u.value).join(', ')}` });
  }

  const sampleEvery = Math.max(1, Math.floor(count / 150));
  const result = simulate(strategyId, unitPrice, count, roundingUnit, sampleEvery);

  await logEntry({
    type: 'rounding-simulation',
    input: { unitPrice, count, strategyId, roundingUnit },
    trueTotal: result.trueTotal,
    charged: result.charged,
    drift: result.drift,
  });

  res.json(result);
});

export default router;
