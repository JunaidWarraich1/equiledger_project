import { Scale, Linkedin } from 'lucide-react';

export default function Header({ onOpenLinkedIn }) {
  return (
    <header style={{ padding: '32px 0 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: 'linear-gradient(160deg, var(--gold), #a97d20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Scale size={18} color="#241804" strokeWidth={2.4} />
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
          EquiLedger
        </span>
      </div>
      <button className="btn" onClick={onOpenLinkedIn} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Linkedin size={15} /> Portfolio guide
      </button>
    </header>
  );
}
