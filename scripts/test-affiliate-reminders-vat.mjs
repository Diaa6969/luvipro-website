import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
function splitGross(totalCents,rate){
 assert(Number.isSafeInteger(totalCents)&&totalCents>=0);
 if(rate===0)return {net:totalCents,vat:0,gross:totalCents};
 assert.equal(rate,19);
 const net=Math.floor((totalCents*100+59)/119);
 return {net,vat:totalCents-net,gross:totalCents};
}
assert.deepEqual(splitGross(27000,19),{net:22689,vat:4311,gross:27000});
assert.deepEqual(splitGross(27000,0),{net:27000,vat:0,gross:27000});
assert.deepEqual(splitGross(0,19),{net:0,vat:0,gross:0});
for(const gross of [1,10,99,1000,27000,30000,999999]){
 const {net,vat}=splitGross(gross,19);
 assert.equal(net+vat,gross);
 assert.ok(vat>=0);
 assert.ok(Math.abs(Math.round(net*.19)-vat)<=1);
}
const sql=readFileSync("docs/sql/affiliate-manual-settlements.sql","utf8");
assert.match(sql,/commission_gross_inclusive_agreed boolean not null default false/);
assert.match(sql,/p.amount_cents - \(p.amount_cents\*100\+59\)\/119/);
assert.match(sql,/p.amount_cents-v_vat,v_vat,p.amount_cents/);
assert.match(sql,/grant execute on function public.luvipro_affiliate_prepare_manual_payout\(uuid,date,uuid\)/);
const reminders=readFileSync("docs/sql/affiliate-payment-reminders.sql","utf8");
assert.match(reminders,/on conflict\(payout_id\) do update/);
assert.match(reminders,/v_status<>'prepared'/);
assert.match(reminders,/create trigger luvipro_affiliate_reminder_paid/);
assert.match(reminders,/luvipro_affiliate_clear_payment_reminder/);
assert.doesNotMatch(reminders,/stripe\.transfers\.create|paypal\.payouts|sepa.*initiate/i);
const ui=readFileSync("src/app/intern/finanzen/affiliate/page.tsx","utf8");
assert.match(ui,/Zahlungserinnerung speichern/);
assert.match(ui,/Admin bestätigt: Überweisung ist erfolgt/);
assert.match(ui,/Zahlungserinnerung fällig/);
assert.match(ui,/gross_inclusive_agreed/);
const route=readFileSync("src/app/api/accounting/affiliate/settlements/route.ts","utf8");
assert.match(route,/action==="set_reminder"/);
assert.match(route,/action==="mark_manual_paid"/);
assert.match(route,/f\.get\("bank_transfer_done"\)!=="on"/);
assert.match(route,/f\.get\("evidence_checked"\)!=="on"/);
console.log("LUVIPRO admin reminders and fixed commission including VAT: synthetic checks PASS");
