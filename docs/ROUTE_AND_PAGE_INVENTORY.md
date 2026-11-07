# VOIDZONE — Route & Page Inventory (Phases 2 & 3)

## 1. Canonical Route Hierarchy & Information Architecture Decisions

| Route (`#hash`) | Primary View Function | Access / RBAC | IA Action (`KEEP` / `MERGE` / `REFINE`) | Sub-Navigation / Modules |
| :--- | :--- | :--- | :--- | :--- |
| `#home` | `home()` | Public / Customer Default | **KEEP & REFINE** | Hero Card, Compact Dismissible Promo Pill, 4 Rig Zone Cards, Connected Ecosystem Pulse, Instant Fare Calculator |
| `#book` | `book()` | Public / Customer | **KEEP & REFINE** | Branch Selector (Mazgaon / Charni Rd), Rig Category Selector, Start/End Time Pods, Interactive 22-Rig Floor Map, Wallet/Desk Checkout |
| `#community` | `community()` | Public Read / Auth Write | **KEEP & REFINE** | `Community Home`, `Feed & Posts`, `Tournaments & Events`, `Teams & Squads`, `Player Discovery`, `Challenges & Ranks`, `Ideas & Suggestions` |
| `#social` | `social()` | Public Read / Auth Submit | **KEEP & REFINE** | `All Feeds`, `Instagram Reel`, `YouTube Short`, `YouTube Video`, `Kick Stream`, `Twitch Stream` (Click-to-Load Lazy Embeds) |
| `#creators` | `creators()` | Public Read / Opt-in Creator | **KEEP & REFINE** | `Creator Directory`, `Creator Studio Profile`, `Media Kit & Metrics`, `Creator Services` |
| `#collaborate` | `collaborate()` | Public Read / Creator & Brand | **KEEP & REFINE** | `Find a Collab`, `Brand Campaigns`, `Influencer Collabs`, `Creator ↔ Brand Matching`, `Sponsorships`, `Campus & Ambassadors`, `My Collaborations` |
| `#cafe` | `cafe()` | Public / Customer | **KEEP & REFINE** | `All Cooler Items`, `Gamer Combos`, `Cold Drinks`, `Energy Drinks`, `Chocolates`, `Protein Bars & Snacks`, `Digital Game Pins`, At-Seat Service Bell |
| `#esports` | `esports()` | Public / Customer | **KEEP & REFINE** | Weekly LAN Tournament Brackets, Structured Esports Coaching Academy, 4K60 Dual-PC Creator Streaming Studio |
| `#rewards` | `rewards()` | Public / Customer | **KEEP & REFINE** | Loyalty Tier Pass (`Silver`, `Gold`, `Radiant`), Dynamic Spin Wheel, Monthly Valorant Skin Drop Pool |
| `#staff` | `staff()` | **CCBoot-First `staff` / `owner`** | **KEEP (Protected)** | 11 Operational Sub-Tabs (`Master Log`, `Desk Booking`, `Live Trackers`, `Cash Counter`, `Inventory`, `Customers`, `Daily Stats`, `Monthly P&L`, `Pricing Logic`, `Floor History`, `CCBoot Bridge`) |
| `#owner` | `owner()` | **CCBoot-First `owner` Only** | **KEEP (Protected)** | Executive Revenue, OpEx, Net Profit, Dynamic Reward Pool Cap, 13-Sheet Excel Export |
| `#developer` | `developer()` | **CCBoot-First `developer` Only** | **KEEP (Protected)** | 11 CMS Sub-Tabs (`Overview`, `Branding`, `Theme`, `Pricing`, `Offers`, `Media`, `Pages`, `Navigation`, `CCBoot`, `Publish`, `Security`) |

## 2. Route Preservation Guarantee
No existing route hashes (`#home` through `#developer`) were deleted or renamed, preserving 100% compatibility with bookmarks, browser history (`back`/`forward`), and automated tests.
