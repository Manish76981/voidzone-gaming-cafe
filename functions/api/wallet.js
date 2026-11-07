/**
 * VoidZone Gaming Cafe - Wallet Deposit & Bonus Credit Controller (/functions/api/wallet.js)
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
    const topDate = b.deposit_date || b.topup_date || new Date().toISOString().slice(0, 10);
    const amt = Number(b.deposit_amount ?? b.amount_deposited ?? 0);
    const bonusPct = Number(b.bonus_pct || 0);
    const bonusAmt = Math.round(amt * bonusPct);
    const totalCredited = amt + bonusAmt;
    const phone = String(b.phone || "No Phone").trim();

    await db.prepare(
      "INSERT INTO wallet_topups (deposit_date, customer_name, phone, amount_deposited, payment_method, bonus_pct, bonus_amount, total_credited) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    ).bind(topDate, b.customer_name || "Customer", phone, amt, b.payment_method || "UPI", bonusPct, bonusAmt, totalCredited).run();

    if (/^\d{10}$/.test(phone)) {
      await db.prepare(
        "UPDATE members SET wallet_balance = wallet_balance + ?1, updated_at = datetime('now') WHERE member_phone = ?2"
      ).bind(totalCredited, phone).run();
    }

    return jsonResponse({ ok: true, total_credited: totalCredited }, 201);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}
