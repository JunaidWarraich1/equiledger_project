import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const CAPTION = `Built EquiLedger: a precision financial audit engine that solves the "$100 / 3" floating-point problem using the Hamilton / Hare-Niemeyer largest-remainder algorithm.

Zero-discrepancy bill splitting, a rounding-leakage simulator across 100k transactions, and a live IEEE 754 flaw lab — built with React + Vite by Muhammad Junaid Warraich, deployed on Vercel.

#SoftwareEngineering #Fintech #React #FullStack`;

const TALKING_POINTS = [
  'Why naive float division silently loses cents at scale, and how largest-remainder allocation guarantees the parts always sum to the whole.',
  'The difference between per-transaction rounding and a residue-buffer ledger that carries fractional remainders forward.',
  'Trade-offs between five rounding strategies (half-up, floor, ceiling, banker\u2019s, residue buffer) for cash vs. digital settlement.',
  'How IEEE 754 double-precision breaks down at the Number.MAX_SAFE_INTEGER boundary, and why financial systems use integer cents instead.',
];

export default function LinkedInModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  function copyCaption() {
    navigator.clipboard.writeText(CAPTION).then(() => {
      setCopied(true);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#E3B24F', '#3FD8A6', '#EDF1FA'] });
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(4,7,14,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="glass" style={{ maxWidth: 560, width: '100%', padding: 28, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 20 }}>Portfolio & interview guide</h3>
          <button onClick={onClose} className="btn" style={{ padding: 8 }}><X size={16} /></button>
        </div>

        <div className="eyebrow" style={{ marginTop: 20 }}>Talking points</div>
        <ul style={{ marginTop: 10, paddingLeft: 18, color: 'var(--text-mid)', lineHeight: 1.6, fontSize: 14 }}>
          {TALKING_POINTS.map((t, i) => <li key={i} style={{ marginBottom: 8 }}>{t}</li>)}
        </ul>

        <div className="eyebrow" style={{ marginTop: 20 }}>Ready-to-copy caption</div>
        <div className="mono" style={{
          marginTop: 10, whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.6,
          background: 'var(--ink-900)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
          padding: 14, color: 'var(--text-mid)',
        }}>
          {CAPTION}
        </div>

        <button className="btn btn-gold" onClick={copyCaption} style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy caption'}
        </button>
      </div>
    </div>
  );
}
