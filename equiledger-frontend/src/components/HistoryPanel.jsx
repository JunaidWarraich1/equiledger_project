import { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { api } from '../api.js';

export default function HistoryPanel() {
  const [items, setItems] = useState([]);

  function load() {
    api.history(8)
      .then((data) => {
        if (data && data.history) setItems(data.history);
      })
      .catch(() => {});
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="glass" style={{ padding: 28, marginTop: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="eyebrow">04 · Audit log</div>
          <h2 style={{ fontSize: 22, marginTop: 8 }}>Recent calculations</h2>
        </div>
        <button className="btn" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {items.length === 0 && (
        <div style={{ marginTop: 14, color: 'var(--text-lo)', fontSize: 13 }}>
          No calculations logged yet — try the tools above.
        </div>
      )}

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.02)', fontSize: 13,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-mid)' }}>
              <History size={14} />
              {item.type === 'split'
                ? `Split $${item.input.amount} across ${item.input.weights.length}`
                : `Rounding sim: ${item.input.count.toLocaleString()} @ $${item.input.unitPrice} (${item.input.strategyId})`}
            </span>
            <span className="mono" style={{ color: 'var(--text-lo)' }}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
