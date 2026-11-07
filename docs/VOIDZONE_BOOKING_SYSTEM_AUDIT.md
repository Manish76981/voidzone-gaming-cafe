# VOIDZONE — BOOKING SYSTEM AUDIT (`v16.0`)

## 1. Current-State Repository Inspection & Classification (Section 71)
| Component / Layer | Status | Classification | Action Taken in `v16.0` |
| --- | --- | --- | --- |
| Station Inventory (`RIGS`: 17 PCs, 4 PS5s, 1 Sim) | Inspected | **REFACTOR** | Upgraded into a rule-driven **Bookable Resource Model** (`RESOURCE_RULES` + `booking_resources` D1 table) with capacity, min/max duration, buffer times (`0m` PC, `5m` PS5, `15m` Sim/VR), and feature tags. |
| Sub-Tab `.on` Highlight CSS (`.vz-ios-subtab-bar`) | Bug Found | **REPLACE** | Fixed specificity override where `.vz-ios-subtab-bar.has-liquid-lens button.vz-glass-tab.on` forced `background: transparent`, ensuring all multi-selected Pre-Warm Game & Filter pills visibly light up with glowing orange glass. |
| Multi-Resource Selection (`bk.multiRigs` + `bk.itemDurations`) | Enhanced | **REFACTOR** | Enabled mixing PCs, PS5s, and Simulator in a single booking with independent per-resource durations (`30m` to `8h`) and itemized pricing. |
| Combo Packages & Add-Ons (`BOOKING_PACKAGES`, `BOOKING_ADDONS`) | Missing | **ADD** | Added 7 admin-configurable multi-resource packages (`PC Duo`, `Friends 4-Pack`, `5v5 LAN Pack`, `Console Dual`, `Hybrid Pack`, `Sim + PC`, `Private Group`) and 5 hardware/creator/cooler add-ons. |
| Concurrency & Conflict Protection (`confirmBook` + `/api/bookings`) | Inspected | **REFACTOR** | Added atomic station/buffer collision guard returning `"<RIG> is no longer available. Please choose another resource or time."` on simultaneous booking attempts. |
| Rescheduling, Cancellation, Waitlist & `.ics` Calendar | Missing | **ADD** | Added 1-click Reschedule (`+1h` with conflict & fare-diff check), Cancellation (with automatic Wallet refund for prepaid bookings), Waitlist (`S.bookingWaitlist`), `.ics` export, and Audit Logging (`S.bookingAuditLog`). |
