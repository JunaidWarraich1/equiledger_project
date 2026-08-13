import { useState } from 'react';
import { Download } from 'lucide-react';

const CASES = [
  { label: '0.1 + 0.2', run: () => 0.1 + 0.2, expect: 0.3 },
  { label: '(100 / 3) * 3', run: () => (100 / 3) * 3, expect: 100 },
  { label: '9007199254740992 + 1', run: () => 9007199254740992 + 1, expect: 9007199254740993 },
  { label: '0.1 * 3', run: () => 0.1 * 3, expect: 0.3 },
  { label: '1.005 * 100 (rounded)', run: () => Math.round(1.005 * 100), expect: 101 },
];

const OPS = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
};

export default function PrecisionSandbox() {
  const rows = CASES.map((c) => {
    const actual = c.run();
    return { ...c, actual, exact: actual === c.expect };
  });

  // "Try it yourself" — lets the user pick their own numbers and watch
  // JavaScript's own float engine (not EquiLedger's math) misbehave live.
  const [a, setA] = useState(0.1);
  const [op, setOp] = useState('+');
  const [b, setB] = useState(0.2);
  const rawResult = OPS[op](a, b);

  function exportCsv() {
    const header = 'expression,expected,actual,exact\n';
    const body = rows.map((r) => `"${r.label}",${r.expect},${r.actual},${r.exact}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = 'equiledger-precision-audit.csv';
    el.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="glass" style={{ padding: 28, marginTop: 22 }}>
      <div className="eyebrow">03 · CS precision sandbox</div>
      <h2 style={{ fontSize: 26, marginTop: 8 }}>Floating-point flaw lab</h2>
      <p style={{ color: 'var(--text-mid)', marginTop: 8, maxWidth: 640, lineHeight: 1.55 }}>
        This is a <strong>reference table</strong>, not a calculator tied to the tools above —
        these are five well-known bugs baked into how JavaScript (and most languages)
        represent decimal numbers in binary. They're fixed on purpose, to show <em>why</em>
        EquiLedger avoids float math for money entirely and works in integer cents instead.
      </p>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span className="mono" style={{ fontSize: 13, color: 'var(--text-mid)' }}>{r.label}</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: r.exact ? 'var(--teal)' : 'var(--red)' }}>
              {r.actual}
            </span>
          </div>
        ))}
      </div>

      <button className="btn btn-gold" onClick={exportCsv} style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Download size={16} /> Export CSV audit report
      </button>

      <div style={{ marginTop: 30, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <div className="eyebrow">Try it yourself</div>
        <p style={{ color: 'var(--text-mid)', marginTop: 8, fontSize: 14 }}>
          Pick your own numbers — this runs live, in your browser's own JS engine, so it will
          change as you type.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
          <input type="number" value={a} onChange={(e) => setA(+e.target.value)} style={{ width: 110 }} />
          <select value={op} onChange={(e) => setOp(e.target.value)} style={{ width: 70 }}>
            {Object.keys(OPS).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" value={b} onChange={(e) => setB(+e.target.value)} style={{ width: 110 }} />
          <span style={{ color: 'var(--text-lo)' }}>=</span>
          <span className="mono" style={{
            fontWeight: 700, fontSize: 15,
            color: rawResult === Math.round(rawResult * 1e10) / 1e10 && String(rawResult).length < 12 ? 'var(--text-hi)' : 'var(--gold)',
          }}>
            {rawResult}
          </span>
        </div>
      </div>
    </section>
  );
}
