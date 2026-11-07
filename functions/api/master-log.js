/**
 * VoidZone Gaming Cafe - Master Log Controller (/functions/api/master-log.js)
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
    const walletAmt = Number(b.wallet || 0);
    if (walletAmt > 0 && b.phone && b.phone !== "No Phone") {
      await db.prepare(
        "UPDATE members SET wallet_balance = MAX(0, wallet_balance - ?1), updated_at = datetime('now') WHERE member_phone = ?2"
      ).bind(walletAmt, String(b.phone).slice(-10)).run();
    }

    await db.prepare(
      "INSERT OR REPLACE INTO master_log (tx_id, session_date, customer_name, phone, time_in, time_out, total_hr, console_id, category, controllers, game_charges, snacks, total_bill, cash, upi, wallet, total_received, balance_due, cash_given, change_to_return, wallet_status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)"
    ).bind(
      b.txId, b.date, b.customer, b.phone || "No Phone", b.timeIn || "", b.timeOut || "", Number(b.totalHr || 0),
      b.console || "PC-1", b.category || "Standard", Number(b.controllers || 0), Number(b.gameCharges || 0),
      Number(b.snacks || 0), Number(b.totalBill || 0), Number(b.cash || 0), Number(b.upi || 0), walletAmt,
      Number(b.totalReceived || 0), Number(b.balanceDue || 0), Number(b.cashGiven || 0), Number(b.changeToReturn || 0), b.status || "✅ Paid"
    ).run();

    return jsonResponse({ ok: true, tx_id: b.txId }, 201);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}
