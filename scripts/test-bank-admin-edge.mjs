import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Test actual staged Edge Function with a fully synthetic Supabase user and
// fake backoffice. Never open a network socket or access production.
const uid = "00000000-0000-4000-8000-000000000011";
const otherUid = "00000000-0000-4000-8000-000000000022";
const bridge = "x".repeat(48);
const env = new Map([
  ["SUPABASE_ANON_KEY", "synthetic-public-key"],
  ["SUPABASE_URL", "https://synthetic.supabase.co"],
  ["BANK_BACKOFFICE_URL", "https://internal.example.invalid/api/internal/bank-orders"],
  ["BANK_ADMIN_BRIDGE_TOKEN", bridge],
  ["BANK_ADMIN_AUTH_UIDS", uid],
  ["BANK_ADMIN_ALLOWED_ORIGIN", "https://luvipro.de"],
]);
let handler;
let identities = { id: uid, app_metadata: { billing_admin: true } };
let backofficeCalls = 0;
let lastBridgeHeader;
const stubFetch = async (url, opts) => {
  if (url === "https://synthetic.supabase.co/auth/v1/user") {
    if (opts.headers.Authorization !== "Bearer fake-user-token") {
      return new Response(JSON.stringify({ msg: "unauthorized" }), { status: 401 });
    }
    return Response.json(identities);
  }
  if (url === "https://internal.example.invalid/api/internal/bank-orders") {
    backofficeCalls++;
    lastBridgeHeader = opts.headers;
    return Response.json({ orders: [
      { id: "00000000-0000-4000-8000-000000000033", invoice_number: "LUV-2026-0000001" },
    ] });
  }
  throw new Error("Unexpected network path " + url);
};
const Deno = { env: { get: key => env.get(key) }, serve: fn => { handler = fn; } };
const original = readFileSync("integration/supabase/functions/bank-transfer-admin/index.ts", "utf8");
const js = ts.transpileModule(original, {
  compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(js, { Deno, Response, Request, URL, AbortSignal, fetch: stubFetch }, {timeout:1000});
assert.equal(typeof handler, "function");

const invoke = (payload, token="fake-user-token", method="POST") =>
  handler(new Request("https://synthetic.supabase.co/functions/v1/bank-transfer-admin", {
    method,
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: method === "POST" ? JSON.stringify(payload) : undefined,
  }));

let res = await invoke({ action: "list" }, "bad-token");
assert.equal(res.status, 401);
assert.equal(backofficeCalls, 0);

res = await invoke({ action: "list" });
assert.equal(res.status, 200);
assert.equal(backofficeCalls, 1);
assert.equal(lastBridgeHeader.Authorization, "Bearer " + bridge);
assert.equal(lastBridgeHeader["x-luvipro-admin-user"], uid);

identities = { id: otherUid, app_metadata: { billing_admin: true } };
res = await invoke({ action: "list" });
assert.equal(res.status, 403);
assert.equal(backofficeCalls, 1);

identities = { id: uid, app_metadata: { billing_admin: false } };
res = await invoke({ action: "list" });
assert.equal(res.status, 403);
assert.equal(backofficeCalls, 1);

identities = { id: uid, app_metadata: { billing_admin: true } };
res = await invoke({ action: "not_allowed" });
assert.equal(res.status, 400);
assert.equal(backofficeCalls, 1);

res = await invoke({ action: "confirm" });
assert.equal(res.status, 400);
assert.equal(backofficeCalls, 1);

res = await invoke({
  action: "preview_reminder",
  orderId: "00000000-0000-4000-8000-000000000033",
});
assert.equal(res.status, 200);
assert.equal(backofficeCalls, 2);

env.set("BANK_ADMIN_AUTH_UIDS", "");
res = await invoke({ action: "list" });
assert.equal(res.status, 503);
assert.equal(backofficeCalls, 2);

console.log("Staged Supabase bank-admin bridge: PASS (JWT validation, allowlist, signed app metadata, action allowlist, no live network)");
