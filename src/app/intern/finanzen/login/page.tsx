import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { accountingEnabled, isAccountingAdmin } from "@/lib/accounting/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Interner Zugang – LUVIPRO Buchhaltung",
  robots: { index: false, follow: false, nocache: true },
};
export default async function AccountingLogin({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAccountingAdmin()) redirect("/intern/finanzen");
  const query = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-obsidian px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0d1527] p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pulse">LUVIPRO · Intern</p>
        <h1 className="mt-4 text-3xl font-bold">Buchhaltung</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">Geschützter Zugriff auf Ausgangsrechnungen, Eingangsbelege und die Monatsübersicht.</p>
        {!accountingEnabled() ? (
          <div className="mt-8 rounded-xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-7 text-amber-100" role="status">
            Die interne Buchhaltung ist deaktiviert. Admin-Zugang und private Datenbank müssen zuerst sicher eingerichtet und freigegeben werden.
          </div>
        ) : (
          <form method="POST" action="/api/accounting/session" className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-slate-200">
              Administrator-Passwort
              <input className="mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-[#070e1e] px-4 text-white outline-none focus:border-pulse" type="password" name="password" minLength={24} autoComplete="current-password" required />
            </label>
            {query.error && <p role="alert" className="text-sm text-red-300">Zugangsdaten nicht bestätigt.</p>}
            <button className="min-h-12 w-full rounded-xl bg-pulse px-5 font-bold text-obsidian hover:bg-frost">Geschützt anmelden</button>
          </form>
        )}
        <p className="mt-7 text-xs leading-6 text-slate-400">Nur für autorisierte Geschäftsführung. Keine öffentliche Registrierung.</p>
      </div>
    </main>
  );
}
