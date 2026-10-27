import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Run the actual TypeScript calculator in an isolated sandbox with typed
// product/inspection fixtures. No network, payment service or production DB.
const source = readFileSync("src/lib/invoicing/prices.ts", "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
const fakeRequire = (name) => {
  if (name === "@/lib/store") {
    return { DEVICE: { unitPriceNetCents: 300000, shippingNetCentsGermany: 2999, maxQuantity: 10 } };
  }
  if (name === "@/lib/inspection-pricing") {
    return { INSPECTION_SERVICES: [{ id: "standard", name: "Standard", priceCents: 5999 }, { id: "premium", name: "Premium", priceCents: 11999 }] };
  }
  throw new Error("Unexpected dependency " + name);
};
const context = { module, exports: module.exports, require: fakeRequire };
vm.runInNewContext(transpiled, context, { timeout: 1000, filename: "prices.ts" });
const { calculateInvoicePricing, invoiceReference } = module.exports;

const device = calculateInvoicePricing("device", 1);
assert.equal(device.netCents, 302999);
assert.equal(device.vatCents, 57570);
assert.equal(device.grossCents, 360569);
assert.equal(device.lines.length, 2);
assert.equal(device.lines[1].netCents, 2999);

const device2 = calculateInvoicePricing("device", 2);
assert.equal(device2.netCents, 602999);
assert.equal(device2.vatCents, 114570);
assert.equal(device2.grossCents, 717569);
assert.equal(device2.lines[1].netCents, 2999, "Shipping must not double");

const standard = calculateInvoicePricing("inspection_standard");
assert.equal(standard.netCents, 5041);
assert.equal(standard.vatCents, 958);
assert.equal(standard.grossCents, 5999);

const premium = calculateInvoicePricing("inspection_premium");
assert.equal(premium.netCents, 10083);
assert.equal(premium.vatCents, 1916);
assert.equal(premium.grossCents, 11999);

assert.throws(() => calculateInvoicePricing("inspection_standard", 2));
assert.throws(() => calculateInvoicePricing("device", 0));
assert.throws(() => calculateInvoicePricing("device", 11));
assert.equal(invoiceReference("LUV-2026-0000001"), "LUV-2026-0000001");
assert.throws(() => invoiceReference("INVALID\r\nTRANSFER"));

console.log("Invoice VAT calculations and reference validation: PASS (synthetic; no email/DB)");
