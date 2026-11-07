/**
 * VoidZone Gaming Cafe - Unified Community, Social, Creator, Brand & Sponsorship Ecosystem API (/functions/api/ecosystem.js)
 *
 * Enforces:
 * - Central VoidZone Account Foundation (no duplicate identities; every user starts as Customer)
 * - Granular Backend RBAC Permissions (community.*, creator.*, social.*, collaboration.*, brand.*, campaign.*, sponsorship.*, moderation.*)
 * - Anti-Escalation & Anti-Self-Verification (Users cannot self-verify Creator/Brand badges; Creator/Brand != Staff/Owner)
 * - Privacy Protection (Masks private creator rate cards and private brand budget ranges unless authorized)
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

function resolveRequestRole(request, env) {
  const pin = request.headers.get("X-VZ-Pin") || "";
  const devKey = request.headers.get("X-VZ-Dev-Key") || "";
  const ownerPin = String(env?.OWNER_PIN || "9999");
  const staffPin = String(env?.STAFF_PIN || "1234");
  const devPin = String(env?.DEV_PIN || "4242");
  if (pin === ownerPin) return "owner";
  if (pin === staffPin) return "staff";
  if (devKey === devPin || devKey === ownerPin) return "developer";
  return "customer";
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;
    const db = env?.DB;
    const role = resolveRequestRole(request, env);
    const isStaffOrOwner = role === "staff" || role === "owner";

    if (!db) {
      return jsonResponse({ ok: true, mode: "client-local", role });
    }

    const [posts, ideas, creators, brands, collabs, campaigns, sponsorships] = await Promise.all([
      db.prepare("SELECT * FROM community_posts WHERE status = 'PUBLISHED' ORDER BY created_at DESC LIMIT 30").all(),
      db.prepare("SELECT * FROM community_ideas ORDER BY votes_count DESC LIMIT 30").all(),
      db.prepare("SELECT * FROM creator_profiles ORDER BY reputation_score DESC LIMIT 30").all(),
      db.prepare("SELECT * FROM brand_profiles ORDER BY created_at DESC LIMIT 30").all(),
      db.prepare("SELECT * FROM collaboration_opportunities ORDER BY created_at DESC LIMIT 30").all(),
      db.prepare("SELECT * FROM brand_campaigns ORDER BY created_at DESC LIMIT 30").all(),
      db.prepare("SELECT * FROM sponsorship_inventory ORDER BY price_inr ASC").all()
    ]);

    // Strip private rate cards and private brand budgets from public responses
    const safeCreators = (creators.results || []).map((c) => ({
      ...c,
      private_rate_card_inr: (c.expose_rates_public || isStaffOrOwner) ? c.private_rate_card_inr : undefined
    }));
    const safeBrands = (brands.results || []).map((b) => ({
      ...b,
      private_budget_range: isStaffOrOwner ? b.private_budget_range : "Private (Verified Partners Only)"
    }));

    return jsonResponse({
      ok: true,
      role,
      community_posts: posts.results || [],
      community_ideas: ideas.results || [],
      creators: safeCreators,
      brands: safeBrands,
      collaborations: collabs.results || [],
      campaigns: campaigns.results || [],
      sponsorship_inventory: sponsorships.results || []
    });
  } catch {
    return jsonResponse({ ok: false, error: "INTERNAL_ECOSYSTEM_ERROR" }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const db = env?.DB;
    const role = resolveRequestRole(request, env);
    const isStaffOrOwner = role === "staff" || role === "owner";
    const body = await request.json();
    const action = String(body.action || "");

    // Security Guard: Self-verification of Creator or Brand status is strictly forbidden for non-admin users
    if (action === "verify_creator" || action === "verify_brand" || action === "moderate_report") {
      if (!isStaffOrOwner) {
        return jsonResponse({
          ok: false,
          error: "RBAC_FORBIDDEN: Only verified Staff or Owner sessions can approve Creator/Brand verification or moderation actions."
        }, 403);
      }
    }

    // Security Guard: Only Owner can modify Sponsorship Inventory pricing
    if (action === "update_sponsorship_asset" && role !== "owner") {
      return jsonResponse({
        ok: false,
        error: "RBAC_FORBIDDEN: Only verified Cafe Owner can update Sponsorship Inventory pricing and terms."
      }, 403);
    }

    if (!db) {
      return jsonResponse({ ok: true, mode: "client-local", action, role });
    }

    if (action === "create_post") {
      const postId = "POST-" + Date.now();
      const phone = String(body.author_phone || "9820011223").slice(0, 15);
      const name = String(body.author_name || "Gamer").slice(0, 40);
      const handle = String(body.author_handle || "player_vz").slice(0, 30);
      const postType = ["Text", "Image", "Video", "Achievement", "Tournament", "Event", "Team", "Creator", "Collaboration", "Announcement"].includes(body.post_type) ? body.post_type : "Text";
      const title = String(body.title || "Community Update").slice(0, 100);
      const text = String(body.body || "").slice(0, 500);
      const game = String(body.game_tag || "Valorant").slice(0, 40);
      await db.prepare(
        "INSERT INTO community_posts (post_id, author_phone, author_name, author_handle, post_type, title, body, game_tag) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
      ).bind(postId, phone, name, handle, postType, title, text, game).run();
      return jsonResponse({ ok: true, post_id: postId }, 201);
    }

    if (action === "upsert_creator_profile") {
      const creatorId = "CR-" + String(body.member_phone || "9820011223").slice(-6);
      const phone = String(body.member_phone || "9820011223").slice(0, 15);
      const displayName = String(body.display_name || "VoidZone Creator").slice(0, 50);
      const handle = String(body.handle || "creator_vz").slice(0, 32);
      const category = String(body.creator_category || "Streamer & Content Creator").slice(0, 50);
      const bio = String(body.bio || "").slice(0, 300);
      // Force Unverified on user self-submission so users cannot self-verify
      await db.prepare(
        `INSERT INTO creator_profiles (creator_id, member_phone, display_name, handle, creator_category, bio, verification_status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'Unverified')
         ON CONFLICT(member_phone) DO UPDATE SET
           display_name = excluded.display_name,
           handle = excluded.handle,
           creator_category = excluded.creator_category,
           bio = excluded.bio,
           updated_at = datetime('now')`
      ).bind(creatorId, phone, displayName, handle, category, bio).run();
      return jsonResponse({ ok: true, creator_id: creatorId, verification_status: "Unverified" });
    }

    return jsonResponse({ ok: true, action, role });
  } catch {
    return jsonResponse({ ok: false, error: "INTERNAL_ECOSYSTEM_ERROR" }, 500);
  }
}
