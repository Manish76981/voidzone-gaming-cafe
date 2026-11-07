/**
 * VoidZone Gaming Cafe - Health & Readiness Probe (/functions/api/health.js)
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-VZ-Role, X-VZ-Pin",
  "Content-Type": "application/json;charset=UTF-8"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const db = context?.env?.DB;
  return new Response(
    JSON.stringify({
      ok: true,
      service: "voidzone-gaming-cafe",
      version: "5.2.0",
      platform: "cloudflare-pages-functions",
      d1_bound: Boolean(db)
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}
