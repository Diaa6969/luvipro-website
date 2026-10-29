import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const path="src/lib/affiliate/code-controls.ts";
const source=readFileSync(path,"utf8");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const module={exports:{}};
vm.runInNewContext(js,{module,exports:module.exports},{filename:path});
const {describeCodeChange,validISODate,validPercent,validUsageLimit}=module.exports;
const code={
 id:"test",code:"WORKSHOP10",affiliate_id:"a",discount_bps:1000,commission_bps:1000,
 valid_from:"2026-11-01",valid_until:"2026-12-31",redemption_count:0,usage_limit:100,active:false,version:1
};
function change(action,params={},record=code,prior=false,ready=false,now="2026-11-10"){
 return describeCodeChange(action,params,record,prior,ready,now);
}
assert.equal(change("pause_code").active,false);
assert.throws(()=>change("resume_code"),/Checkout/);
assert.equal(change("resume_code",{},code,false,true).active,true);
assert.throws(()=>change("resume_code",{},{...code,valid_until:"2026-10-31"},false,true),/expired/);
assert.throws(()=>change("renew_code",{valid_until:"2026-11-30"}),/shorten/);
assert.equal(change("renew_code",{valid_until:"2027-01-31"}).valid_until,"2027-01-31");
const fields={code:"WORKSHOP15",discount:"15",commission:"12.5",valid_from:"2026-11-01",valid_until:"2027-01-31",usage_limit:"150"};
const edited=change("edit_code",fields);
assert.equal(edited.active,false);assert.equal(edited.code,"WORKSHOP15");
assert.equal(edited.discount_bps,1500);assert.equal(edited.commission_bps,1250);
assert.throws(()=>change("edit_code",fields,{...code,redemption_count:1}),/cannot be renamed/);
assert.throws(()=>change("edit_code",fields,code,true),/cannot be renamed/);
assert.throws(()=>change("edit_code",{...fields,code:"WORKSHOP10",valid_from:"2026-11-05"},{...code,redemption_count:1}),/Start cannot change/);
assert.throws(()=>change("edit_code",{...fields,usage_limit:"0"}),/usage limit/i);
assert.throws(()=>change("edit_code",{...fields,discount:"101"}),/outside/);
assert.throws(()=>validISODate("2026-02-30"),/calendar/);
assert.equal(validPercent("0.01"),1);
assert.equal(validUsageLimit("",3),null);
console.log("Affiliate code pause / resume / renewal / safe edit rules: PASS");
