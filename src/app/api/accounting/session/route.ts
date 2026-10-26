import { NextRequest, NextResponse } from "next/server";
import {
  accountingEnabled, accountingCookieName, accountingMaxAgeSeconds,
  createAccountingSession, isSameOrigin, verifyAccountingPassword,
} from "@/lib/accounting/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!accountingEnabled()) return NextResponse.json({ error: "Buchhaltung deaktiviert." }, { status: 503 });
  if (!isSameOrigin(request) || Number(request.headers.get("content-length") || 0) > 2000) {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 403 });
  }
  const form = await request.formData();
  const password = form.get("password");
  if (typeof password !== "string" || !verifyAccountingPassword(password)) {
    return NextResponse.redirect(new URL("/intern/finanzen/login?error=1", request.url), 303);
  }
  const result = NextResponse.redirect(new URL("/intern/finanzen", request.url), 303);
  result.cookies.set(accountingCookieName, createAccountingSession(), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/intern", maxAge: accountingMaxAgeSeconds,
  });
  // API endpoints need the same cookie; use '/' path and strict same-site.
  result.cookies.set(accountingCookieName, createAccountingSession(), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: accountingMaxAgeSeconds,
  });
  result.headers.set("Cache-Control", "no-store");
  return result;
}
export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(accountingCookieName, "", { maxAge: 0, path: "/" });
  response.cookies.set(accountingCookieName, "", { maxAge: 0, path: "/intern" });
  return response;
}
