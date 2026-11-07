# VOIDZONE — UX DECISION LOG (`v15.0`)

## 1. Navigation & Information Architecture Decisions
- **5 Top-Level Public Tabs (`Home`, `Book`, `Community`, `Cooler`, `Rewards`)**:
  - *Why*: Reduces top-level cognitive load and prevents horizontal dock overflow on desktop and mobile while keeping every core player workflow 1 tap away.
- **Combining `Social`, `Creators`, `Collab`, and `Esports` Inside `Community`**:
  - *Why*: Players, streamers, esports teams, and brand sponsors share the same ecosystem identity (`@handle`). Grouping them inside the unified `.vz-community-unified-bar` eliminates top-level tab clutter while keeping all 5 sub-ecosystems immediately accessible.
- **1-Step-Down Single-Pill `FrostedGlassTabBar` with `1.32x` Popup Zoom**:
  - *Why*: Separates brand/account telemetry in the top header from primary view switching, prevents hover jitter by tracking pointer coordinates smoothly with `.vz-liquid-lens`, and avoids duplicate hover text popups.

## 2. Homepage & Booking Simplification Decisions
- **Focused 6-Section Homepage (`v14.0–v15.0`)**:
  - *Why*: Replaced 11 competing legacy homepage widgets (spin wheels, referral codes, trivia, heatmaps) with a scannable hierarchy: Hero + Live Station Availability → 4 Core Gaming Modes → Membership Snapshot → Community/Esports Pulse.
- **Frosted-Glass Segmented Selectors in `Book`**:
  - *Why*: Converted branch selection and gaming category selection into tactile frosted-glass pill bars with immediate live availability counters (`17 of 17 PC Free`).

## 3. Search, Filter & Code Hygiene Decisions (`v15.0`)
- **Pro-Level Search & `Clear all` Filter Reset (`renderProSearchBar`)**:
  - *Why*: Allows users to search across Community posts, Social clips, Creators, and Brand Campaigns and reset both keyword and sub-tab/platform filters in 1 click, with a clear `renderEmptyState` fallback when 0 items match.
- **Dead Pre-v10 3D CSS Removal**:
  - *Why*: Removed `8.7 KB` of unused legacy 3D door/cube/flip CSS and conflicting mobile `#nav` overrides, improving stylesheet maintainability and eliminating dead code.
