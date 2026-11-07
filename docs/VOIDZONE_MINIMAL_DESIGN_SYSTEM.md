# VOIDZONE — Minimalist UI/UX Design System (`Section 40`)

## 1. Design Philosophy: Content First, Interface Second
Every visible element has a clear functional reason to exist:
- **Open Surfaces Over Card Spam**: Information is organized using typography, hairline grids (`.vz-open-grid-4`), and clean list rows (`.vz-clean-row`) rather than stacking cards inside cards.
- **Glass Reserved for Floating Navigation**: `backdrop-filter: blur(24px)` is applied exclusively to sticky/floating navigation (`header`, `FrostedGlassTabBar`, `.drawer-backdrop`). Content containers use crisp, unblurred dark surfaces (`rgba(11, 14, 20, 0.92)`) for maximum text contrast and zero scroll repaint overhead.

## 2. Typography & Spacing Tokens
- **Typography**: `--type-display` (`clamp(2.25rem, 4.6vw, 3.55rem)`), `--type-h1` (`clamp(1.85rem, 3.5vw, 2.65rem)`), `--type-h2` (`clamp(1.25rem, 1.9vw, 1.45rem)`), `--type-h3` (`17px`), `--type-body` (`15px`), `--type-small` (`13px`), `--type-label` (`11px` mono uppercase `.vz-kicker`), and `tabular-nums` `--type-stat`.
- **Spacing**: `--space-1` (`4px`), `--space-2` (`8px`), `--space-3` (`12px`), `--space-4` (`16px`), `--space-5` (`20px`), `--space-6` (`24px`), `--space-8` (`32px`), `--space-10` (`40px`), `--space-12` (`48px`), `--space-16` (`64px`), `--space-20` (`80px`), `--space-24` (`96px`).

## 3. Surface & Button Hierarchy
- **Surfaces**: `Base` (`#06070b`) → `Section` (`.vz-minimal-section` with `1px` top hairline) → `Content` (`.vz-open-item` / `.c`) → `Interactive` (`.vz-open-clickable` / `.sub-panel`) → `Featured` (`.vz-hero-minimal`).
- **Buttons**:
  1. **Primary (`.b.vz-btn-primary`)**: Warm accent border (`rgba(255, 115, 36, 0.62)`) + subtle orange-crimson tint; limited to one primary CTA per hero/section.
  2. **Secondary (`.b.o`)**: Neutral `rgba(255, 255, 255, 0.035)` surface with `1px solid rgba(255, 255, 255, 0.09)` border.
  3. **Tertiary (`.step-pill`)**: Compact inline action pill.
  4. **Destructive (`.b.danger`)**: High-contrast crimson action for session revocation or resets.

## 4. Minimal Motion System (`Section 32`)
- **Durations**: `--motion-duration-micro: 80ms`, `--motion-duration-fast: 140ms`, `--motion-duration-standard: 190ms`, `--motion-duration-emphasized: 250ms`.
- **Transitions**: GPU-composited `opacity` and `transform` only; zero bounce, zero 3D card tilt, and full `@media (prefers-reduced-motion: reduce)` support.
