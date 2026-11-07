# VoidZone Gaming Cafe — Production Codebase (v5.2.0)

Full-stack single-page application and Cloudflare Edge POS / Financial Ledger system for **VoidZone Gaming Cafe** (Mazgaon & Charni Road, Mumbai).

## Architecture Overview
- **Frontend (`index.html` -> `dist/index.html`)**: Self-contained SPA featuring:
  - **22-Station Booking & Collision Engine**: 17 RTX 4060 PCs (`PC-1`..`PC-17`), 4 PS5 Bean Bag Lounges (`PS5-1`..`PS5-4` / `PS-1`..`PS-4`), and 1 Racing Simulator (`SIM-1`) + Room-Scale VR (`VR-1`).
  - **Zero Auto-Discount Pricing Engine**: Enforces Happy Hour (10:00 AM – 2:00 PM), Peak (2:00 PM – 2:00 AM), Squad rates, and strict opt-in Membership Pass discounts.
  - **Physical Cash Drawer & Denomination Counter**: Tracks INR notes/coins (`₹500` to `₹1`), computes optimal customer change breakdown, and reconciles physical till cash against expected cash.
  - **13-Sheet Excel Master Calculator Engine**: Full in-browser persistence (`localStorage`) + 1-click `.XLSX` workbook and `.CSV` export.
- **Cloudflare Pages Functions (`functions/api/*.js`) & Worker (`worker.js`)**:
  - `GET /api/health` — Readiness & D1 binding status probe
  - `POST /api/auth` — Player `signup`/`register`, `signin` (salted PIN hash verification), and `staff_unlock`
  - `GET` & `POST /api/bookings` — Atomic station collision checking & privacy-masked schedule feed
  - `POST /api/master-log` — 21-column Master Log transaction persistence
  - `POST /api/inventory` — Snack Log & F&B stock decrement engine
  - `POST /api/wallet` — Prepaid wallet deposit & membership bonus credit engine
  - `GET` & `POST /api/cash-drawer` — Physical till shift snapshot & Owner audit ledger
  - `GET` & `POST /api/owner` — Owner-only 13-sheet D1 state dump & OpEx ledger
- **Database (`schema.sql`)**: Cloudflare D1 (SQLite) relational schema with 10 tables and initial seed data.

## Quick Start & Verification
```bash
# 1. Build ./dist and sync worker.js HTML_BASE64
npm run build

# 2. Run automated syntax, SQLite schema/query, and runtime regression test suite
npm test
```

## Environment Variables & Secrets
Copy `.dev.vars.example` to `.dev.vars` for local Wrangler development, or configure in the **Cloudflare Dashboard -> Settings -> Environment Variables**:
- `STAFF_PIN` — Floor Attendant security PIN (default fallback: `1234`)
- `OWNER_PIN` — Cafe Owner executive PIN (default fallback: `9999`)
- `HMAC_PEPPER` — Server-side HMAC-SHA256 secret pepper for player PIN hashing
- `ICAFE_API_KEY` — Optional iCafeCloud v2 REST API key

## Deployment Options

### Option A: Cloudflare Pages + Pages Functions + D1 (Recommended)
1. **Initialize Cloudflare D1 Database**:
   ```bash
   npm run d1:init:remote
   ```
2. **Deploy via GitHub Integration (Continuous Deployment)**:
   - Push this repository to GitHub.
   - In **Cloudflare Dashboard -> Workers & Pages -> Create -> Pages -> Connect to Git**, select your repository.
   - Set **Build command**: `npm run build`
   - Set **Build output directory**: `dist`
   - Under **Settings -> Functions -> D1 database bindings**, bind variable name `DB` to `voidzone-db`.
3. **Or Deploy Directly via Wrangler CLI**:
   ```bash
   npm run pages:deploy
   ```

### Option B: Standalone Cloudflare Worker + D1
```bash
npm run worker:deploy
```
