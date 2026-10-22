// Pure client-side financial precision algorithms with seamless backend fallback.
// In production on Vercel or any static host, EquiLedger runs 100% standalone
// with zero latency, zero backend hosting fees, and zero connection drops.
// If an external backend is configured (VITE_API_URL), it transparently syncs with it.

export function hamiltonAllocate(totalCents, weights) {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (weightSum <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (totalCents * w) / weightSum);
  const floors = exact.map(Math.floor);
  const remainders = exact.map((e, i) => ({ i, frac: e - floors[i] }));

  let leftover = totalCents - floors.reduce((a, b) => a + b, 0);
  remainders.sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < remainders.length && leftover > 0; k++) {
    result[remainders[k].i] += 1;
    leftover--;
  }
  return result;
}

export function naiveAllocate(totalDollars, weights) {
  const weightSum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => {
    const share = (totalDollars * w) / weightSum;
    return Math.round(share * 100) / 100;
  });
}

export function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function roundToUnit(value, unit, mode) {
  const scaled = value / unit;
  let n;
  switch (mode) {
    case 'cashFloor':
      n = Math.floor(scaled);
      break;
    case 'ceiling':
      n = Math.ceil(scaled);
      break;
    case 'bankers': {
      const floor = Math.floor(scaled);
      const diff = scaled - floor;
      if (diff > 0.5) n = floor + 1;
      else if (diff < 0.5) n = floor;
      else n = floor % 2 === 0 ? floor : floor + 1;
      break;
    }
    case 'halfUp':
    default:
      n = Math.round(scaled);
  }
  return +(n * unit).toFixed(6);
}

export function simulate(strategyId, unitPrice, count, roundingUnit, sampleEvery = 1) {
  let residueBuffer = 0;
  let charged = 0;
  const trueTotal = unitPrice * count;
  const series = [];

  for (let i = 1; i <= count; i++) {
    let chargedThis;
    if (strategyId === 'residue') {
      const idealCumulative = unitPrice * i;
      const chargedCumulative = roundToUnit(charged + residueBuffer + unitPrice, roundingUnit, 'halfUp');
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

const STORAGE_KEY = 'equiledger_audit_history';

const INITIAL_HISTORY = [
  {
    id: 'demo-1',
    type: 'split',
    input: { amount: 100, weights: [1, 1, 1] },
    exact: { total: 100, discrepancy: 0 },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'demo-2',
    type: 'rounding-simulation',
    input: { unitPrice: 99.5, count: 50000, strategyId: 'halfUp', roundingUnit: 1 },
    trueTotal: 4975000,
    charged: 5000000,
    drift: 25000,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'demo-3',
    type: 'split',
    input: { amount: 250, weights: [1, 1, 1, 1] },
    exact: { total: 250, discrepancy: 0 },
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
];

function getClientHistory(limit = 50) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_HISTORY));
      return INITIAL_HISTORY.slice(0, limit);
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, limit) : INITIAL_HISTORY.slice(0, limit);
  } catch {
    return INITIAL_HISTORY.slice(0, limit);
  }
}

function logClientEntry(entry) {
  try {
    const list = getClientHistory(200);
    const item = {
      ...entry,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(item);
    if (list.length > 200) list.length = 200;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to persist calculation to localStorage', err);
  }
}

const configuredUrl = import.meta.env.VITE_API_URL;
const isLocalDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const hasRemoteApi = Boolean(configuredUrl && !configuredUrl.includes('localhost'));
const shouldTryBackend = hasRemoteApi || (isLocalDev && Boolean(configuredUrl));
const API_URL = configuredUrl || (isLocalDev ? 'http://localhost:5000' : '');

async function post(path, body) {
  if (!shouldTryBackend) throw new Error('Using local high-performance engine');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function get(path) {
  if (!shouldTryBackend) throw new Error('Using local high-performance engine');
  const res = await fetch(`${API_URL}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  split: async (amount, weights) => {
    try {
      if (shouldTryBackend) {
        return await post('/api/split', { amount, weights });
      }
    } catch {
      // Seamlessly fall back to client Hamilton algorithm
    }

    const totalCents = Math.round(amount * 100);
    const exactCents = hamiltonAllocate(totalCents, weights);
    const exactDollars = exactCents.map((c) => c / 100);
    const exactSumCents = sum(exactCents);

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

    logClientEntry({ type: 'split', ...result });
    return result;
  },

  simulateRounding: async (unitPrice, count, strategyId, roundingUnit) => {
    try {
      if (shouldTryBackend) {
        return await post('/api/simulate-rounding', { unitPrice, count, strategyId, roundingUnit });
      }
    } catch {
      // Seamlessly fall back to client Rounding Simulation algorithm
    }

    const sampleEvery = Math.max(1, Math.floor(count / 150));
    const result = simulate(strategyId, unitPrice, count, roundingUnit, sampleEvery);

    logClientEntry({
      type: 'rounding-simulation',
      input: { unitPrice, count, strategyId, roundingUnit },
      trueTotal: result.trueTotal,
      charged: result.charged,
      drift: result.drift,
    });

    return result;
  },

  history: async (limit = 20) => {
    try {
      if (shouldTryBackend) {
        return await get(`/api/history?limit=${limit}`);
      }
    } catch {
      // Seamlessly fall back to local client history
    }

    return { history: getClientHistory(limit) };
  },
};
