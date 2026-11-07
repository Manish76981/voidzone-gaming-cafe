/**
 * VoidZone Gaming Cafe - Serverless Edge Authentication Controller (/functions/api/auth.js)
 * Implements HMAC-SHA256 + Client FNV-1a PIN verification, Player Sign-Up/Register, Sign-In, and Session Token issuance.
 * Aligned 100% with schema.sql column definitions and CHECK constraints.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-VZ-Role, X-VZ-Pin",
  "Content-Type": "application/json;charset=UTF-8"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

async function computePinHash(pin, saltHex, pepper = "VOIDZONE_HMAC_PEPPER_v5") {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${saltHex}:${pin}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function computeClientFnvPinHash(pin, salt = "vz_salt_2025") {
  const raw = `${salt}::${String(pin ?? "").trim()}::voidzone_icafe8`;
  let h1 = 0xdeadbeef ^ raw.length;
  let h2 = 0x41c6ce57 ^ raw.length;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return "vz$" + (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function randomHex(bytes = 16) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sanitizeMemberRow(m) {
  if (!m) return null;
  return {
    id: m.id,
    phone: m.member_phone,
    member_phone: m.member_phone,
    member_account: m.member_account,
    name: m.full_name,
    full_name: m.full_name,
    email: m.email || "",
    riot_id: m.riot_id || "",
    tier: m.pass_tier || "none",
    pass_tier: m.pass_tier || "none",
    wallet_inr: Number(m.wallet_balance || 0),
    wallet_balance: Number(m.wallet_balance || 0),
    visits: Number(m.visits || 0),
    total_hours: Number(m.total_hours || 0),
    spins: Number(m.spins_available || 0),
    shards: Number(m.shards_count || 0),
    drops: Number(m.drops_available || 0),
    streak: Number(m.playtime_streak_days || 0),
    kyc_verified: Boolean(m.kyc_verified)
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: false, error: "D1 database binding (DB) not configured." }, 500);

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: "Invalid JSON payload." }, 400);
    }

    const action = String(body.action || "signin").toLowerCase();
    const pepper = env?.HMAC_PEPPER || "VOIDZONE_HMAC_PEPPER_v5";
    const staffPin = String(env?.STAFF_PIN || "1234");
    const ownerPin = String(env?.OWNER_PIN || "9999");

    if (action === "signup" || action === "register") {
      const phone = String(body.phone || body.member_phone || "").replace(/\D/g, "").slice(-10);
      const name = String(body.name || body.full_name || "").trim().slice(0, 40);
      const rawAcct = String(body.member_account || body.username || name.toLowerCase().replace(/[^a-z0-9_]/g, "_")).slice(0, 24);
      const memberAccount = rawAcct.length >= 3 ? rawAcct : `vz_${phone.slice(-6)}`;
      const email = String(body.email || "").trim().slice(0, 80);
      const riotId = String(body.riot_id || body.riotId || "").trim().slice(0, 40);
      const pin = String(body.pin || "0000").trim();

      if (!/^\d{10}$/.test(phone) || !name || !/^\d{4,6}$/.test(pin)) {
        return jsonResponse({ ok: false, error: "Require valid 10-digit phone, name, and 4-6 digit PIN." }, 400);
      }

      const saltHex = randomHex(16);
      const pinHash = await computePinHash(pin, saltHex, pepper);
      const token = randomHex(24);
      const expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
      const memberId = `ICF-${phone.slice(-6)}`;

      await db.prepare(
        `INSERT INTO members (id, member_account, member_phone, full_name, email, riot_id, pin_salt, pin_hash, pass_tier, wallet_balance, spins_available)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'none', 0.0, 1)
         ON CONFLICT(member_phone) DO UPDATE SET
           member_account = excluded.member_account,
           full_name = excluded.full_name,
           email = excluded.email,
           riot_id = excluded.riot_id,
           pin_salt = excluded.pin_salt,
           pin_hash = excluded.pin_hash,
           updated_at = datetime('now')`
      ).bind(memberId, memberAccount, phone, name, email, riotId, saltHex, pinHash).run();

      await db.prepare(
        `INSERT INTO customer_directory (customer_name, phone, membership_tier)
         VALUES (?1, ?2, 'Non-Member')
         ON CONFLICT(customer_name, phone) DO NOTHING`
      ).bind(name, phone).run();

      await db.prepare(
        `INSERT INTO auth_sessions (token, member_id, role, expires_at)
         VALUES (?1, ?2, 'customer', ?3)`
      ).bind(token, memberId, expiresAt).run();

      const member = await db.prepare(
        `SELECT * FROM members WHERE member_phone = ?1`
      ).bind(phone).first();

      return jsonResponse({ ok: true, session_token: token, role: "customer", member: sanitizeMemberRow(member) }, 201);
    }

    if (action === "signin") {
      const identifier = String(body.identifier || body.phone || "").trim();
      const cleanPhone = identifier.replace(/\D/g, "").slice(-10);
      const cleanAcct = identifier.replace(/^@/, "").toLowerCase();
      const pin = String(body.pin || "0000").trim();

      const member = await db.prepare(
        `SELECT * FROM members WHERE member_phone = ?1 OR lower(member_account) = ?2 OR lower(full_name) = ?2 LIMIT 1`
      ).bind(cleanPhone, cleanAcct).first();

      if (!member) {
        return jsonResponse({ ok: false, error: "Account not found." }, 404);
      }

      const computedHmac = await computePinHash(pin, member.pin_salt, pepper);
      const computedFnv = computeClientFnvPinHash(pin, member.pin_salt);
      const isSeedDefault = (member.pin_hash === "0000" || member.pin_hash === "DEMO_PIN_0000") && pin === "0000";
      if (!isSeedDefault && computedHmac !== member.pin_hash && computedFnv !== member.pin_hash && pin !== member.pin_hash) {
        return jsonResponse({ ok: false, error: "Invalid player PIN." }, 401);
      }

      const token = randomHex(24);
      const expiresAt = new Date(Date.now() + 7 * 86400 * 1000).toISOString();
      await db.prepare(
        `INSERT INTO auth_sessions (token, member_id, role, expires_at)
         VALUES (?1, ?2, 'customer', ?3)`
      ).bind(token, member.id || member.member_phone, expiresAt).run();

      return jsonResponse({
        ok: true,
        session_token: token,
        role: "customer",
        member: sanitizeMemberRow(member)
      });
    }

    if (action === "ccboot_operator_login") {
      const cafeId = String(body.cafe_id || "7777").trim().slice(0, 32);
      const operatorId = String(body.ccboot_operator_id || "").trim().toLowerCase().slice(0, 64);
      const password = String(body.ccboot_password || "").trim();

      if (!cafeId || !operatorId || !password) {
        return jsonResponse({ ok: false, step: 1, error: "CCBOOT_CREDENTIALS_REQUIRED: Enter Cafe ID, CCBoot Operator ID, and Password." }, 400);
      }

      // Step 1: Verify CCBoot / iCafeCloud Operator Identity (never exposing ICAFE_API_KEY to browser)
      const opRow = await db.prepare(
        "SELECT * FROM ccboot_operator_links WHERE lower(ccboot_operator_id) = ?1 AND cafe_id = ?2 LIMIT 1"
      ).bind(operatorId, cafeId).first();

      if (!opRow) {
        return jsonResponse({ ok: false, step: 1, error: "CCBOOT_AUTH_FAILED: Invalid CCBoot operator identity or Cafe ID." }, 401);
      }

      const computedHmac = await computePinHash(password, opRow.pass_salt, pepper);
      const passMatch = (password === opRow.pass_hash) || (computedHmac === opRow.pass_hash);
      if (!passMatch) {
        return jsonResponse({ ok: false, step: 1, error: "CCBOOT_AUTH_FAILED: Invalid CCBoot operator password." }, 401);
      }

      // Step 2: Verify Linked VoidZone Application Account & DB-Assigned Role
      if (!opRow.is_linked || !opRow.linked_member_id || opRow.assigned_role === "unlinked") {
        return jsonResponse({
          ok: false,
          step: 2,
          step1_ccboot_verified: true,
          step2_account_linked: false,
          error: "UNLINKED_CCBOOT_IDENTITY: CCBoot login succeeded, but this identity is not linked to an authorized VoidZone application account."
        }, 403);
      }
      if (!opRow.active) {
        return jsonResponse({
          ok: false,
          step: 2,
          step1_ccboot_verified: true,
          error: "ACCOUNT_INACTIVE: Linked VoidZone application account is suspended."
        }, 403);
      }

      const assignedRole = opRow.assigned_role; // Strictly from DB ('staff' | 'owner' | 'developer')
      const permissions = JSON.parse(opRow.permissions_json || "[]");

      // Step 3: Create Secure Application Session (store ONLY token_hash in DB)
      const rawToken = "vzs_" + randomHex(24);
      const tokenHash = await computePinHash(rawToken, "vz_session_token_salt_v8", pepper);
      const expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();

      await db.prepare(
        `INSERT INTO auth_sessions (token, token_hash, member_id, role, ccboot_operator_id, ccboot_cafe_id, ccboot_verified, auth_mode, permissions_json, revoked, expires_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, 'CCBOOT_FIRST_GATEWAY', ?7, 0, ?8)`
      ).bind(tokenHash, tokenHash, opRow.linked_member_id, assignedRole, opRow.ccboot_operator_id, cafeId, opRow.permissions_json, expiresAt).run();

      await db.prepare(
        "INSERT INTO ccboot_sync_log (event_type, operating_mode, endpoint, status_code, latency_ms, summary) VALUES ('CCBOOT_FIRST_LOGIN', 'CCBOOT_INTEGRATION', '/api/auth', 200, 0, ?1)"
      ).bind(`Authenticated CCBoot operator ${opRow.ccboot_operator_id} -> Linked account ${opRow.linked_member_id} (role=${assignedRole})`).run();

      const destView = assignedRole === "developer" ? "developer" : assignedRole === "owner" ? "owner" : "staff";
      const headers = new Headers(CORS_HEADERS);
      headers.set("Set-Cookie", `vz_session=${rawToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`);

      return new Response(JSON.stringify({
        ok: true,
        step1_ccboot_verified: true,
        step2_account_linked: true,
        step3_session_created: true,
        step4_destination_view: destView,
        step5_bridge_activated: true,
        session_token: rawToken,
        token_hash: tokenHash,
        role: assignedRole,
        linked_member_id: opRow.linked_member_id,
        ccboot_operator_id: opRow.ccboot_operator_id,
        cafe_id: cafeId,
        permissions
      }), { status: 200, headers });
    }

    if (action === "logout") {
      const rawToken = String(body.session_token || "").trim();
      const tokenHash = rawToken ? await computePinHash(rawToken, "vz_session_token_salt_v8", pepper) : "";
      if (tokenHash || rawToken) {
        await db.prepare(
          "UPDATE auth_sessions SET revoked = 1 WHERE token_hash = ?1 OR token = ?2"
        ).bind(tokenHash, rawToken).run();
      }
      const remainingRow = await db.prepare(
        "SELECT COUNT(*) AS cnt FROM auth_sessions WHERE ccboot_verified = 1 AND revoked = 0"
      ).first();
      const remainingAdminSessions = Number(remainingRow?.cnt || 0);
      const headers = new Headers(CORS_HEADERS);
      headers.set("Set-Cookie", "vz_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
      return new Response(JSON.stringify({
        ok: true,
        revoked: true,
        shared_bridge_preserved: remainingAdminSessions > 0,
        remaining_admin_sessions: remainingAdminSessions
      }), { status: 200, headers });
    }

    if (action === "staff_unlock") {
      const pin = String(body.pin || "").trim();
      if (pin !== staffPin && pin !== ownerPin) {
        return jsonResponse({ ok: false, error: "Invalid Staff/Owner security PIN." }, 403);
      }
      const role = pin === ownerPin ? "owner" : "staff";
      const token = randomHex(24);
      const expiresAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
      await db.prepare(
        `INSERT INTO auth_sessions (token, member_id, role, expires_at)
         VALUES (?1, ?2, ?3, ?4)`
      ).bind(token, role === "owner" ? "OWNER_9999" : "STAFF_1234", role, expiresAt).run();
      return jsonResponse({ ok: true, session_token: token, role });
    }

    return jsonResponse({ ok: false, error: "Unsupported auth action." }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, error: err?.message || "Internal server error" }, 500);
  }
}
