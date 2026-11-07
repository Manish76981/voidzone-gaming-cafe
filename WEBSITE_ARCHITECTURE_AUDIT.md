# VOIDZONE Website & Platform Architecture Audit (`WEBSITE_ARCHITECTURE_AUDIT.md`)

## 1. Executive System Overview
- **Project**: VoidZone Gaming Cafe & Esports Ecosystem Platform (Mazgaon & Charni Road, Mumbai)
- **Version Audited**: v8.0 -> Remediated to **v9.0 Production Platform**
- **Deployment Targets**:
  1. **Cloudflare Pages + Pages Functions + D1 (`dist/` + `functions/api/*.js`)**
  2. **Cloudflare Workers Single-Script Bundle (`worker.js` with embedded `HTML_BASE64` + D1 binding `DB`)**

| Layer | Technology Stack | Status |
| :--- | :--- | :--- |
| **Frontend** | Vanilla ES2022 Single-Page Application (`index.html`), reactive state store (`S`), hash/tab router (`go()`), CSS Custom Properties (`--ac`, `--bg`, `--sf`) | **Confirmed & Tested** |
| **Backend API** | Cloudflare Pages Functions (`functions/api/*.js` — 10 endpoints) + unified Cloudflare Worker (`worker.js`) | **Confirmed & Tested** |
| **Database** | Cloudflare D1 Serverless SQLite (`schema.sql` — 19 tables, 8 indexes, strict `CHECK` constraints) | **Confirmed & Tested** |
| **Build & QA** | Zero-dependency Node.js ES module bundler (`scripts/build.mjs`) + VM/SQLite3 E2E test runner (`test/run-tests.mjs`) | **Confirmed & Tested** |

## 2. Frontend Architecture Map
- **Routing System**: In-memory view state (`view`) synchronized with `window.location.hash` (`#home`, `#book`, `#cafe`, `#esports`, `#rewards`, `#staff`, `#owner`, `#developer`).
- **Role-Aware Brand Navigation**: Clicking the primary `VOIDZONE` header logo/title (`[data-action="title-go-home"]`) routes the user to their authenticated role's home destination (`Customer/Guest -> #home`, `Staff -> #staff`, `Owner -> #owner`, `Developer -> #developer`) without mutating session, account, or CCBoot state.
- **Swipe Navigation**: Multi-input horizontal gesture recognizer (`touchstart`/`touchend`, `pointerdown`/`pointerup`, `wheel` trackpad `deltaX`) with strict first/last tab boundary clamping (`0 <= idx <= tabs.length - 1`), vertical scroll immunity, and interactive-element exclusion (`input, textarea, select, button, a, canvas, .sc, .auth-drawer`).
- **State Management**: Centralized state tree `S` persisted to `localStorage` (`vz_mazgaon_v5_live`) with schema validation (`validateAndHydrateState`) and non-blocking Cloudflare D1 synchronization.

## 3. Backend & API Architecture Map
| Endpoint | Methods | Purpose | Auth & RBAC Requirement (v9.0 Hardened) |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Edge liveness & D1 binding status check | Public (read-only status) |
| `/api/auth` | `POST` | Customer sign-up/sign-in, 5-step CCBoot-first operator login, session revocation | Public entry; issues `HttpOnly` cookie & stores `token_hash` |
| `/api/bookings` | `GET, POST` | Atomic station slot reservation, collision detection & promo code validation | Public `POST` (validated); `GET` masks PII unless Staff/Owner session |
| `/api/inventory` | `POST` | F&B Cooler stock deduction & `snack_log` recording | **Staff or Owner** verified session (`verifySessionRole(['staff','owner'])`) |
| `/api/wallet` | `POST` | Player wallet top-ups & membership deposit bonuses | **Staff or Owner** verified session (`verifySessionRole(['staff','owner'])`) |
| `/api/master-log` | `POST` | 21-column Master Log checkout & split-payment recording | **Staff or Owner** verified session (`verifySessionRole(['staff','owner'])`) |
| `/api/cash-drawer` | `GET, POST` | Physical till denomination counts & shift variance ledger | `POST`: **Staff or Owner**; `GET`: **Owner only** (`verifySessionRole(['owner'])`) |
| `/api/owner` | `GET, POST` | 13-sheet P&L aggregation, OpEx ledger & bulk financial data | **Owner only** (`verifySessionRole(['owner'])` — Developer & Staff blocked) |
| `/api/cms` | `GET, POST` | Website branding, theme, dynamic pricing, offers & version rollback | `GET` (published): Public; `POST`/Drafts: **Developer only** (`verifySessionRole(['developer'])`) |
| `/api/ccboot` | `GET, POST` | Two-mode Standalone vs. CCBoot/iCafeCloud (`cp.icafecloud.com`) adapter | **Developer** (config/sync) or **Staff/Owner** (read-only station status) |

