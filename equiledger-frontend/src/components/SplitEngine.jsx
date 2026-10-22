import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api, hamiltonAllocate, naiveAllocate, sum } from '../api.js';

function computeSplit(amount, count) {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const safeCount = Math.min(12, Math.max(2, parseInt(count, 10) || 2));
  const weights = Array.from({ length: safeCount }, () => 1);
  const totalCents = Math.round(safeAmount * 100);
  const exactCents = hamiltonAllocate(totalCents, weights);
  const exactDollars = exactCents.map((c) => c / 100);
  const exactSumCents = sum(exactCents);

  const naive = naiveAllocate(safeAmount, weights);
  const naiveSum = +sum(naive).toFixed(2);

  return {
    input: { amount: safeAmount, weights },
    naive: {
      shares: naive,
      total: naiveSum,
      discrepancy: +(safeAmount - naiveSum).toFixed(2),
    },
    exact: {
      shares: exactDollars,
      total: exactSumCents / 100,
      discrepancy: +((totalCents - exactSumCents) / 100).toFixed(2),
    },
  };
}

export default function SplitEngine() {
  const [amount, setAmount] = useState(100);
  const [parties, setParties] = useState(3);
  const [partiesInput, setPartiesInput] = useState('3');
  const [result, setResult] = useState(() => computeSplit(100, 3));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const weights = Array.from({ length: parties }, () => 1);

    const timer = setTimeout(() => {
      api.split(amount, weights)
        .then((data) => {
          if (!cancelled && data) setResult(data);
        })
        .catch(() => {
          if (!cancelled) {
            setResult(computeSplit(amount, parties));
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [amount, parties]);

  return (
    <section className="glass" style={{ padding: 28, marginTop: 22 }}>
      <div className="eyebrow">01 · Exact split & remainder engine</div>
      <h2 style={{ fontSize: 26, marginTop: 8 }}>The $100 / 3 problem</h2>
      <p style={{ color: 'var(--text-mid)', marginTop: 8, maxWidth: 620, lineHeight: 1.55 }}>
        Divide money three ways with ordinary float math and the parts don't add back up.
        This calls the EquiLedger engine, which uses the Hamilton / Hare-Niemeyer largest-remainder
        method in integer cents to guarantee every allocation reconciles to zero.
      </p>

      <div style={{ display: 'flex', gap: 24, marginTop: 24, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>
          Total amount ($)
          <input type="number" min="0" step="0.01" value={amount}
            onChange={(e) => setAmount(Math.max(0, +e.target.value))} style={{ width: 140 }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-mid)' }}>
          Split across
          <input
            type="number"
            min="2"
            max="12"
            value={partiesInput}
            onChange={(e) => {
              setPartiesInput(e.target.value);
              const n = parseInt(e.target.value, 10);
              if (Number.isInteger(n) && n >= 2 && n <= 12) setParties(n);
            }}
            onBlur={() => {
              const n = Math.min(12, Math.max(2, parseInt(partiesInput, 10) || 2));
              setParties(n);
              setPartiesInput(String(n));
            }}
            style={{ width: 140 }}
          />
        </label>
        {loading && <Loader2 size={18} className="spin" style={{ alignSelf: 'center', color: 'var(--text-lo)' }} />}
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 26 }}>
          <ResultPanel
            title="Naive IEEE 754 division"
            rows={result.naive.shares}
            total={result.naive.total}
            expected={amount}
            ok={result.naive.discrepancy === 0}
            discrepancy={result.naive.discrepancy}
            accent="var(--red)" accentDim="var(--red-dim)"
          />
          <ResultPanel
            title="EquiLedger allocation"
            rows={result.exact.shares}
            total={result.exact.total}
            expected={amount}
            ok={result.exact.discrepancy === 0}
            discrepancy={result.exact.discrepancy}
            accent="var(--teal)" accentDim="var(--teal-dim)"
          />
        </div>
      )}
    </section>
  );
}

function ResultPanel({ title, rows, total, expected, ok, discrepancy, accent, accentDim }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: 18, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
        {ok ? <CheckCircle2 size={18} color={accent} /> : <XCircle size={18} color={accent} />}
      </div>
      <div className="mono" style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {rows.map((r, i) => (
          <span key={i} style={{ background: accentDim, color: accent, padding: '4px 10px', borderRadius: 999, fontSize: 13 }}>
            ${r.toFixed(2)}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-mid)' }}>
        Sum: <span className="mono" style={{ color: 'var(--text-hi)' }}>${total.toFixed(2)}</span>
        {' '}vs expected <span className="mono" style={{ color: 'var(--text-hi)' }}>${expected.toFixed(2)}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: accent, fontWeight: 600 }}>
        Discrepancy: {discrepancy === 0 ? '$0.00 exact' : `$${discrepancy.toFixed(2)}`}
      </div>
    </div>
  );
}
