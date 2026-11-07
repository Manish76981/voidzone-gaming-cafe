# VOIDZONE Performance, 3D Rendering & Database Optimization Audit (`WEBSITE_PERFORMANCE_AUDIT.md`)

## 1. Bundle & Asset Footprint Analysis
- **Single-File App (`index.html`)**: ~685 KB unminified (~148 KB Brotli/Gzip compressed over Cloudflare Edge CDN), containing all 7 views, SVG illustrations, Web Audio synthesizer, 13-sheet Excel engine, Developer CMS, and CCBoot adapter with **zero render-blocking external JS requests** (`xlsx.full.min.js` uses `defer`).
- **Fonts**: Loaded asynchronously via Google Fonts with `rel="preconnect"` to `fonts.googleapis.com` and `fonts.gstatic.com`.

## 2. 3D Scene, GPU Compositing & Animation Audit (Section 11 & 23)
| Visual Component | Audit Finding | Remediation Implemented in v9.0 |
| :--- | :--- | :--- |
| **Ambient 3D Wireframe Cubes (`#vz-bg3d`)** | Uses `transform-style: preserve-3d` and continuous `@keyframes` rotation; on narrow mobile GPUs (`<600px`) or `prefers-reduced-motion`, continuous 3D cube rotation consumes unnecessary battery | Added `@media (max-width: 600px)` and `@media (prefers-reduced-motion: reduce)` rules to pause/hide `#vz-bg3d` on low-power mobile devices while keeping full 3D depth on desktop/tablet |
| **3D Layering & Pointer Interception** | Fixed background layers and perspective stages can cause z-fighting or intercept pointer drags | Locked `#vz-bg3d` to `z-index: 0; pointer-events: none; backface-visibility: hidden` and `#stage` to `position: relative; z-index: 1` |
| **Live Stopwatch Timers (`setInterval`)** | 1-second stopwatch DOM updates ran `querySelectorAll` every second when `view === "staff"` | Scoped stopwatch DOM queries strictly to when `S.staffSubTab === "trackers"` and `document.visibilityState !== "hidden"` |

## 3. Database Query & Index Optimization (`schema.sql`)
Added 6 composite indexes to eliminate full-table scans on high-frequency lookups:
- `idx_auth_sessions_lookup ON auth_sessions(token_hash, revoked, expires_at)`
- `idx_members_account ON members(member_account)`
- `idx_snack_log_date_tx ON snack_log(sale_date, tx_id)`
- `idx_wallet_topups_date_phone ON wallet_topups(deposit_date, phone)`
- `idx_opex_ledger_date ON opex_ledger(expense_date)`
- `idx_ccboot_pcs_maint ON ccboot_pcs(maintenance_status)`
