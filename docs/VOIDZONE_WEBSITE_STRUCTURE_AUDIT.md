# VOIDZONE — Complete Website Structure & Information Architecture Audit (`Sections 2–5`)

## 1. Complete Route & Page Inventory (`Section 2`)

| Route | Purpose | User Type | Primary Action | Secondary Actions | Main Content | Current Problems Identified | Implemented Refinement (`v14.0`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `#home` | Calm entrance & live arena status | Visitor / Customer | `Book a Station →` | Explore Community, Cooler Menu, Membership, Claim Marathon Pack | Hero status, 4-zone open rate strip, Ecosystem highlights, Locations & Marathon rows | Pre-`v14.0` homepage rendered 10 cards (`111 KB`) duplicating the Fare Calculator, 22-station map, Membership table, and a `95 KB` base64 image. | **SIMPLIFIED**: Reduced `home()` from `111 KB` to `5.5 KB` (4 open architectural sections; zero duplicate calculators/maps). |
| `#book` | Station reservation & fare calculation | Customer | Confirm Booking (Wallet / Desk) | Switch Branch, Select Station Type, Pre-Warm Game, Pick Rig | Start/End Time Pods, 22-Station Floor Map, Fare Estimate | Branch & Rig selectors previously used heavy solid orange blocks. | **REFINED**: Frosted-glass tab selectors + clean time pods and single-click rig grid. |
| `#community` | Unified Community, Social, Creator, Collab & Esports Hub | Player / Creator / Brand | Participate in Feed, Tournaments & Collabs | Create Post, Register Squad, Discover Players, Vote on Ideas | Unified 5-pillar sub-bar (`Community`, `Social`, `Creators`, `Collab`, `Esports`) + active module | Previously split across 5 separate top-level tabs that crowded the main navigation bar. | **MERGED IN NAV**: Combined `Social`, `Creators`, `Collab`, and `Esports` inside `Community` via `.vz-community-unified-bar`. |
| `#social` | Lazy-loaded gaming reels, shorts & streams | Player / Creator | Watch / Load Official Embed | Filter by Platform, Submit Canonical Clip Link | Platform filter bar, canonical social feed cards | 4-column grid was cramped on smaller screens. | **SIMPLIFIED**: Responsive auto-fit grid (`minmax(265px, 1fr)`) inside the unified Community hub. |
| `#creators` | Creator directory, digital media kits & services | Creator / Brand | Create / View Creator Media Kit | Filter Directory, Book Creator Service, Staff Verify | Creator cards with provenance badges (`Verified` vs `Creator Submitted`), profile editor | Verbose sub-tab labels previously clipped at 140px. | **SIMPLIFIED**: Concise unclipped sub-tabs (`Creator Directory`, `Creator Studio Profile`, `Media Kit & Metrics`, `Creator Services`). |
| `#collaborate` | Influencer collabs, B2B brand campaigns & sponsorships | Creator / Brand / Campus | Apply to Campaign / Post Opportunity | Run 9-Criteria Match, Browse 18 Sponsorship Assets, Advance Deliverable | Campaign brief cards, rule-based compatibility scorer, 6-stage deliverable tracker | High card density across 7 sub-tabs. | **SIMPLIFIED**: Clean sub-panel rows (`rgba(255,255,255,0.022)`) with restrained borders. |
| `#cafe` | Desk-safe grab-and-go cooler & snack bar | Customer | Submit Cooler Order (At-Seat / Counter) | Filter Category, Ring At-Seat Service Bell | Category tab bar, menu grid, tray summary | Duplicate `LOUNGE & MENU` banner previously appeared above the card. | **SIMPLIFIED**: Direct category bar + clean tray checkout. |
| `#esports` | Weekly LAN brackets, coaching academy & 4K60 studio | Player / Creator | Register Squad / Book Coaching or Studio | View Bracket Prize Pool, Choose Coach Track | 3 structured sections (`Tournaments`, `Academy`, `Creator Studio`) | Previously a separate top-level tab competing with Community. | **GROUPED**: Accessible directly via `#esports` and unified under the `Community` pillar switcher. |
| `#rewards` | Loyalty tiers, spin wheel & Valorant skin drops | Customer | Spin Cyber Wheel / Open Drop | Buy Monthly Tier Pass (`Silver`, `Gold`, `Radiant`), Lookup Wallet | Tier comparison table, canvas spin wheel, monthly drop pool | Duplicated on the old homepage. | **KEPT CANONICAL**: Dedicated home for membership tiers and reward drops. |
| `#staff` | 13-sheet operational floor desk & cash counter | Staff / Owner (CCBoot-First) | Start / Checkout Station & Commit Master Log | Cash Denomination Till, Desk Booking, Inventory, CCBoot Bridge | 11 operational sub-tabs | Heavy button borders on sub-navigation. | **SIMPLIFIED**: Clean `.vz-ios-subtab-bar` navigation and high-contrast data tables. |
| `#owner` | Executive P&L, OpEx & reward pool governance | Owner Only (CCBoot-First) | Audit Net Profit & Export 13-Sheet CSV/XLSX | Adjust OpEx, Configure Reward Cap % | Revenue breakdown, OpEx controls, economy bounds | None (protected executive view). | **KEPT & VERIFIED**: Preserved strict Owner RBAC isolation. |
| `#developer` | No-code edge CMS & CCBoot infrastructure control | Developer Only (CCBoot-First) | Publish Draft / Rollback Release Version | Edit Branding, Theme, Pricing, Offers, PC Infra Mode A/B | 11 CMS sub-tabs with live diff counter | None (protected CMS view). | **KEPT & VERIFIED**: Preserved Mode A/B CCBoot safety and version rollback. |

## 2. Information Architecture Hierarchy (`Section 3`)
```text
VOIDZONE (Header: Brand Mark + Auth/Profile Control)
└── 1-Step-Down Frosted-Glass Navigation Dock
    ├── 1. HOME (#home)
    │   ├── Live Telemetry Hero + Primary "Book a Station" CTA
    │   ├── 4-Zone Open Hardware & Rate Strip (PC · PS5 · Racing Sim · VR)
    │   ├── Connected Ecosystem Highlights (Tournament · Creator · Campaign · Challenge)
    │   └── Mumbai Locations & Marathon Bulk Hour Packs
    ├── 2. BOOK (#book)
    │   ├── Branch Selector (Mazgaon Flagship · Charni Road)
    │   ├── Station Category & Time Window Pods
    │   ├── Pre-Warm Game & 22-Station Interactive Floor Map
    │   └── Instant Fare Split Estimate & Wallet/Desk Confirmation
    ├── 3. COMMUNITY (#community — Unified Ecosystem Pillar)
    │   ├── 🌐 Community Hub (Feed · Tournaments · Teams · Players · Challenges · Ideas)
    │   ├── ▶️ Social Feed (Instagram Reels · YouTube Shorts/Videos · Kick · Twitch)
    │   ├── ⭐ Creators & Media Kits (Directory · Studio Profile · Media Kits · Services)
    │   ├── 🤝 Collab & Campaigns (Find Collab · Brand Campaigns · 9-Criteria Matching · Sponsorships · Campus)
    │   └── 🏆 Esports & Academy (Weekly LAN Brackets · Coaching Academy · 4K60 Studio)
    ├── 4. COOLER (#cafe)
    │   ├── Grab-and-Go Cooler Categories & At-Seat Service Bell
    │   └── Tray Checkout (Wallet / Cash / UPI)
    ├── 5. REWARDS (#rewards)
    │   ├── Membership Tiers (Silver · Gold · Radiant)
    │   └── Dynamic Cyber Wheel & Monthly Valorant Drop Pool
    └── [Role-Gated Admin Pillars — CCBoot-First Authenticated Only]
        ├── STAFF (#staff — 13-Sheet Floor Desk & Cash Counter)
        ├── OWNER (#owner — Executive P&L & Economy Bounds)
        └── DEVELOPER (#developer — Edge CMS & Mode A/B CCBoot Control)
```
