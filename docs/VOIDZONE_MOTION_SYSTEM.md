# VOIDZONE — Central Motion System Specification (`Deliverable 34`)

## 1. Motion Principles
1. **Fast & Responsive**: Content updates immediately upon user interaction; animations guide spatial orientation without making the user wait.
2. **Subtle & Purposeful**: Use small directional offsets (`2px`–`16px`) paired with opacity rather than full-viewport slides or 3D flips.
3. **Physically Stable Glass**: Frosted-glass surfaces (`FrostedGlassTabBar`, `.vz-liquid-lens`, `.c`) maintain stable `backdrop-filter` blur values while animating only GPU-friendly `transform`, `opacity`, and subtle border/tint illumination.
4. **Always Interruptible**: Rapid sequential navigation (`Home → Community → Social → Creators → Home`) cancels any in-flight transition and immediately settles on the latest destination.

## 2. Central Motion Tokens (`:root`)

### Durations
| Token | Value | Usage |
| :--- | :--- | :--- |
| `--motion-duration-instant` | `0ms` | Immediate state resets and reduced-motion mode |
| `--motion-duration-micro` | `90ms` | Active button press (`:active`) and color/text feedback |
| `--motion-duration-fast` | `140ms` | Button hover, input focus rings, sub-view fades |
| `--motion-duration-standard` | `200ms` | Page/tab content entrance (`vzMotionTabEnter`), card hover, toast transitions |
| `--motion-duration-emphasized` | `260ms` | Shared active glass indicator (`.vz-liquid-lens`) and drawer/sheet slide |
| `--motion-duration-slow` | `360ms` | Ambient background / major ceremonial transitions |

### Easings
| Token | Value | Usage |
| :--- | :--- | :--- |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Border, background, and shadow transitions |
| `--motion-ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` | Incoming page/tab content, modals, drawers, and hover lifts |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting overlays and dismissals |
| `--motion-ease-emphasized` | `cubic-bezier(0.22, 1, 0.36, 1)` | Emphasized UI transitions |
| `--motion-ease-spring` | `cubic-bezier(0.22, 1.18, 0.36, 1)` | Shared `.vz-liquid-lens` active tab indicator movement |

### Distances & Glow Levels
- **Distances**: `--motion-distance-micro: 2px`, `--motion-distance-small: 10px`, `--motion-distance-medium: 16px`, `--motion-distance-large: 24px`.
- **Glows**: `--vz-glow-none`, `--vz-glow-subtle`, `--vz-glow-medium`, `--vz-glow-featured`.

## 3. Component & Pattern Specifications
- **Tab Transition (`MotionTabTransition`)**: Dynamically computes direction (`+1` forward, `-1` backward) via `getTabTransitionDirection(fromView, toView)` using `getAuthorizedNavTabIds()`, glides `.vz-liquid-lens` across `#nav`, and animates `#app` over `200ms` from `translate3d(calc(var(--motion-tab-dir) * 10px), 0, 0)` and `opacity: 0.01` to rest.
- **Swipe Behavior (`handleSwipeGesture`)**: Requires `Math.abs(dx) >= 60` and `Math.abs(dx) > Math.abs(dy) * 1.6`, aborts on vertical scroll (`touchSwipeMaxScrollY > 28`), and ignores all interactive controls (`input`, `button`, `a`, `select`, `textarea`, `.vz-frosted-tabbar`, `.auth-drawer`).
- **Modal & Drawer Transitions**: `.drawer-backdrop` fades in over `200ms`; `.auth-drawer` slides in from the right (`translateX(100% -> 0)`) on desktop (`>= 768px`) and from the bottom (`translateY(100% -> 0)`) as a bottom sheet on mobile (`< 768px`) over `260ms`.
- **Reduced Motion (`@media (prefers-reduced-motion: reduce)`)**: Collapses all `--motion-duration-*` tokens to `0ms` and `--motion-distance-*` tokens to `0px`, disabling decorative 3D background animations while preserving all active/focus/selected visual states.
