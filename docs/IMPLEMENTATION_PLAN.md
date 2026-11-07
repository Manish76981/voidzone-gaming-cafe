# VOIDZONE — Controlled Implementation Plan (Phases 5–20)

## Execution Dependency Map
1. **Foundation & Design Tokens (Phase 6)** → Centralize `--vz-glass-*`, `--vz-space-*`, and `--tab-tint-rgb` tokens in `index.html`.
2. **Core UI Primitives (Phase 7)** → Unify `.c` cards, `.sub-panel` containers, `.vz-ios-subtab-bar` sub-menus, and high-contrast form controls (`input`, `select`, `textarea`).
3. **App Shell & Navigation (Phase 8)** → Position `FrostedGlassTabBar` 1 step below `<header>`, remove duplicate `vz-combined-hub-switcher` banners, and enforce untransformed `offsetLeft` popup dock physics.
4. **Home & Page-by-Page Refinement (Phases 9–11)** → Verify unclipped sub-tab labels and responsive card grids across `#home`, `#book`, `#community`, `#social`, `#creators`, `#collaborate`, `#cafe`, `#esports`, `#rewards`, `#staff`, `#owner`, and `#developer`.
5. **Responsive, Accessibility, Performance & Security (Phases 12–15)** → Verify mobile/tablet horizontal scroll, `:focus-visible` outlines, `prefers-reduced-motion` fallbacks, lazy social embeds, and strict RBAC/CCBoot boundaries.
6. **Full Testing & Production Build (Phases 16–20)** → Sync `worker.js` and `dist/index.html` via `npm run build` and run all automated tests via `npm test`.
