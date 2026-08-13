// Five rounding strategies applied to a per-transaction cash total, simulated
// across N transactions, measuring cumulative drift from the true mathematical
// total. Rounding happens to a configurable *cash denomination* (roundingUnit)
// — e.g. nearest $1 when a merchant has no coin change — not just to the
// nearest cent. A price like $99.50 is already exact at cent precision, so
// rounding "to the nearest cent" changes nothing; the real petrol/no-change
// story is about rounding to the nearest available denomination.

export const STRATEGIES = [
  { id: "halfUp", label: "Standard Half-Up" },
  { id: "cashFloor", label: "Cash Floor" },
  { id: "ceiling", label: "Ceiling" },
  { id: "bankers", label: "Banker's Rounding (Half-Even)" },
  { id: "residue", label: "EquiLedger Residue Buffer" },
];

const STRATEGY_IDS = new Set(STRATEGIES.map((s) => s.id));
export function isValidStrategy(id) {
  return STRATEGY_IDS.has(id);
}

// Denominations a cash till might actually be able to give as change.
export const ROUNDING_UNITS = [
  { value: 0.01, label: "1¢ (exact — no cash constraint)" },
  { value: 0.05, label: "5¢ (no pennies)" },
  { value: 0.25, label: "25¢ (quarters only)" },
  { value: 0.5, label: "50¢ (half-dollar only)" },
  { value: 1, label: "$1 (no coin change at all)" },
];
const VALID_UNITS = new Set(ROUNDING_UNITS.map((u) => u.value));
export function isValidRoundingUnit(u) {
  return VALID_UNITS.has(u);
}

function roundToUnit(value, unit, mode) {
  const scaled = value / unit;
  let n;
  switch (mode) {
    case "cashFloor": n = Math.floor(scaled); break;
    case "ceiling": n = Math.ceil(scaled); break;
    case "bankers": {
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      if (diff > 0.5) n = floor + 1;
      else if (diff < 0.5) n = floor;
      else n = floor % 2 === 0 ? floor : floor + 1;
      break;
    }
    case "halfUp":
    default:
      n = Math.round(scaled);
  }
  return +(n * unit).toFixed(6);
}

// Simulates `count` sales at `unitPrice`, one unit each, cash-rounded to
// `roundingUnit`. Returns { charged, trueTotal, drift, series }.
export function simulate(strategyId, unitPrice, count, roundingUnit, sampleEvery = 1) {
  let residueBuffer = 0;
  let charged = 0;
  const trueTotal = unitPrice * count;
  const series = [];

  for (let i = 1; i <= count; i++) {
    let chargedThis;
    if (strategyId === "residue") {
      // Carry the fractional remainder forward and only round the
      // cumulative true total, so error never compounds transaction to
      // transaction — it stays bounded to within one rounding unit.
      const idealCumulative = unitPrice * i;
      const chargedCumulative = roundToUnit(charged + residueBuffer + unitPrice, roundingUnit, "halfUp");
      chargedThis = chargedCumulative - charged;
      residueBuffer = idealCumulative - (charged + chargedThis);
    } else {
      chargedThis = roundToUnit(unitPrice, roundingUnit, strategyId);
    }
    charged += chargedThis;
    if (i % sampleEvery === 0 || i === count) {
      series.push({ n: i, drift: +(charged - unitPrice * i).toFixed(4) });
    }
  }

  return {
    charged: +charged.toFixed(4),
    trueTotal: +trueTotal.toFixed(4),
    drift: +(charged - trueTotal).toFixed(4),
    series,
  };
}
