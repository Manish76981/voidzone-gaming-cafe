# VOIDZONE — ADVANCED MULTI-RESOURCE BOOKING ARCHITECTURE (`v16.0`)

## 1. Bookable Resource Model (`RESOURCE_RULES` & `booking_resources`)
Instead of separate hardcoded flows for PC, PS5, or Simulator, every station is modeled as a **Bookable Resource**:
- **PC Zone (`PC-1`..`PC-17`)**: Capacity `1`, Min `30m` (`0.5h`), Max `8h`, Buffer `0m`, Features `["RTX 4060", "240Hz", "Mechanical KB", "<5ms Riot Direct"]`.
- **PlayStation Zone (`PS5-1`..`PS5-4`)**: Capacity `4`, Min `1h`, Max `6h`, Buffer `5m`, Features `["4K OLED HDR", "DualSense", "Bean Bag Lounge"]`.
- **Simulation Zone (`SIM-1`)**: Capacity `1`, Min `30m`, Max `2h`, Buffer `15m`, Features `["Force-Feedback Wheel", "Pedals & Cockpit", "PS VR2 Ready"]`.
- **Extensible Specialty Resources (`VR-1`, `STREAM-1`, `BOOTCAMP-1`)**: Supported by the same `rigTypeOf()` + `RESOURCE_RULES` + `multi_booking_items` engine without rewriting booking logic.

## 2. Multi-Resource & Per-Item Duration Pricing Engine (`estBreakdown`)
1. **Itemized Resource Calculation**: Each selected resource in `getEffectiveMultiRigs()` is priced independently using its own station type (`rigTypeOf(rId)`) and its own duration (`getItemDurationHrs(rId)` — supporting `30m`, `1h`, `1.5h`, `2h`, `3h`, `4h`, `6h`, `8h`).
2. **Package & Membership Discounts**: Applies package discount (`BOOKING_PACKAGES`), Happy-Hour free pass minutes (`10am–2pm`), Membership tier discount (`Silver 10%`, `Gold 15%`, `Radiant 20%`), and validated Promo Coupons (`cms_offers`).
3. **Add-Ons & Recurring Multiplier**: Adds selected hardware/creator/cooler add-ons (`BOOKING_ADDONS`) and scales across recurring schedules (`ONCE`, `WEEKLY_2`, `WEEKLY_4`).

## 3. Availability, Buffer Time & Concurrency Protection
- **Buffer Enforcement**: Simulators and VR stations automatically include their configured setup/cleaning buffer (`15m`) when checking overlapping windows.
- **Maintenance Blocking**: Stations marked `MAINTENANCE` in `S.ccboot.pcs` cannot be booked.
- **Atomic Conflict Guard**: Simultaneous booking attempts for the same resource and overlapping window allow only the first confirmation to succeed; the second receives `"<RIG> is no longer available. Please choose another resource or time."`.
- **CCBoot Boundary**: The booking engine owns reservations and check-in codes (`CHK-...`), while CCBoot (`cp.icafecloud.com`) remains strictly separated behind verified Staff/Owner/Developer bridge boundaries.
