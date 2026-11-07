/**
 * VoidZone Gaming Cafe - Snack Log & Inventory Controller (/functions/api/inventory.js)
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

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (!verifyStaffOrOwnerPin(request, env)) {
      return jsonResponse({ ok: false, error: "RBAC_FORBIDDEN: Staff or Owner PIN required" }, 403);
    }
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: true, mode: "client-local" });

    const b = await request.json();
    const dateStr = b.sale_date || b.session_date || new Date().toISOString().slice(0, 10);
    await db.prepare(
      "INSERT INTO snack_log (tx_id, sale_date, snack_name, qty, unit_price, total_cost) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    ).bind(b.txId || "WALKIN", dateStr, b.name, Number(b.qty || 1), Number(b.unitPrice || 0), Number(b.totalCost || 0)).run();

    await db.prepare(
      "UPDATE inventory SET total_sold = total_sold + ?1, current_stock = MAX(0, current_stock - ?1) WHERE item_name = ?2"
    ).bind(Number(b.qty || 1), b.name).run();

    return jsonResponse({ ok: true }, 201);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}
