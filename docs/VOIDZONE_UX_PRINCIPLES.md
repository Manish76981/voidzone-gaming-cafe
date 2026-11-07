# VOIDZONE — UX Principles & Interaction Standards

## 1. Less Chrome, More Content
- **Single Compact Header (`header.vz-minimal-header`)**: Contains only the clickable `VOIDZONE` brand mark (`MAZGAON · MUMBAI`) on the left and secondary authentication/profile controls on the right.
- **1-Step-Down Popup Frosted-Glass Dock (`#vz-popup-dock-row`)**: Sits directly below the header as a single rounded pill bar with all 9 public tabs visible and zero instructional clutter.
- **Zero Duplicate Navigation Banners**: Pages open directly into their primary hero or workspace without redundant intermediate hub strips.

## 2. Invisible, Safe Multi-Modal Navigation
- **Pointer & Touch**: Full-pill click/tap targets (`min-height: 38px`) with smooth macOS/iOS-27 popup magnification (`1.32x`) and floating `.vz-dock-popup-tip` badges.
- **Keyboard Accessibility**: Full `role="tablist"` and `role="tab"` semantics with `aria-selected`, `aria-current="page"`, and `ArrowLeft` / `ArrowRight` / `Home` / `End` roving focus.
- **Boundary-Clamped Horizontal Swipe**: Supports touch swipe, trackpad two-finger horizontal swipe, and pointer drag while ignoring vertical scrolling (`touchSwipeMaxScrollY > 28`), text selection, inputs, buttons, modals, and the tab bar itself.
