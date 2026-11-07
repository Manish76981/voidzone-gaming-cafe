/**
 * VoidZone Gaming Cafe - Physical Till & Denomination Audit Controller (/functions/api/cash-drawer.js)
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

function verifyOwnerPin(request, env) {
  const url = new URL(request.url);
  const pin = request.headers.get("X-VZ-Pin") || "";
  const ownerPin = String(env?.OWNER_PIN || "9999");
  return pin === ownerPin;
}

function verifyStaffOrOwnerPin(request, env) {
  const url = new URL(request.url);
  const pin = request.headers.get("X-VZ-Pin") || "";
  const staffPin = String(env?.STAFF_PIN || "1234");
  const ownerPin = String(env?.OWNER_PIN || "9999");
  return pin === staffPin || pin === ownerPin;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    if (!verifyOwnerPin(request, env)) {
      return jsonResponse({ ok: false, error: "RBAC_FORBIDDEN: Owner PIN 9999 required for Till Audit Ledger" }, 403);
    }
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: true, mode: "client-local", snapshots: [] });

    const rows = await db.prepare("SELECT * FROM cash_drawer_ledger ORDER BY snapshot_ts DESC").all();
    return jsonResponse({ ok: true, snapshots: rows.results || [] });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (!verifyStaffOrOwnerPin(request, env)) {
      return jsonResponse({ ok: false, error: "RBAC_FORBIDDEN: Staff or Owner PIN required" }, 403);
    }
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: true, mode: "client-local" });

    const b = await request.json();
    const nowD = new Date().toISOString();
    const ts = b.ts || nowD.replace("T", " ").slice(0, 19);
    const id = b.id || `TILL-${nowD.slice(0, 10).replace(/-/g, "")}-01`;

    await db.prepare(
      "INSERT OR REPLACE INTO cash_drawer_ledger (id, snapshot_ts, staff_id, opening_float, cash_received, cash_payouts, physical_cash, expected_cash, discrepancy, notes_json, notes_remark) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)"
    ).bind(
      id, ts, b.staff || "STAFF_1234", Number(b.openingFloat || 2000), Number(b.cashReceived || 0),
      Number(b.cashPayouts || 0), Number(b.physicalCash || 0), Number(b.expectedCash || 0),
      Number(b.variance || 0), JSON.stringify(b.notes || {}), b.remark || ""
    ).run();

    return jsonResponse({ ok: true, id }, 201);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}
