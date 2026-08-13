# EquiLedger — Precision Financial Audit & Remainder Engine ⚖️

A full-stack app that solves two real money-math problems: **unfair rounding when
splitting a total across parties** (the "$100 / 3" problem), and **rounding
leakage at scale** (the "petrol $99.50/L" problem, where a fractional price
rounded on every transaction quietly gains or loses money over thousands of sales).

This is two separate deployable projects:

```
equiledger-backend/    Node.js + Express API — all the math lives here
equiledger-frontend/   React (Vite) UI — calls the API, displays results
```

## Why a backend at all?

Splitting money and simulating rounding are exactly the kind of logic that
should never live only in the browser: a user could tamper with client-side
JS, and any other client (mobile app, another service) would have to
re-implement the same math. Putting it behind a real API means the logic is
authoritative in one place, testable on its own, and reusable.

## The core algorithm — Hamilton / Hare-Niemeyer allocation

Given a total amount (converted to **integer cents**, never floats) and a list
of weights:

1. Compute each party's exact fractional share of the total.
2. Give everyone the floor (rounded-down) of their share.
3. There will be a small number of leftover cents (`total − sum of floors`).
4. Hand out those leftover cents one at a time to the parties with the
   largest fractional remainder, until none are left.

The result always sums back to exactly the original total — because it's
built from the total, not approximated toward it.

The rounding-leakage simulator instead compares five per-transaction rounding
strategies (half-up, floor, ceiling, banker's rounding, and a "residue
buffer" strategy that carries the fractional remainder forward so it never
compounds) and measures the cumulative drift of each against the true total.

## API reference (backend)

| Method | Route | Body | Description |
|---|---|---|---|
| GET | `/api/health` | — | Health check |
| POST | `/api/split` | `{ amount, weights: number[] }` | Returns naive vs. exact allocation |
| POST | `/api/simulate-rounding` | `{ unitPrice, count, strategyId }` | Simulates N transactions under a rounding strategy |
| GET | `/api/strategies` | — | Lists available rounding strategy ids |
| GET | `/api/history?limit=50` | — | Recent logged calculations |

All money math on the server is done in integer cents. Invalid input (negative
amounts, non-numeric weights, out-of-range transaction counts, unknown
strategy ids) returns `400` with a JSON `{ error }` body.

History is stored in a small JSON file (`equiledger-backend/data/db.json`,
via `lowdb`) — enough to demonstrate persistence and a `GET` read endpoint
without needing to stand up a full database server. Swap in Postgres/Mongo
later if you want to go further.

## Running it locally

**Backend:**
```bash
cd equiledger-backend
npm install
npm start
# → http://localhost:5000
```

**Frontend** (in a second terminal):
```bash
cd equiledger-frontend
npm install
npm run dev
# → http://localhost:5173 (or whatever Vite prints)
```

The frontend defaults to calling `http://localhost:5000` — no config needed
for local dev.

## Deploying it live

You need two separate deployments: the backend as a web service, the
frontend as a static site.

### 1. Push to GitHub

```bash
# from the repo root (containing both folders)
git init
git add .
git commit -m "EquiLedger: full-stack precision audit engine"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/equiledger.git
git push -u origin main
```

### 2. Deploy the backend (Render, free tier)

1. Go to render.com → New → Web Service → connect your GitHub repo.
2. Set **Root Directory** to `equiledger-backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Deploy. Render gives you a URL like `https://equiledger-api.onrender.com`.
5. Once your frontend is deployed too (next step), come back and add an
   environment variable `ALLOWED_ORIGIN` = your frontend's URL, then redeploy,
   so CORS only allows your real site.

### 3. Deploy the frontend (Vercel)

1. Go to vercel.com → New Project → import the same repo.
2. Set **Root Directory** to `equiledger-frontend`.
3. Framework preset: Vite (auto-detected).
4. Add environment variable `VITE_API_URL` = your Render backend URL from
   step 2 (e.g. `https://equiledger-api.onrender.com`).
5. Deploy. Vercel gives you a public URL like `https://equiledger.vercel.app`
   — this is what you put on GitHub/LinkedIn.

### Notes on free-tier hosting
- Render's free tier "sleeps" after inactivity — the first request after a
  while can take 20-30 seconds to wake up. That's normal, not a bug.
- If the frontend loads but API calls fail with a CORS or network error,
  double check `VITE_API_URL` (frontend) and `ALLOWED_ORIGIN` (backend) match
  the real deployed URLs exactly, including `https://` and no trailing slash.

## License
MIT — free to use for educational and portfolio purposes.
