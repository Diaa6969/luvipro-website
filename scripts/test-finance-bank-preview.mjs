import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const source = readFileSync("src/lib/accounting/bank-import.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
new Function("require", "exports", compiled)(createRequire(import.meta.url), exports);
const parse = exports.parseBankStatement;
const header = "Datum;Betrag;Währung;Transaktions-ID;Verwendungszweck\n";
const row = '2026-01-15;-12,34;EUR;bank-1;"Beleg; ""Test"""';
const [item] = parse(header + row);
assert.equal(item.amountCents, -1234);
assert.equal(item.reference, 'Beleg; "Test"');
assert.throws(() => parse(header + row + "\n" + row), /Doppelte/);
assert.throws(() => parse(header + row.replace("01-15", "02-30")), /Buchungsdatum/);
assert.throws(() => parse(header + row.replace("EUR", "USD")), /CSV-Zeile/);
console.log("Bank CSV: cents, quoting, duplicates, invalid dates and currency passed.");
