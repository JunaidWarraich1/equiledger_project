export default function Footer() {
  return (
    <footer style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-lo)', fontSize: 13, flexWrap: 'wrap', gap: 8 }}>
      <span>EquiLedger — precision financial audit & remainder engine</span>
      <span className="mono">MIT License</span>
    </footer>
  );
}
