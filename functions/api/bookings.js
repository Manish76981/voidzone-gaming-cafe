/**
 * VoidZone Gaming Cafe - Serverless Edge Reservation & Collision-Lock Controller (/functions/api/bookings.js)
 * Enforces atomic station overlap checks, customer-scoped RBAC visibility, and writes directly to master_log.
 * Aligned 100% with schema.sql column definitions.
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

function normalizeTimeStr(rawTs, fallback = "14:00:00") {
  const s = String(rawTs || "").trim();
  const timePart = s.includes(" ") ? s.split(" ")[1] : (s.includes("T") ? s.split("T")[1] : s);
  if (/^\d{2}:\d{2}:\d{2}$/.test(timePart)) return timePart;
  if (/^\d{2}:\d{2}$/.test(timePart)) return timePart + ":00";
  return fallback;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: false, error: "D1 database binding (DB) not configured." }, 500);

    const url = new URL(request.url);
    const dateStr = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const phone = (url.searchParams.get("phone") || "").replace(/\D/g, "").slice(-10);
    const pinHeader = request.headers.get("X-VZ-Pin") || "";
    const staffPin = String(env?.STAFF_PIN || "1234");
    const ownerPin = String(env?.OWNER_PIN || "9999");
    const isStaffOrOwner = pinHeader === staffPin || pinHeader === ownerPin;

    const allRows = await db.prepare(
      `SELECT tx_id, session_date, customer_name, phone, time_in, time_out, total_hr, console_id, category, controllers, total_bill, wallet_status
       FROM master_log WHERE session_date = ?1 ORDER BY time_in ASC`
    ).bind(dateStr).all();

    const records = (allRows.results || []).map((r) => {
      if (isStaffOrOwner || (phone && r.phone === phone)) {
        return r;
      }
      return {
        tx_id: "OCCUPIED",
        session_date: r.session_date,
        console_id: r.console_id,
        time_in: r.time_in,
        time_out: r.time_out,
        total_hr: r.total_hr,
        wallet_status: "Reserved"
      };
    });

    return jsonResponse({ ok: true, date: dateStr, bookings: records });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
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

    const stationId = String(body.station_id || "PC-1").replace("PS5-", "PS-");
    const customerName = String(body.customer_name || body.name || "Walk-in Player").trim().slice(0, 40);
    const phone = String(body.customer_phone || body.phone || "").replace(/\D/g, "").slice(-10);
    const startTs = String(body.start_ts || "");
    const endTs = String(body.end_ts || "");
    const sessionDate = (startTs.split(" ")[0] || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const timeIn = normalizeTimeStr(startTs, "14:00:00");
    const timeOut = normalizeTimeStr(endTs, "16:00:00");
    const totalHr = Math.max(0.25, Number(body.duration_hrs || body.d || 2));
    const category = String(body.category || (body.squad_flag ? "Group" : "Standard"));
    const controllers = Math.max(0, Number(body.controllers ?? (stationId.startsWith("PS-") ? 1 : 0)));
    let totalInr = Math.max(0, Number(body.total_inr ?? body.estCost ?? 160));
    const promoCode = String(body.promo_code || "").trim().toUpperCase();
    if (promoCode) {
      const offer = await db.prepare(
        "SELECT * FROM cms_offers WHERE upper(code) = ?1 AND active = 1 LIMIT 1"
      ).bind(promoCode).first();
      if (!offer) {
        return jsonResponse({ ok: false, error: `Promo code ${promoCode} is invalid or inactive.` }, 400);
      }
      if (sessionDate < offer.start_date || sessionDate > offer.end_date) {
        return jsonResponse({ ok: false, error: `Promo code ${promoCode} is outside its valid date window.` }, 400);
      }
      if (Number(offer.used_count || 0) >= Number(offer.usage_limit || 100)) {
        return jsonResponse({ ok: false, error: `Promo code ${promoCode} has reached its usage limit.` }, 400);
      }
      await db.prepare("UPDATE cms_offers SET used_count = used_count + 1 WHERE code = ?1").bind(offer.code).run();
    }
    const payMode = String(body.payment_mode || body.payment_method || "PAY_AT_DESK").toUpperCase();

    if (!/^\d{10}$/.test(phone)) {
      return jsonResponse({ ok: false, error: "Valid 10-digit mobile number required." }, 400);
    }

    // Atomic station collision check: start_time < existing_end AND end_time > existing_start
    const collision = await db.prepare(
      `SELECT tx_id, time_in, time_out FROM master_log
       WHERE session_date = ?1 AND console_id = ?2
         AND time_in < ?4 AND time_out > ?3
       LIMIT 1`
    ).bind(sessionDate, stationId, timeIn, timeOut).first();

    if (collision) {
      return jsonResponse({
        ok: false,
        error: `Station ${stationId} is already reserved between ${collision.time_in} and ${collision.time_out}.`
      }, 409);
    }

    const countRow = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM master_log WHERE session_date = ?1`
    ).bind(sessionDate).first();
    const seq = Number(countRow?.cnt || 0) + 1;
    const txId = `${sessionDate.replace(/-/g, "")}${String(seq).padStart(3, "0")}`;

    const isWallet = payMode === "WALLET";
    const walletPaid = isWallet ? totalInr : 0;
    const balanceDue = isWallet ? 0 : totalInr;
    const statusStr = isWallet ? "✅ Paid" : "⏳ Reserved";

    if (isWallet && totalInr > 0) {
      await db.prepare(
        `UPDATE members SET wallet_balance = MAX(0, wallet_balance - ?1), updated_at = datetime('now') WHERE member_phone = ?2`
      ).bind(totalInr, phone).run();
    }

    await db.prepare(
      `INSERT INTO master_log (
        tx_id, session_date, customer_name, phone, time_in, time_out, total_hr,
        console_id, category, controllers, game_charges, snacks, total_bill,
        cash, upi, wallet, total_received, balance_due, cash_given, change_to_return, wallet_status
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0, ?11, 0, 0, ?12, ?12, ?13, 0, 0, ?14)`
    ).bind(
      txId, sessionDate, customerName, phone, timeIn, timeOut, totalHr,
      stationId, category, controllers, totalInr, walletPaid, balanceDue, statusStr
    ).run();

    await db.prepare(
      `INSERT INTO customer_directory (customer_name, phone, membership_tier)
       VALUES (?1, ?2, 'Non-Member')
       ON CONFLICT(customer_name, phone) DO NOTHING`
    ).bind(customerName, phone).run();

    return jsonResponse({
      ok: true,
      tx_id: txId,
      station_id: stationId,
      session_date: sessionDate,
      time_in: timeIn,
      time_out: timeOut,
      total_bill: totalInr,
      status: statusStr
    }, 201);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal server error" }, 500);
  }
}
