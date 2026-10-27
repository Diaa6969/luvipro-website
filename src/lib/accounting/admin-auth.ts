import "server-only";
import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE = "luvipro_accounting_session";
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

function secrets() {
  const password = process.env.ACCOUNTING_ADMIN_PASSWORD || "";
  const secret = process.env.ACCOUNTING_SESSION_SECRET || "";
  if (process.env.ACCOUNTING_PANEL_ENABLED !== "true" || password.length < 24 || secret.length < 32) return null;
  return { password, secret };
}
function equals(a: string, b: string) {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}
export function accountingEnabled() { return secrets() !== null; }
export function verifyAccountingPassword(password: string) {
  const s = secrets();
  return Boolean(s && password.length < 256 && equals(s.password, password));
}
export function createAccountingSession() {
  const s = secrets();
  if (!s) throw new Error("Accounting is disabled");
  const payload = [Date.now().toString(10), randomBytes(18).toString("hex")].join(".");
  const signature = createHmac("sha256", s.secret).update(payload).digest("hex");
  return payload + "." + signature;
}
function verifySession(value?: string) {
  const s = secrets();
  if (!s || !value || value.length > 250) return false;
  const match = /^(\d{13})\.([a-f0-9]{36})\.([a-f0-9]{64})$/.exec(value);
  if (!match) return false;
  const issued = Number(match[1]);
  if (!Number.isSafeInteger(issued) || issued > Date.now() + 60000 || Date.now() - issued > EIGHT_HOURS) return false;
  const payload = match[1] + "." + match[2];
  const sig = createHmac("sha256", s.secret).update(payload).digest("hex");
  return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(match[3], "hex"));
}
export async function isAccountingAdmin() {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}
export function isAccountingRequestAuthorized(req: NextRequest) {
  return verifySession(req.cookies.get(COOKIE)?.value);
}
export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
export const accountingCookieName = COOKIE;
export const accountingMaxAgeSeconds = EIGHT_HOURS / 1000;
