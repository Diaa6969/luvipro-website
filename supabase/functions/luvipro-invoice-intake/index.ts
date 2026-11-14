import { inspectInvoiceXml } from "./xml.ts";

// Intake only. A format check is not an EN 16931 validation result.
const originAllowed = "https://ff-debug-service-frontend-free-ygxkweukma-uc.a.run.app";
const maxBytes = 5_242_880;

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  const headers = new Headers({ "Cache-Control": "no-store", Vary: "Origin" });
  const reply = (status: number, data: unknown) => Response.json(data, { status, headers });
  if (origin && origin !== originAllowed) return reply(403, { error: "Forbidden" });
  if (origin) headers.set("Access-Control-Allow-Origin", origin);
  if (request.method === "OPTIONS") {
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type");
    headers.set("Access-Control-Allow-Methods", "GET, POST");
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST" && request.method !== "GET")
    return reply(405, { error: "Method not allowed" });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, { error: "Unauthorized" });
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return reply(503, { error: "Intake unavailable" });
  try {
    const userHeaders = { apikey: anon, Authorization: authorization };
    const auth = await fetch(url + "/auth/v1/user", { headers: userHeaders });
    if (!auth.ok) return reply(401, { error: "Unauthorized" });
    const actor = (await auth.json()).id;
    const admin = await fetch(url + "/rest/v1/rpc/is_admin", {
      method: "POST",
      headers: { ...userHeaders, "Content-Type": "application/json" },
      body: "{}",
    });
    if (!actor || !admin.ok || await admin.json() !== true)
      return reply(403, { error: "Forbidden" });

    const privileged = { apikey: service, Authorization: "Bearer " + service };
    if (request.method === "GET") {
      const id = new URL(request.url).searchParams.get("id");
      if (id && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id))
        return reply(400, { error: "Invalid document ID" });
      const query = id
        ? "select=object_path,sha256,byte_length&id=eq." + id
        : "select=id,sha256,byte_length,received_at&order=received_at.desc,id.desc&limit=50";
      const result = await fetch(url + "/rest/v1/luvipro_invoice_intake?" + query,
        { headers: privileged });
      if (!result.ok) return reply(503, { error: "Intake unavailable" });
      const rows = await result.json();
      if (!id) return reply(200, { items: rows });
      const row = rows[0];
      if (!row) return reply(404, { error: "Document not found" });
      if (!/^[0-9a-f]{64}$/.test(row.sha256) ||
          !["xml", "pdf"].some(ext => row.object_path === "intake/" + row.sha256 + "." + ext))
        return reply(409, { error: "Document integrity conflict" });
      const object = await fetch(url + "/storage/v1/object/authenticated/luvipro-accounting/" +
        row.object_path, { headers: privileged });
      if (!object.ok) return reply(503, { error: "Storage unavailable" });
      const bytes = await object.arrayBuffer();
      if (bytes.byteLength !== row.byte_length || await hash(bytes) !== row.sha256)
        return reply(409, { error: "Document integrity conflict" });
      const ext = row.object_path.endsWith(".xml") ? "xml" : "pdf";
      headers.set("Content-Type", ext === "xml" ? "application/xml" : "application/pdf");
      headers.set("Content-Disposition", 'attachment; filename="invoice.' + ext + '"');
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(bytes, { headers });
    }

    const type = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
    if (type !== "application/pdf" && type !== "application/xml")
      return reply(415, { error: "Expected PDF or XML" });
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: "Empty document" });
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        return reply(413, { error: "Document too large" });
      }
      chunks.push(value);
    }
    if (!length) return reply(400, { error: "Empty document" });
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const pdf = type === "application/pdf";
    if (pdf && new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
      return reply(422, { error: "Invalid PDF signature" });
    let invoiceHeader;
    if (!pdf) {
      let xml: string;
      try { xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
      catch { return reply(422, { error: "Expected UTF-8 XML" }); }
      if (!xml.trimStart().startsWith("<") || /<!\s*(?:DOCTYPE|ENTITY)/i.test(xml))
        return reply(422, { error: "Unsupported XML input" });
      try { invoiceHeader = inspectInvoiceXml(xml); }
      catch { return reply(422, { error: "Malformed XML or unsupported invoice header" }); }
    }
    const sha256 = await hash(bytes.buffer);
    const path = `intake/${sha256}.${pdf ? "pdf" : "xml"}`;
    const object = await fetch(url + "/storage/v1/object/luvipro-accounting/" + path, {
      method: "POST",
      headers: { ...privileged, "Content-Type": type, "x-upsert": "false" },
      body: bytes,
    });
    // Existing objects can be left by an interrupted upload. Verify the bytes
    // before creating metadata when the same immutable object already exists.
    if (!object.ok) {
      const existing = await fetch(url + "/storage/v1/object/authenticated/luvipro-accounting/" + path,
        { headers: privileged });
      if (!existing.ok) return reply(503, { error: "Storage unavailable" });
      const previous = new Uint8Array(await existing.arrayBuffer());
      if (previous.length !== length || previous.some((byte, i) => byte !== bytes[i]))
        return reply(409, { error: "Document integrity conflict" });
    }
    const recorded = await fetch(url + "/rest/v1/luvipro_invoice_intake?on_conflict=sha256", {
      method: "POST",
      headers: { ...privileged, "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ object_path: path, sha256, byte_length: length, received_by: actor }),
    });
    if (!recorded.ok) return reply(503, { error: "Intake unavailable; retry the same document" });
    const rows = await recorded.json();
    return rows.length ? reply(201, { id: rows[0].id, state: "pending_validation", invoiceHeader })
      : reply(200, { state: "already_received" });
  } catch {
    return reply(503, { error: "Intake unavailable" });
  }
});

async function hash(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

