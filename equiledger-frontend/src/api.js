// Base URL of the backend API. In local dev this defaults to your
// backend running on port 5000. In production, set VITE_API_URL in
// your frontend host's environment variables (e.g. Vercel) to your
// deployed backend's URL, e.g. https://equiledger-api.onrender.com
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function post(path, body) {
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
  const res = await fetch(`${API_URL}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  split: (amount, weights) => post('/api/split', { amount, weights }),
  simulateRounding: (unitPrice, count, strategyId, roundingUnit) =>
    post('/api/simulate-rounding', { unitPrice, count, strategyId, roundingUnit }),
  history: (limit = 20) => get(`/api/history?limit=${limit}`),
};
