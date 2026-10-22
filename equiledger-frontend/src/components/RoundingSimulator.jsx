import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api, simulate } from '../api.js';

const STRATEGIES = [
  { id: 'halfUp', label: 'Standard Half-Up' },
  { id: 'cashFloor', label: 'Cash Floor' },
  { id: 'ceiling', label: 'Ceiling' },
  { id: 'bankers', label: "Banker's Rounding (Half-Even)" },
  { id: 'residue', label: 'EquiLedger Residue Buffer' },
];

const ROUNDING_UNITS = [
  { value: 0.01, label: '1¢ — exact, no cash constraint' },
  { value: 0.05, label: '5¢ — no pennies' },
  { value: 0.25, label: '25¢ — quarters only' },
  { value: 0.5, label: '50¢ — half-dollar only' },
  { value: 1, label: '$1 — no coin change at all' },
];

export default function RoundingSimulator() {
  const [unitPrice, setUnitPrice] = useState(99.5);
  const [count, setCount] = useState(50000);
  const [strategyId, setStrategyId] = useState('halfUp');
  const [roundingUnit, setRoundingUnit] = useState(1);
  const [result, setResult] = useState(() => {
    const sampleEvery = Math.max(1, Math.floor(50000 / 150));
    return simulate('halfUp', 99.5, 50000, 1, sampleEvery);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api.simulateRounding(unitPrice, count, strategyId, roundingUnit)
        .then((data) => {
          if (!cancelled && data) setResult(data);
        })
        .catch(() => {
          if (!cancelled) {
            const sampleEvery = Math.max(1, Math.floor(count / 150));
            setResult(simulate(strategyId, unitPrice, count, roundingUnit, sampleEvery));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [unitPrice, count, strategyId, roundingUnit]);

  const path = result ? buildPath(result.series) : '';

  return (
    <section className="glass" style={{ padding: 28, marginTop: 22 }}>
      <div className="eyebrow">02 · Micro-transaction rounding leakage</div>
      <h2 style={{ fontSize: 26, marginTop: 8 }}>The petrol $99.50/L problem</h2>
      <p style={{ color: 'var(--text-mid)', marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>
        When a merchant has no coin change, every sale gets rounded to the nearest
        denomination they can actually give — e.g. the nearest whole dollar. That
        rounding, repeated across thousands of sales, is where real money leaks.
        Try the default: $99.50/L, rounded to the nearest <strong>$1</strong> — every
        single sale rounds up 50¢.
      </p>

      <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>
          Unit price ($)
          <input type="number" step="0.01" min="0" value={unitPrice}
            onChange={(e) => setUnitPrice(+e.target.value)} style={{ width: 120 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>
          Transactions
          <input type="number" min="1" max="200000" step="1" value={count}
            onChange={(e) => setCount(Math.min(200000, Math.max(1, +e.target.value)))} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>
          Cash rounds to nearest
          <select value={roundingUnit} onChange={(e) => setRoundingUnit(+e.target.value)} style={{ width: 240 }}>
            {ROUNDING_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>
          Rounding strategy
          <select value={strategyId} onChange={(e) => setStrategyId(e.target.value)} style={{ width: 240 }}>
            {STRATEGIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        {loading && <Loader2 size={18} className="spin" style={{ color: 'var(--text-lo)' }} />}
      </div>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
            <Stat label="True total" value={`$${result.trueTotal.toLocaleString()}`} />
            <Stat label="Charged total" value={`$${result.charged.toLocaleString()}`} />
            <Stat
              label="Cumulative drift"
              value={`${result.drift >= 0 ? '+' : ''}$${result.drift.toLocaleString()}`}
              accent={Math.abs(result.drift) < 0.01 ? 'var(--teal)' : 'var(--red)'}
            />
          </div>

          <div style={{ marginTop: 22, border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '16px 16px 8px', background: 'rgba(255,255,255,0.02)' }}>
            <svg viewBox="0 0 600 160" width="100%" height="160" preserveAspectRatio="none">
              <line x1="0" y1="80" x2="600" y2="80" stroke="var(--line-strong)" strokeDasharray="3,4" />
              <path d={path} fill="none" stroke={Math.abs(result.drift) < 0.01 ? 'var(--teal)' : 'var(--gold)'} strokeWidth="2" />
            </svg>
            <div className="eyebrow" style={{ textAlign: 'center', paddingBottom: 6 }}>
              cumulative drift across {count.toLocaleString()} transactions
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '14px 16px', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize: 12, color: 'var(--text-lo)' }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4, color: accent || 'var(--text-hi)' }}>{value}</div>
    </div>
  );
}

function buildPath(series) {
  if (!series || !series.length) return '';
  const drifts = series.map((s) => s.drift);
  const maxAbs = Math.max(0.01, ...drifts.map(Math.abs));
  const w = 600, h = 160, mid = h / 2;
  const step = w / Math.max(1, series.length - 1);
  return series
    .map((s, i) => {
      const x = i * step;
      const y = mid - (s.drift / maxAbs) * (mid - 12);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
