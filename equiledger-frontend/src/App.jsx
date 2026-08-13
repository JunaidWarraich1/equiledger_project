import { useState } from 'react';
import Header from './components/Header.jsx';
import SplitEngine from './components/SplitEngine.jsx';
import RoundingSimulator from './components/RoundingSimulator.jsx';
import PrecisionSandbox from './components/PrecisionSandbox.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import LinkedInModal from './components/LinkedInModal.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [showLinkedIn, setShowLinkedIn] = useState(false);

  return (
    <>
      <Header onOpenLinkedIn={() => setShowLinkedIn(true)} />

      <div style={{ marginTop: 8 }}>
        <div className="eyebrow">precision financial audit engine</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', marginTop: 10, lineHeight: 1.05 }}>
          Every cent, <span style={{ color: 'var(--gold)' }}>reconciled.</span>
        </h1>
        <p style={{ color: 'var(--text-mid)', marginTop: 14, maxWidth: 640, fontSize: 16, lineHeight: 1.6 }}>
          Three interactive labs demonstrating fixed-point arbitrary-precision math against the
          floating-point and rounding bugs that quietly cost real money.
        </p>
      </div>

      <SplitEngine />
      <RoundingSimulator />
      <PrecisionSandbox />
      <HistoryPanel />
      <Footer />

      {showLinkedIn && <LinkedInModal onClose={() => setShowLinkedIn(false)} />}
    </>
  );
}
