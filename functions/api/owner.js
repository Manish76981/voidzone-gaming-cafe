/**
 * VoidZone Gaming Cafe - Owner Executive P&L & OpEx Controller (/functions/api/owner.js)
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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    if (!verifyOwnerPin(request, env)) {
      return jsonResponse({ ok: false, error: "RBAC_FORBIDDEN: Owner PIN 9999 required" }, 403);
    }
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: true, role: "owner", mode: "client-local" });

    const [masterLog, snackLog, inventory, walletTopups, opexLedger, customers, stations, tillSnapshots] = await Promise.all([
      db.prepare("SELECT * FROM master_log ORDER BY session_date DESC, tx_id DESC").all(),
      db.prepare("SELECT * FROM snack_log ORDER BY sale_date DESC, id DESC").all(),
      db.prepare("SELECT * FROM inventory ORDER BY item_name ASC").all(),
      db.prepare("SELECT * FROM wallet_topups ORDER BY deposit_date DESC, id DESC").all(),
      db.prepare("SELECT * FROM opex_ledger ORDER BY expense_date DESC, id DESC").all(),
      db.prepare("SELECT * FROM customer_directory ORDER BY id ASC").all(),
      db.prepare("SELECT * FROM stations ORDER BY id ASC").all(),
      db.prepare("SELECT * FROM cash_drawer_ledger ORDER BY snapshot_ts DESC").all()
    ]);

    return jsonResponse({
      ok: true,
      role: "owner",
      sheets: {
        master_log: masterLog.results || [],
        snack_log: snackLog.results || [],
        inventory: inventory.results || [],
        wallet_topups: walletTopups.results || [],
        opex_ledger: opexLedger.results || [],
        customer_directory: customers.results || [],
        stations: stations.results || [],
        cash_drawer_ledger: tillSnapshots.results || []
      }
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (!verifyOwnerPin(request, env)) {
      return jsonResponse({ ok: false, error: "RBAC_FORBIDDEN: Owner PIN 9999 required" }, 403);
    }
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: true, role: "owner", mode: "client-local" });

    const b = await request.json();
    const expDate = b.expense_date || b.date || new Date().toISOString().slice(0, 10);
    const expCat = String(b.category || b.expense_category || "Electricity").slice(0, 40);
    const expDesc = String(b.description || b.desc || "Operating Expense").slice(0, 120);
    const expAmt = Math.max(0, Number(b.amount_inr ?? b.amount ?? 0));

    await db.prepare(
      "INSERT INTO opex_ledger (expense_date, expense_category, description, amount) VALUES (?1, ?2, ?3, ?4)"
    ).bind(expDate, expCat, expDesc, expAmt).run();

    return jsonResponse({ ok: true, expense_date: expDate, category: expCat, amount: expAmt }, 201);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}