## 4. Database Architecture (`schema.sql` — 19 Tables)
1. `members`: Registered customer accounts, salted PIN hashes, wallet balances, and loyalty vault metrics.
2. `auth_sessions`: Hashed session tokens (`token_hash`), `ccboot_operator_id`, `ccboot_verified`, `role`, `permissions_json`, `revoked`, `expires_at`.
3. `stations`: Hardware registry for 22 stations (`PC-1`..`PC-17`, `PS-1`..`PS-4`, `SIM-1`).
4. `master_log`: 21-column transactional session and split-payment ledger.
5. `snack_log`: Itemized F&B Cooler sales linked to `master_log.tx_id`.
6. `inventory`: Cooler SKU catalog, wholesale purchases, sold counts, and reorder thresholds.
7. `wallet_topups`: Customer deposit records and membership tier bonus credits.
8. `opex_ledger`: Monthly operating expenses (`Rent`, `Electricity`, `Internet`, `Staff`, `Maintenance`).
9. `customer_directory`: Lifetime spend and visit rollup directory.
10. `cash_drawer_ledger`: Shift till denomination snapshots and expected-vs-physical variance audit.
11. `cms_settings`: Draft and published JSON configurations for branding, theme, pricing, and feature flags.
12. `cms_versions`: Immutable release snapshots for 1-click rollback.
13. `cms_offers`: Server-enforced promo codes (`VOID20`, `SQUAD50`), caps, dates, and usage counters.
14. `cms_audit_log`: Sanitized developer configuration audit trail.
15. `ccboot_config`: Two-mode (`STANDALONE` vs `CCBOOT_INTEGRATION`) configuration and masked token metadata.
16. `ccboot_pcs`: Per-station boot mode (`LOCAL_NVME`, `PXE_ISCSI`, `HYBRID`), VHD image, IP/MAC, and maintenance lock state.
17. `ccboot_sync_log`: Sanitized telemetry log for CCBoot/iCafeCloud adapter operations.
18. `ccboot_operator_links`: Links CCBoot operator identities (`ccboot_operator_id`) to VoidZone accounts and strictly assigns RBAC roles (`staff`, `owner`, `developer`).
19. `esports_ecosystem`: Tracks Esports tournament registrations, Academy coaching enrollments, and Creator Studio bookings.

## 5. Third-Party & Infrastructure Integrations
| Integration | Status | Details |
| :--- | :--- | :--- |
| **Cloudflare D1 SQLite** | **Active** | Bound via `env.DB` across all 10 Pages Functions and `worker.js` |
| **CCBoot / iCafeCloud (`cp.icafecloud.com`)** | **Optional Two-Mode Adapter** | Mode A (`STANDALONE`) runs 100% independently; Mode B (`CCBOOT_INTEGRATION`) connects to `https://api.icafecloud.com/api/v2/cafe/{cafeId}` |
| **SheetJS (`xlsx.full.min.js`)** | **Active** | Loaded with `defer` from jsDelivr CDN for 13-sheet `.xlsx` workbook export |
| **WhatsApp Deep Links (`wa.me`)** | **Active** | Pre-filled customer booking receipts, party quotes, and desk login passes |
