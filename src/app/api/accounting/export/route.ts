import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized } from "@/lib/accounting/admin-auth";
import { readAccountingYear } from "@/lib/accounting/database";
import { buildMonthlyTable, sumMonths, validYear } from "@/lib/accounting/monthly";

export const runtime = "nodejs";
function cell(value: string | number) {
  let text = String(value).replace(/\r|\n/g, " ");
  if (/^\s*[=+\-@]/.test(text)) text = "'" + text; // CSV spreadsheet injection protection
  return '"' + text.replace(/"/g, '""') + '"';
}
export async function GET(req: NextRequest) {
  if (!isAccountingRequestAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const year = Number(req.nextUrl.searchParams.get("year"));
  if (!validYear(year)) return NextResponse.json({ error: "Ungültiges Jahr" }, { status: 400 });
  try {
    const { outgoing, incoming } = await readAccountingYear(year);
    const monthly = buildMonthlyTable(year, outgoing, incoming);
    const all = [...monthly, sumMonths(monthly)];
    const lines = [
      ["Monat","Anzahl Ausgang","Anzahl Eingang","Umsatz netto Cent","USt Cent","Umsatz brutto Cent",
        "Ausgaben brutto Cent","Kosten nach Vorsteuer Cent","bestätigte Vorsteuer Cent","USt-Saldo Cent","Netto-Saldo Cent"].map(cell).join(";"),
      ...all.map(m => [
        m.month, m.outgoingCount, m.incomingCount, m.revenueNet, m.revenueVat, m.revenueGross,
        m.costsGross, m.costsNet, m.inputVatConfirmed, m.vatBalance, m.netDifference,
      ].map(cell).join(";")),
      "",
      ["Ausgangsrechnungen", "Rechnungsnummer", "Rechnungsdatum", "Kunde", "Netto Cent", "USt Cent", "Brutto Cent", "Status"].map(cell).join(";"),
      ...outgoing.map(inv => ["Ausgang",inv.invoice_number,inv.invoice_date || "",inv.invoice_snapshot?.customer?.name || "",
        inv.net_cents || 0,inv.vat_cents || 0,inv.gross_cents || 0,inv.delivery_state].map(cell).join(";")),
      "",
      ["Eingangsrechnungen", "Lieferantenrechnung", "Belegdatum", "Lieferant", "Netto Cent", "USt Cent", "Brutto Cent", "Vorsteuer manuell bestätigt"].map(cell).join(";"),
      ...incoming.map(exp => ["Eingang",exp.supplier_invoice_number,exp.invoice_date,exp.supplier,exp.net_cents,exp.vat_cents,
        exp.gross_cents,exp.vorsteuer_confirmed ? "ja" : "nein"].map(cell).join(";")),
    ];
    const csv = "\uFEFF" + lines.join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="LUVIPRO-Buchhaltung-${year}.csv"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Export nicht verfügbar" }, { status: 503 });
  }
}
