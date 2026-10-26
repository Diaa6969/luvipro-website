import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const src = readFileSync("src/lib/accounting/monthly.ts", "utf8");
const compiled = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const m = { exports: {} };
vm.runInNewContext(compiled, { module: m, exports: m.exports, require() { throw new Error("Unexpected dependency"); }, Intl, Date }, {timeout:1000});
const { safeVatSplit, buildMonthlyTable, sumMonths } = m.exports;
assert.deepEqual(JSON.parse(JSON.stringify(safeVatSplit(5999, 19))), { netCents: 5041, vatCents: 958, grossCents: 5999 });
assert.deepEqual(JSON.parse(JSON.stringify(safeVatSplit(11999, 19))), { netCents: 10083, vatCents: 1916, grossCents: 11999 });
assert.deepEqual(JSON.parse(JSON.stringify(safeVatSplit(1070, 7))), { netCents:1000,vatCents:70,grossCents:1070 });
assert.throws(() => safeVatSplit(-100, 19));
const outgoing = [
  { id: "a", invoice_number: "LUV-2026-0000001", invoice_date: "2026-10-26", created_at: "2026-10-26", delivery_state: "sent", net_cents:302999, vat_cents:57570, gross_cents:360569, invoice_snapshot: { paid: true }},
  { id: "b", invoice_number: "LUV-2026-0000002", invoice_date: "2026-10-27", created_at: "2026-10-27", delivery_state: "reserved", net_cents:302999, vat_cents:57570, gross_cents:360569, invoice_snapshot: { paid: false }},
  { id: "c", invoice_number: "LUV-2025-0000001", invoice_date: "2025-12-30", created_at: "2025-12-30", delivery_state: "sent", net_cents:100, vat_cents:19, gross_cents:119 },
];
const incoming = [
  { id: "i1", invoice_date: "2026-10-27", net_cents:10000, vat_cents:1900, gross_cents:11900, vorsteuer_confirmed:true, paid:true },
  { id: "i2", invoice_date: "2026-10-27", net_cents:10000, vat_cents:1900, gross_cents:11900, vorsteuer_confirmed:false, paid:false },
];
const table = buildMonthlyTable(2026, outgoing, incoming);
assert.equal(table.length, 12);
const oct = table[9];
assert.equal(oct.outgoingCount, 1);
assert.equal(oct.incomingCount, 2);
assert.equal(oct.revenueNet, 302999);
assert.equal(oct.revenueVat, 57570);
assert.equal(oct.revenueGross, 360569);
assert.equal(oct.inputVatConfirmed, 1900);
assert.equal(oct.vatBalance, 55670);
assert.equal(oct.costsGross, 23800);
assert.equal(oct.costsNet, 21900);
assert.equal(oct.paidRevenueGross, 360569);
assert.equal(oct.unpaidCostGross, 11900);
const total = sumMonths(table);
assert.equal(total.vatBalance, 55670);
assert.equal(total.outgoingCount, 1);
assert.throws(() => buildMonthlyTable(2019, outgoing, incoming));
console.log("LUVIPRO monthly ledger: PASS (12 months, paid/draft separation, VAT and input VAT; synthetic only)");
