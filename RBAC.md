# VOIDZONE Role-Based Access Control & Permission Matrix (`RBAC.md`)

- **Administrative Roles (CCBoot-First Authenticated)**: `staff` (`#staff`), `owner` (`#owner`), `developer` (`#developer`).
- **Ecosystem Capabilities (Non-Admin)**: Customer, Creator, Brand Representative, Campus/Community Ambassador.
- **Enforced Permissions**: `community.*`, `creator.*`, `social.*`, `collaboration.*`, `brand.*`, `campaign.*`, `sponsorship.*`, `ambassador.*`, `campus.*`, `moderation.*`.
- **Non-Negotiable Invariant**: Creator, Influencer, Brand, and Ambassador capabilities never grant Staff, Owner, or Developer administrative privileges.
