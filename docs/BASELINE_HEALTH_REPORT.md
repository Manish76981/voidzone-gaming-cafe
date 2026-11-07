# VOIDZONE — Baseline Health Report (Phase 1)

## 1. Executive Summary
Before executing the controlled UI/UX, Information Architecture, and Design System refinement sequence (`v11.0`), a full baseline health check was conducted on the `voidzone-gaming-cafe` repository.

| Check Category | Baseline Status | Details & Metrics |
| :--- | :--- | :--- |
| **Build (`npm run build`)** | **PASS** | `node ./scripts/build.mjs` compiles `index.html` into `worker.js` (`HTML_BASE64`) and `./dist/index.html` with 100% byte parity. |
| **Syntax & Type Verification** | **PASS** | `node --check` passes across `worker.js`, `scripts/build.mjs`, and all 11 Cloudflare Pages Function endpoints (`functions/api/*.js`). |
| **Database Schema & SQL (`schema.sql`)** | **PASS (`SQL_OK:116`)** | All 32 SQLite3 / Cloudflare D1 tables, 14 composite indexes, foreign keys (`PRAGMA foreign_keys = ON`), and 116 parameterized SQL queries execute cleanly. |
| **Automated Test Suite (`npm test`)** | **PASS (`110 / 110`)** | `node ./test/run-tests.mjs` passes all 110 unit, integration, RBAC, CCBoot gateway, ecosystem, and navigation tests (`0 failed`). |
| **Broken Routes** | **0 Broken Routes** | All 12 canonical hash routes (`#home`, `#book`, `#community`, `#social`, `#creators`, `#collaborate`, `#cafe`, `#esports`, `#rewards`, `#staff`, `#owner`, `#developer`) resolve and render without runtime exceptions. |

## 2. Known Visual & UX Issues Identified from Baseline Screenshots
1. **Duplicate Sub-Header Hub Strip (`vz-combined-hub-switcher`)**: Rendered a second `UNIFIED HUB` / `LOUNGE & MENU` bar directly beneath the main dock on `#book`, `#cafe`, `#community`, `#esports`, `#creators`, `#social`, and `#collaborate`, with truncated pill text (`Community Hub (Feed · Tear...`, `Esports & Academy (Bracke...`).
2. **Truncated Sub-Menu Tab Labels**: A `max-width: 140px; overflow: hidden` rule on `.vz-tab-lbl` caused longer sub-tab names (`Creator Services Marketplace`, `Challenges & Leaderboards`, `Sponsorships & Packages`, `Campus & Ambassadors`) to clip mid-word (`Marketplac`, `Leaderb`, `Packa`, `Amba`).
3. **Redundant `+N` Toggle Button inside Sub-Bars**: In-page sub-bars displayed a `⊞ +2` button even when all sub-tabs were already visible.
4. **Card Grid Density on `#social`**: 4-column social cards became narrow on standard laptop viewports.
