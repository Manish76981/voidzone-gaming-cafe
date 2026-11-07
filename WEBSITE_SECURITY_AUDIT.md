# VOIDZONE Cybersecurity, Authentication & RBAC Audit (`WEBSITE_SECURITY_AUDIT.md`)

## 1. Threat Model & Audit Scope
Audited under the assumption that an attacker can inspect/modify browser JavaScript, mutate `localStorage` and cookies, forge HTTP headers, manipulate entity IDs (IDOR), and call `/api/*` endpoints directly.

## 2. Identified Security Vulnerabilities & Remediations Implemented in v9.0

| ID | Severity | Vulnerability Found in v8.0 Audit | Remediation Implemented & Verified in v9.0 | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Critical (P0)** | **Developer -> Owner Privilege Escalation**: `authenticateCcbootFirst()` set `staffRole = "owner"` for `developer` accounts, and `hasValidAdminSession("owner")` allowed `role === "developer"`, permitting a Developer to access Owner P&L, OpEx, and Cash Drawer ledgers | Enforced strict role isolation: `hasValidAdminSession("owner")` requires `role === "owner"` exclusively; `developer` is isolated to `#developer` (`Developer CMS`) and blocked from `#owner` and `/api/owner` | **Fixed & Tested** |
| **SEC-02** | **Critical (P0)** | **URL Query Parameter PIN Exposure**: `owner.js`, `cash-drawer.js`, `master-log.js`, `inventory.js`, `wallet.js`, `cms.js`, and `ccboot.js` accepted `?pin=` or `?dev_key=` in URL query strings | Removed all URL query-string secret/PIN parameters across all backend APIs; credentials/tokens are accepted only via `HttpOnly` cookie (`vz_session`), `Authorization: Bearer`, or `X-VZ-*` headers | **Fixed & Tested** |
| **SEC-03** | **High (P0)** | **Backend Session Token Hash Verification**: Resource APIs (`owner.js`, `cms.js`, `ccboot.js`, `cash-drawer.js`, `master-log.js`, `inventory.js`, `wallet.js`) checked static headers without verifying `auth_sessions.token_hash` in D1 | Added `verifySessionRole(request, env, allowedRoles)` helper checking `auth_sessions` (`token_hash`, `ccboot_verified = 1`, `revoked = 0`, `expires_at > datetime('now')`, and strict `role IN allowedRoles`) | **Fixed & Tested** |
| **SEC-04** | **Medium (P1)** | **Raw Exception Message Exposure**: API `catch (err)` blocks returned `err.message` directly to clients | Replaced raw database/runtime error strings with sanitized error codes (`INTERNAL_SERVER_ERROR`) | **Fixed & Tested** |
| **SEC-05** | **Medium (P1)** | **Booking GET PII Masking**: `GET /api/bookings` returned `customer_name` and `phone` if queried by date | Masked `customer_name` (`"Reserved"`) and `phone` (`""`) on public `GET /api/bookings` unless authenticated as Staff/Owner or matching the caller's own phone | **Fixed & Tested** |

## 3. Escalation Path Verification Matrix
| Escalation Vector | Test Mechanism | Result |
| :--- | :--- | :--- |
| **Customer -> Staff** | Sign in as Customer (`9820011223`), navigate to `#staff` or call Staff APIs | **Blocked (`403` / Redirected to CCBoot Gateway)** |
| **Staff -> Owner** | Authenticate via CCBoot as Staff (`ccboot_staff_mazgaon`), navigate to `#owner` or attempt OpEx/P&L access | **Blocked (`hasValidAdminSession("owner") === false`)** |
| **Developer -> Owner** | Authenticate via CCBoot as Developer (`ccboot_dev_arch`), navigate to `#owner` or `/api/owner` | **Blocked (`hasValidAdminSession("owner") === false`, isolated to `#developer`)** |
| **Membership Upgrade -> Admin** | Upgrade customer pass to `Radiant` (`tier_3`) and check admin permissions | **Blocked (Membership tiers grant play/food discounts only, zero RBAC roles)** |
| **Unlinked CCBoot Identity -> Staff** | Authenticate with valid CCBoot credentials (`ccboot_unlinked_op`) not linked in `ccboot_operator_links` | **Blocked at Step 2 (`403 UNLINKED_CCBOOT_IDENTITY`)** |
