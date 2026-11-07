# VOIDZONE Feature Prioritization Matrix & Product Roadmap (`WEBSITE_FEATURE_ROADMAP.md`)

## 1. Prioritization Matrix (P0 – P3)

| ID | Feature / Remediation | Category | Impact | Effort | Risk | Priority | Status in v9.0 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | **Strict Role Isolation (`Developer != Owner`, `Staff != Owner`)** | Security / RBAC | Critical | Low | Low | **P0** | **Implemented & Tested** |
| **F-02** | **Role-Aware VOIDZONE Brand Title Navigation (`Customer->#home`, `Staff->#staff`, `Owner->#owner`, `Developer->#developer`)** | Navigation / UX | Critical | Low | Low | **P0** | **Implemented & Tested** |
| **F-03** | **First/Last Tab Boundary-Safe Swipe Navigation** | Navigation / UX | High | Low | Low | **P0** | **Implemented & Tested** |
| **F-04** | **Backend Hashed Session Verification Across All 10 APIs & Removal of URL PIN Params** | Security / API | Critical | Medium | Low | **P0** | **Implemented & Tested** |
| **F-05** | **Esports, Academy & Creator Studio Hub (`#esports`)** | Business Ecosystem | High | Medium | Low | **P1** | **Implemented & Tested** |
| **F-06** | **Owner Business Intelligence (BI) KPIs (Seat Utilization %, ARPU, Retention, Vertical Revenue)** | Analytics / BI | High | Low | Low | **P1** | **Implemented & Tested** |
| **F-07** | **SEO JSON-LD Structured Data (`SportsActivityLocation`), Open Graph & Skip-Link Accessibility** | SEO / A11y | High | Low | Low | **P1** | **Implemented & Tested** |
| **F-08** | **Database Composite Indexes & Table 19 (`esports_ecosystem`)** | Database / Perf | High | Low | Low | **P1** | **Implemented & Tested** |
| **F-09** | **Automated Razorpay / UPI Webhook Settlement** | Payments | Medium | Medium | Medium | **P2** | Planned (Short-Term) |
| **F-10** | **On-Premise LAN Wake-on-LAN & Smart Switch (`Sonoff`) Agent** | Hardware IoT | Low | High | Medium | **P3** | Planned (Long-Term) |

## 2. Recommended Phased Roadmap
- **Immediate (0–7 Days — Completed in v9.0)**:
  - Enforce strict backend RBAC session verification and block `Developer -> Owner` and `Staff -> Owner` escalation.
  - Deploy Role-Aware VOIDZONE Brand Title Navigation and Boundary-Safe Swipe Navigation.
  - Launch the integrated **Esports, Academy & Creator Studio Hub (`#esports`)** and Owner BI analytics.
- **Short Term (1–4 Weeks)**:
  - Connect live UPI QR dynamic webhook verification for instant automated wallet top-up confirmation.
  - Add automated WhatsApp Cloud API receipt triggers on tournament bracket advancement.
- **Medium Term (1–3 Months)**:
  - Multi-branch leaderboard synchronization between Mazgaon and Charni Road for weekly Valorant/CS2 leagues.
  - Coach portal for scheduling 1-on-1 VOD review sessions in the Esports Academy.
- **Long Term (3–12 Months)**:
  - Optional on-premise CCBoot Hybrid Game Disk server deployment if single-branch PC count expands beyond 30 seats.
