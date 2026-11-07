# VOIDZONE — PRO-LEVEL DESIGN SYSTEM (`v15.0`)

## 1. Brand & Visual Direction
- **Aesthetic**: Spatial Obsidian & Precision Frosted Glass (`#090C12` canvas, `#0F131C` elevated card surface, `rgba(18, 24, 36, 0.72)` glass panels, `#FF6B00` Void Orange primary accent, `#38BDF8` Cyber Cyan telemetry accent).
- **Typography Scale**:
  - Brand Header (`VOIDZONE`): `24px` (`1.5rem`) Space Grotesk `800`.
  - Hero Display: `clamp(1.85rem, 3.4vw, 2.65rem)` line-height `1.12`.
  - Section H1/H2: `clamp(1.25rem, 2.2vw, 1.65rem)` line-height `1.2`.
  - Card Title H3: `1.05rem` (`16.8px`) weight `700`.
  - Body Copy: `0.9375rem` (`15px`) Plus Jakarta Sans, `max-width: 68ch`.
  - Monospace Telemetry & Pricing: JetBrains Mono (`--font-mono`).

## 2. Central Motion System (`--motion-*`)
- **Durations**: `--motion-duration-instant` (`60ms`), `--motion-duration-micro` (`110ms`), `--motion-duration-fast` (`160ms`), `--motion-duration-standard` (`220ms`), `--motion-duration-emphasized` (`300ms`), `--motion-duration-slow` (`420ms`).
- **Easings**: `--motion-ease-standard` (`cubic-bezier(0.22, 1, 0.36, 1)`), `--motion-ease-enter` (`cubic-bezier(0.16, 1, 0.3, 1)`), `--motion-ease-exit` (`cubic-bezier(0.4, 0, 1, 1)`), `--motion-ease-spring` (`cubic-bezier(0.34, 1.42, 0.64, 1)`).
- **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` support collapsing transitions and disabling decorative movement.

## 3. Core Component Specifications
- **Primary Dock (`FrostedGlassTabBar`)**: Single-pill 1-step-down bar (`#vz-popup-dock-row` → `nav#nav.vz-frosted-tabbar.vz-popup-dock`) with `.vz-liquid-lens` indicator and `1.32x` hover popup zoom.
- **Unified Community Hub Bar (`.vz-community-unified-bar`)**: Groups `Community`, `Social`, `Creators`, `Collab`, and `Esports` inside a single top-level destination.
- **Pro Search & Filter Bar (`.vz-pro-search-bar`)**: Keyword search input (`#eco-search-input`), active filter status badge, and 1-click `✕ Clear all` reset button (`data-action="eco-clear-filters"`).
