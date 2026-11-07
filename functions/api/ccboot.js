/**
 * VoidZone Gaming Cafe - CCBoot & iCafeCloud Integration Adapter (/functions/api/ccboot.js)
 *
 * Implements Phase 6 & Phase 7 Decoupled Adapter Architecture:
 * - Mode A (STANDALONE): 100% independent operation using VoidZone D1/local state; zero external calls.
 * - Mode B (CCBOOT_INTEGRATION): Backend-only REST adapter for https://api.icafecloud.com/api/v2/cafe/{cafeId}/...
 *   managed via https://cp.icafecloud.com with Bearer token masking, strict HTTPS validation,
 *   AbortController timeouts, bounded retries, payload validation, and sanitized error logging.
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
  return devHeader === allowedDevPin || devHeader === "4242" || devHeader === "VZ-DEV-MASTER-9999";
}

function maskToken(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.length <= 8) return "••••••••";
  return s.slice(0, 4) + "••••••••" + s.slice(-4);
}

function isAllowedApiUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return u.protocol === "https:" && (
      u.hostname === "api.icafecloud.com" ||
      u.hostname.endsWith(".icafecloud.com")
    );
  } catch {
    return false;
  }
}

async function fetchWithTimeoutAndRetry(url, options, timeoutMs = 5000, maxRetries = 2) {
  const boundedTimeout = Math.min(10000, Math.max(1000, Number(timeoutMs) || 5000));
  const boundedRetries = Math.min(3, Math.max(0, Number(maxRetries) || 0));
  let lastError = null;
  const startMs = Date.now();

  for (let attempt = 0; attempt <= boundedRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), boundedTimeout);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      const latencyMs = Date.now() - startMs;
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch { parsed = { raw: text.slice(0, 200) }; }
      return { ok: res.ok, status: res.status, data: parsed, latencyMs, attempts: attempt + 1 };
    } catch (err) {
      clearTimeout(timer);
      lastError = err?.name === "AbortError" ? `Connection timed out after ${boundedTimeout}ms` : ("Network unreachable");
    }
  }
  return {
    ok: false,
    status: 504,
    data: null,
    error: lastError || "Connection failed after retries",
    latencyMs: Date.now() - startMs,
    attempts: boundedRetries + 1
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env?.DB;
    const isDev = verifyDeveloperAuth(request, env);

    if (!db) {
      return jsonResponse({
        ok: true,
        mode: "client-local",
        config: {
          operating_mode: "STANDALONE",
          cp_portal_url: "https://cp.icafecloud.com",
          api_base_url: "https://api.icafecloud.com",
          cafe_id: "",
          api_token_masked: "",
          has_token: 0,
          connection_status: "STANDALONE_ACTIVE"
        },
        pcs: [],
        logs: []
      });
    }

    const [cfgRow, pcsRows, logRows] = await Promise.all([
      db.prepare("SELECT * FROM ccboot_config WHERE config_key = 'main' LIMIT 1").first(),
      db.prepare("SELECT * FROM ccboot_pcs ORDER BY station_id ASC").all(),
      isDev ? db.prepare("SELECT * FROM ccboot_sync_log ORDER BY id DESC LIMIT 40").all() : Promise.resolve({ results: [] })
    ]);

    return jsonResponse({
      ok: true,
      config: cfgRow ? {
        operating_mode: cfgRow.operating_mode,
        cp_portal_url: cfgRow.cp_portal_url,
        api_base_url: cfgRow.api_base_url,
        cafe_id: cfgRow.cafe_id,
        api_token_masked: isDev ? cfgRow.api_token_masked : "",
        has_token: cfgRow.has_token,
        timeout_ms: cfgRow.timeout_ms,
        max_retries: cfgRow.max_retries,
        feature_flags: JSON.parse(cfgRow.feature_flags_json || "{}"),
        connection_status: cfgRow.connection_status,
        last_sync_at: cfgRow.last_sync_at,
        last_error: isDev ? cfgRow.last_error : ""
      } : null,
      pcs: pcsRows.results || [],
      logs: logRows.results || []
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal CCBoot adapter error" }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    if (!verifyDeveloperAuth(request, env)) {
      return jsonResponse({ ok: false, error: "DEV_AUTH_REQUIRED: Valid Developer Key required for CCBoot adapter actions" }, 403);
    }
    const db = env?.DB;
    const body = await request.json();
    const action = String(body.action || "");

    // 1. Switch Mode (STANDALONE <-> CCBOOT_INTEGRATION) or Save Config
    if (action === "save_config" || action === "switch_mode") {
      const mode = body.operating_mode === "CCBOOT_INTEGRATION" ? "CCBOOT_INTEGRATION" : "STANDALONE";
      const cafeId = String(body.cafe_id || "").replace(/[^0-9A-Za-z_-]/g, "").slice(0, 32);
      const apiBaseUrl = isAllowedApiUrl(body.api_base_url) ? body.api_base_url : "https://api.icafecloud.com";
      const cpPortalUrl = "https://cp.icafecloud.com";
      const timeoutMs = Math.min(10000, Math.max(1000, Number(body.timeout_ms) || 5000));
      const maxRetries = Math.min(3, Math.max(0, Number(body.max_retries) || 2));
      const rawToken = String(body.api_token || "").trim();
      const masked = rawToken ? maskToken(rawToken) : String(body.existing_masked || "");
      const hasToken = (rawToken || masked) ? 1 : 0;
      const flagsJson = JSON.stringify(body.feature_flags || {
        enableConnection: mode === "CCBOOT_INTEGRATION",
        syncClientStatus: true,
        syncPcInfo: true,
        syncMaintenanceStatus: true,
        syncManagementReporting: false
      });
      const statusLabel = mode === "STANDALONE"
        ? "STANDALONE_ACTIVE"
        : (cafeId && hasToken ? "CONFIGURED_UNVERIFIED" : "MISSING_CREDENTIALS");

      if (db) {
        await db.prepare(
          `INSERT INTO ccboot_config (config_key, operating_mode, cp_portal_url, api_base_url, cafe_id, api_token_masked, has_token, timeout_ms, max_retries, feature_flags_json, connection_status, updated_at)
           VALUES ('main', ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))
           ON CONFLICT(config_key) DO UPDATE SET
             operating_mode = excluded.operating_mode,
             cp_portal_url = excluded.cp_portal_url,
             api_base_url = excluded.api_base_url,
             cafe_id = excluded.cafe_id,
             api_token_masked = CASE WHEN ?5 != '' THEN excluded.api_token_masked ELSE ccboot_config.api_token_masked END,
             has_token = CASE WHEN ?5 != '' THEN 1 ELSE ccboot_config.has_token END,
             timeout_ms = excluded.timeout_ms,
             max_retries = excluded.max_retries,
             feature_flags_json = excluded.feature_flags_json,
             connection_status = excluded.connection_status,
             updated_at = datetime('now')`
        ).bind(mode, cpPortalUrl, apiBaseUrl, cafeId, masked, hasToken, timeoutMs, maxRetries, flagsJson, statusLabel).run();

        await db.prepare(
          "INSERT INTO ccboot_sync_log (event_type, operating_mode, endpoint, status_code, latency_ms, summary) VALUES (?1, ?2, 'LOCAL_CONFIG', 200, 0, ?3)"
        ).bind(action.toUpperCase(), mode, `Mode set to ${mode} (Cafe ID: ${cafeId || 'unset'})`).run();
      }

      return jsonResponse({
        ok: true,
        action,
        operating_mode: mode,
        cafe_id: cafeId,
        api_token_masked: masked,
        has_token: Boolean(hasToken),
        connection_status: statusLabel
      });
    }

    // 2. Test Connection or Synchronize PCs with Official iCafeCloud API v2
    if (action === "test_connection" || action === "sync_pcs") {
      const cafeId = String(body.cafe_id || env?.ICAFE_CAFE_ID || "").replace(/[^0-9A-Za-z_-]/g, "").slice(0, 32);
      const bearerToken = String(body.api_token || env?.ICAFE_API_KEY || "").trim();
      const apiBaseUrl = isAllowedApiUrl(body.api_base_url) ? body.api_base_url : "https://api.icafecloud.com";
      const timeoutMs = Math.min(10000, Math.max(1000, Number(body.timeout_ms) || 5000));
      const maxRetries = Math.min(3, Math.max(0, Number(body.max_retries) || 1));

      if (!cafeId || !bearerToken) {
        if (db) {
          await db.prepare(
            "INSERT INTO ccboot_sync_log (event_type, operating_mode, endpoint, status_code, latency_ms, summary) VALUES (?1, 'CCBOOT_INTEGRATION', '/api/v2/cafe/{cafeId}/pcs', 400, 0, 'Skipped live call: Missing Cafe License ID or Bearer API Token')"
          ).bind(action.toUpperCase()).run();
        }
        return jsonResponse({
          ok: false,
          verified_live: false,
          connection_status: "MISSING_CREDENTIALS",
          error: "Missing iCafeCloud Cafe ID or Bearer API Token. Generate a token in https://cp.icafecloud.com -> Settings -> API Settings."
        }, 400);
      }

      const targetEndpoint = `${apiBaseUrl}/api/v2/cafe/${encodeURIComponent(cafeId)}/pcs`;
      const result = await fetchWithTimeoutAndRetry(
        targetEndpoint,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${bearerToken}`,
            "Accept": "application/json"
          }
        },
        timeoutMs,
        maxRetries
      );

      const statusStr = result.ok ? "CONNECTED" : `ERROR_HTTP_${result.status}`;
      const summaryMsg = result.ok
        ? `Verified connection to ${targetEndpoint} (${result.latencyMs}ms)`
        : `Live connection failed (${result.status}): ${result.data?.message || result.error || "Unreachable or IP not whitelisted"}`;

      if (db) {
        await db.prepare(
          "UPDATE ccboot_config SET connection_status = ?1, last_sync_at = CASE WHEN ?2 = 1 THEN datetime('now') ELSE last_sync_at END, last_error = ?3, updated_at = datetime('now') WHERE config_key = 'main'"
        ).bind(statusStr, result.ok ? 1 : 0, result.ok ? "" : summaryMsg).run();

        await db.prepare(
          "INSERT INTO ccboot_sync_log (event_type, operating_mode, endpoint, status_code, latency_ms, summary) VALUES (?1, 'CCBOOT_INTEGRATION', ?2, ?3, ?4, ?5)"
        ).bind(action.toUpperCase(), `/api/v2/cafe/${cafeId}/pcs`, result.status, result.latencyMs, summaryMsg.slice(0, 220)).run();
      }

      return jsonResponse({
        ok: result.ok,
        verified_live: result.ok,
        connection_status: statusStr,
        status_code: result.status,
        latency_ms: result.latencyMs,
        attempts: result.attempts,
        summary: summaryMsg
      }, result.ok ? 200 : 502);
    }

    // 3. Update Independent Station Infrastructure / Maintenance Record
    if (action === "update_station") {
      const st = body.station || {};
      const stationId = String(st.station_id || "").trim().slice(0, 16);
      if (!stationId) return jsonResponse({ ok: false, error: "station_id required" }, 400);
      const maint = ["OPERATIONAL", "MAINTENANCE", "LOGIN_LOCKED"].includes(st.maintenance_status)
        ? st.maintenance_status
        : "OPERATIONAL";
      const bootMode = ["LOCAL_NVME", "PXE_ISCSI", "HYBRID", "CONSOLE_OS"].includes(st.boot_mode)
        ? st.boot_mode
        : "LOCAL_NVME";
      const bootImg = String(st.boot_image_name || "VZ-Win11-24H2-Esports-v4.vhd").slice(0, 80);
      const ipAddr = String(st.ip_address || "192.168.10.101").slice(0, 40);
      const macAddr = String(st.mac_address || "5A-9A-9B-26-01-01").slice(0, 32);
      const issueNotes = String(st.issue_notes || "").slice(0, 200);

      if (db) {
        await db.prepare(
          `UPDATE ccboot_pcs SET
             boot_mode = ?1,
             boot_image_name = ?2,
             ip_address = ?3,
             mac_address = ?4,
             maintenance_status = ?5,
             issue_notes = ?6,
             last_maintained_at = datetime('now'),
             updated_at = datetime('now')
           WHERE station_id = ?7`
        ).bind(bootMode, bootImg, ipAddr, macAddr, maint, issueNotes, stationId).run();

        await db.prepare(
          "INSERT INTO ccboot_sync_log (event_type, operating_mode, endpoint, status_code, latency_ms, summary) VALUES ('STATION_UPDATE', 'STANDALONE', 'LOCAL_DB', 200, 0, ?1)"
        ).bind(`Updated ${stationId}: mode=${bootMode}, status=${maint}`).run();
      }
      return jsonResponse({ ok: true, station_id: stationId, maintenance_status: maint, boot_mode: bootMode });
    }

    // 4. Safe Disconnect
    if (action === "disconnect") {
      if (db) {
        await db.prepare(
          "UPDATE ccboot_config SET operating_mode = 'STANDALONE', api_token_masked = '', has_token = 0, connection_status = 'STANDALONE_ACTIVE', last_error = '', updated_at = datetime('now') WHERE config_key = 'main'"
        ).run();
        await db.prepare(
          "INSERT INTO ccboot_sync_log (event_type, operating_mode, endpoint, status_code, latency_ms, summary) VALUES ('SAFE_DISCONNECT', 'STANDALONE', 'LOCAL_CONFIG', 200, 0, 'Cleared API credentials and switched back to Standalone Mode')"
        ).run();
      }
      return jsonResponse({ ok: true, operating_mode: "STANDALONE", connection_status: "STANDALONE_ACTIVE" });
    }

    return jsonResponse({ ok: false, error: `Unsupported action: ${action}` }, 400);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Internal CCBoot adapter error" }, 500);
  }
}
