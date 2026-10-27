import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source=fs.readFileSync("src/lib/bank-transfer/logic.ts","utf8");
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
const requireDependency=(name)=>{
  if(name!=="@/lib/invoicing/prices")throw Error("Unexpected module "+name);
  return {
    calculateInvoicePricing(_kind,qty){
      const net=300000*qty+2999;
      const vat=57000*qty+570;
      return {netCents:net,vatCents:vat,grossCents:net+vat};
    },
    moneyEUR(cents){return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(cents/100)}
  };
};
vm.runInNewContext(compiled,{exports:mod.exports,module:mod,require:requireDependency,Intl,Date},{timeout:1000});
const {bankPaymentRequest,bankPaymentReminder,assertBankOrder}=mod.exports;
const mock={
  id:"00000000-0000-4000-8000-000000000001",request_key:"00000000-0000-4000-8000-000000000002",
  invoice_id:"00000000-0000-4000-8000-000000000003",invoice_number:"LUV-2026-0000001",
  customer_company:"Werkstatt Beispiel GmbH",customer_contact:"Max Beispiel",
  customer_email:"max@example.invalid",customer_address:"Musterstr. 12",
  customer_postal_code:"30159",customer_city:"Hannover",customer_phone:"",
  quantity:1,net_cents:302999,vat_cents:57570,gross_cents:360569,
  payment_status:"pending",payment_mail_status:"sent",payment_mail_sent_at:null,
  paid_at:null,bank_transaction_reference:null,reminder_count:0,
  reminder_claimed_at:null,last_reminded_at:null,created_at:"2026-10-27T08:20:00Z",
  updated_at:"2026-10-27T08:20:00Z"
};
const bank={iban:"DE02120300000000202051",holder:"LUVIPRO UG",bic:"BYLADEM1001"};
assert.equal(assertBankOrder(mock).grossCents,360569);
const first=bankPaymentRequest(mock,bank);
const reminder=bankPaymentReminder(mock,bank);
for(const mail of [first,reminder]){
  assert.match(mail.text,/LUV-2026-0000001/);
  assert.match(mail.text,/3.605,69/);
  assert.match(mail.text,/DE02120300000000202051/);
  assert.match(mail.text,/Max Beispiel/);
}
assert.match(first.text,/keine endgültige/);
assert.match(reminder.subject,/Zahlungserinnerung/);
assert.match(reminder.text,/Falls Sie bereits überwiesen haben/);
assert.throws(()=>bankPaymentReminder({...mock,payment_status:"paid"},bank));
assert.throws(()=>assertBankOrder({...mock,vat_cents:0}));
assert.throws(()=>assertBankOrder({...mock,invoice_number:"INVALID"}));

const sql=fs.readFileSync("docs/sql/bank-transfer-orders.sql","utf8");
assert.equal(sql.match(/CREATE TABLE IF NOT EXISTS public\.luvipro_bank_orders/g)?.length,1);
assert.equal(sql.match(/CREATE OR REPLACE FUNCTION public\.luvipro_bank_order_create/g)?.length,1);
assert.match(sql,/ALTER TABLE public\.luvipro_bank_orders ENABLE ROW LEVEL SECURITY/);
assert.match(sql,/REVOKE ALL ON public\.luvipro_bank_orders FROM PUBLIC, anon, authenticated/);
assert.match(sql,/p_actor_id uuid,p_bank_reference text,p_paid_at timestamptz/);
assert.match(sql,/reminder_claimed_at < now\(\)-interval '24 hours'/);
assert.match(sql,/request_ip_hash/);
assert.match(sql,/p_ip_hash/);
console.log("Bank transfer order/reminder and SQL policy contracts: PASS (synthetic; no live DB/email)");
