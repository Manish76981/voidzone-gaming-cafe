# VOIDZONE Authentication Architecture (`AUTHENTICATION.md`)

- **Staff / Owner / Developer**: 5-Step CCBoot-First Authentication Gateway (`/api/auth` `action: ccboot_operator_login`), storing only salted `token_hash` in `auth_sessions` with `HttpOnly; Secure; SameSite=Strict` cookies.
- **Customer / Creator / Brand**: Independent Website Account authentication (`members` table) with zero CCBoot bridge interaction.
