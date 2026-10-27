// STAGED EDGE FUNCTION FOR THE *EXISTING* FLUTTER LUVIPRO ADMIN APP.
 // Not deployed, and cannot be enabled until the production app's real
// Supabase admin identity is verified via auth.app_metadata + strict UID allowlist.
// No admin billing data/RLS permissions are granted to Flutter users.
const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("BANK_ADMIN_ALLOWED_ORIGIN") || "https://luvipro.de",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data),{status,headers:cors});
}
const validUuid = (id:unknown): id is string =>
  typeof id === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
const allowedActions = new Set(["list","confirm","preview_reminder","remind","deliver"]);

Deno.serve(async (req:Request) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:cors});
  if (req.method !== "POST") return json({error:"Method not allowed"},405);
  const apikey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const url = Deno.env.get("SUPABASE_URL") || "";
  const backend = Deno.env.get("BANK_BACKOFFICE_URL") || "";
  const bridge = Deno.env.get("BANK_ADMIN_BRIDGE_TOKEN") || "";
  const ids = (Deno.env.get("BANK_ADMIN_AUTH_UIDS")||"").split(",").map(s=>s.trim()).filter(Boolean);
  if (!apikey || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) ||
      !/^https:\/\/[^/]+\/api\/internal\/bank-orders$/.test(backend) ||
      bridge.length < 32 || ids.length === 0) return json({error:"Bank admin integration not configured"},503);
  const auth = req.headers.get("authorization") || "";
  if (!/^Bearer\s+\S+$/.test(auth)) return json({error:"Unauthorized"},401);
  try {
    const userResponse = await fetch(url + "/auth/v1/user", {
      headers:{Authorization:auth,apikey}, signal:AbortSignal.timeout(10000),
    });
    if (!userResponse.ok) return json({error:"Unauthorized"},401);
    const user = await userResponse.json() as {
      id?: string; app_metadata?: { role?:string; billing_admin?:boolean };
    };
    // Only signed Auth UUID allowlist plus administrator-controlled app_metadata.
    // NEVER trust public.users.role or user_metadata for payment authorization.
    if (!validUuid(user.id) || !ids.includes(user.id) ||
        user.app_metadata?.billing_admin !== true) return json({error:"Forbidden"},403);

    if (Number(req.headers.get("content-length")||0) > 3000) return json({error:"Payload too large"},413);
    const payload:unknown = await req.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return json({error:"Bad request"},400);
    const action=(payload as Record<string,unknown>).action;
    if (typeof action !== "string" || !allowedActions.has(action)) return json({error:"Action not allowed"},400);
    if (action !== "list" && !validUuid((payload as Record<string,unknown>).orderId)) return json({error:"Order ID invalid"},400);

    const remote = await fetch(backend, {
      method: action === "list" ? "GET" : "POST",
      headers:{
        Authorization:`Bearer ${bridge}`,
        "x-luvipro-admin-user":user.id,
        "Content-Type":"application/json",
      },
      body: action === "list" ? undefined : JSON.stringify(payload),
      signal:AbortSignal.timeout(20000),
      cache:"no-store",
    });
    const result = await remote.text();
    if(result.length > 200000) return json({error:"Response size exceeded"},502);
    // Only trusted preconfigured backend is allowed. Never echo its secrets.
    return new Response(result,{status:remote.status,headers:cors});
  } catch {
    return json({error:"Backend unavailable or request invalid"},503);
  }
});
