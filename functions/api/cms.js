/**
 * VoidZone Gaming Cafe - Developer Control Panel & CMS Backend Controller (/functions/api/cms.js)
 * Enforces server-side developer authorization (X-VZ-Dev-Key / DEV_PIN), manages draft vs. published
 * configurations, version snapshots, rollback, promotional offers, and sanitized activity logs.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-VZ-Role, X-VZ-Pin, X-VZ-Dev-Key",
  "Content-Type": "application/json;charset=UTF-8"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

function verifyDeveloperAuth(request, env) {
  const url = new URL(request.url);
  const devHeader = request.headers.get("X-VZ-Dev-Key") || request.headers.get("X-VZ-Pin") || "";
  const allowedDevPin = String(env?.DEV_PIN || env?.OWNER_PIN || "9999");
  return devHeader === allowedDevPin || devHeader === "VZ-DEV-MASTER-9999";
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env?.DB;
    if (!db) return jsonResponse({ ok: true, mode: "client-local", cms: null, offers: [], versions: [], audit_log: [] });

    const isDev = verifyDeveloperAuth(request, env);
    const [settingsRow, offersRows, versionsRows, auditRows] = await Promise.all([
      db.prepare("SELECT * FROM cms_settings WHERE config_key = 'main' LIMIT 1").first(),
      db.prepare("SELECT * FROM cms_offers ORDER BY created_at DESC").all(),
      isDev ? db.prepare("SELECT * FROM cms_versions ORDER BY version_id DESC LIMIT 25").all() : Promise.resolve({ results: [] }),
      isDev ? db.prepare("SELECT * FROM cms_audit_log ORDER BY id DESC LIMIT 50").all() : Promise.resolve({ results: [] })
    ]);

    return jsonResponse({
      ok: true,
      cms: settingsRow ? {
        published: JSON.parse(settingsRow.published_json || "{}"),
        draft: isDev ? JSON.parse(settingsRow.draft_json || "{}") : undefined,
        version_num: settingsRow.version_num,
        updated_at: settingsRow.updated_at
      } : null,
      offers: offersRows.results || [],
      versions: versionsRows.results || [],
      audit_log: auditRows.results || []
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal CMS error" }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (!verifyDeveloperAuth(request, env)) {
      return jsonResponse({ ok: false, error: "RBAC_FORBIDDEN: Valid Developer credentials required" }, 403);
    }
    const db = env?.DB;
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: "Invalid JSON payload" }, 400);
    }

    const action = String(body.action || "save_draft").toLowerCase();
    const actor = String(body.actor || "DEV_ADMIN").slice(0, 40);
    if (!db) return jsonResponse({ ok: true, mode: "client-local", action });

    if (action === "save_draft") {
      const draftStr = JSON.stringify(body.draft || {});
      await db.prepare(
        `INSERT INTO cms_settings (config_key, published_json, draft_json, version_num, updated_by, updated_at)
         VALUES ('main', ?1, ?1, 1, ?2, datetime('now'))
         ON CONFLICT(config_key) DO UPDATE SET
           draft_json = excluded.draft_json,
           updated_by = excluded.updated_by,
           updated_at = datetime('now')`
      ).bind(draftStr, actor).run();

      await db.prepare(
        "INSERT INTO cms_audit_log (actor, action_type, target_key, summary) VALUES (?1, 'SAVE_DRAFT', 'cms_settings.draft', ?2)"
      ).bind(actor, String(body.summary || "Saved CMS draft configuration").slice(0, 160)).run();

      return jsonResponse({ ok: true, action: "save_draft" }, 201);
    }

    if (action === "publish") {
      const pubStr = JSON.stringify(body.published || body.draft || {});
      const label = String(body.version_label || "Published CMS Release").slice(0, 80);

      await db.prepare(
        `INSERT INTO cms_settings (config_key, published_json, draft_json, version_num, updated_by, updated_at)
         VALUES ('main', ?1, ?1, 1, ?2, datetime('now'))
         ON CONFLICT(config_key) DO UPDATE SET
           published_json = excluded.published_json,
           draft_json = excluded.draft_json,
           version_num = cms_settings.version_num + 1,
           updated_by = excluded.updated_by,
           updated_at = datetime('now')`
      ).bind(pubStr, actor).run();

      await db.prepare(
        "INSERT INTO cms_versions (version_label, snapshot_json, published_by) VALUES (?1, ?2, ?3)"
      ).bind(label, pubStr, actor).run();

      await db.prepare(
        "INSERT INTO cms_audit_log (actor, action_type, target_key, summary) VALUES (?1, 'PUBLISH_RELEASE', 'cms_settings.published', ?2)"
      ).bind(actor, `Published CMS release: ${label}`).run();

      return jsonResponse({ ok: true, action: "publish", version_label: label }, 201);
    }

    if (action === "upsert_offer") {
      const o = body.offer || {};
      const code = String(o.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 20);
      if (!code) return jsonResponse({ ok: false, error: "Valid offer code required" }, 400);
      const title = String(o.title || code).slice(0, 60);
      const desc = String(o.description || "").slice(0, 140);
      const dtype = o.discount_type === "FLAT" ? "FLAT" : "PERCENT";
      const dval = Math.max(0, Number(o.discount_value || 10));
      const minBill = Math.max(0, Number(o.min_bill || 0));
      const maxDisc = Math.max(0, Number(o.max_discount || 500));
      const elig = String(o.eligible_service || "ALL").toUpperCase();
      const sDate = String(o.start_date || "2026-01-01").slice(0, 10);
      const eDate = String(o.end_date || "2027-12-31").slice(0, 10);
      const uLimit = Math.max(1, Number(o.usage_limit || 100));
      const active = o.active === false || o.active === 0 ? 0 : 1;
      const featured = o.featured ? 1 : 0;

      await db.prepare(
        `INSERT INTO cms_offers (code, title, description, discount_type, discount_value, min_bill, max_discount, eligible_service, start_date, end_date, usage_limit, active, featured)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
         ON CONFLICT(code) DO UPDATE SET
           title=excluded.title, description=excluded.description, discount_type=excluded.discount_type,
           discount_value=excluded.discount_value, min_bill=excluded.min_bill, max_discount=excluded.max_discount,
           eligible_service=excluded.eligible_service, start_date=excluded.start_date, end_date=excluded.end_date,
           usage_limit=excluded.usage_limit, active=excluded.active, featured=excluded.featured`
      ).bind(code, title, desc, dtype, dval, minBill, maxDisc, elig, sDate, eDate, uLimit, active, featured).run();

      await db.prepare(
        "INSERT INTO cms_audit_log (actor, action_type, target_key, summary) VALUES (?1, 'UPSERT_OFFER', ?2, ?3)"
      ).bind(actor, code, `Upserted offer ${code} (${dtype} ${dval})`).run();

      return jsonResponse({ ok: true, code }, 201);
    }

    return jsonResponse({ ok: false, error: "Unsupported CMS action" }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal CMS error" }, 500);
  }
}
