import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{NextRequest}=require('next/server');
const admin='11111111-1111-4111-8111-111111111111',customer='22222222-2222-4222-8222-222222222222';
const token='SYNTHETIC_EXISTING_ADMIN_SESSION_TOKEN_1234567890',other='SYNTHETIC_EXISTING_CUSTOMER_SESSION_1234567890';
let legacy=false,bearerValid=false,session=null,role='admin',failDb=false,rows=1,dbCalls=0,financialReads=0,checks=0;
const account={AFFILIATE_COOKIE:'luvipro_affiliate_session',affiliateCurrentSession:async()=>session,verifyAffiliateToken:async t=>{if(![token,other].includes(t))throw Error('Expired or forged');return {id:t===token?admin:customer,email_confirmed_at:'2026-10-30',user_metadata:{role:'admin'}};}};
const server={affiliateDb:async path=>{dbCalls++;if(failDb)throw Error('Unavailable');if(!path.startsWith('users?')){financialReads++;return Response.json([]);}const id=path.includes(admin)?admin:customer;return Response.json(Array.from({length:rows},()=>({id,role:id===admin?role:'customer'})));}};
function load(file,deps){const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;new Function('require','module','exports',code)(n=>{if(n==='server-only')return {};if(n in deps)return deps[n];throw Error('Unexpected dependency '+n);},m,m.exports);return m.exports;}
const actor=load('src/lib/affiliate/admin-actor.ts',{'./account':account,'./server':server});
const access=load('src/lib/affiliate/admin-access.ts',{'./account':account,'./admin-actor':actor,'@/lib/accounting/admin-auth':{isAccountingAdmin:async()=>legacy,isAccountingRequestAuthorized:()=>legacy},'@/lib/accounting/admin-request':{isAuthorizedFinanceAdmin:async()=>bearerValid}});
const req=(cookie=null,bearer=null)=>new NextRequest('https://synthetic.example/api/accounting/affiliate/promo',{headers:{...(cookie?{cookie:'luvipro_affiliate_session='+cookie}:{}),...(bearer!==null?{authorization:bearer}: {})}});
async function check(actual,expected){assert.equal(await actual,expected);checks++;}
await check(access.isAuthorizedAffiliateAdmin(req()),false);assert.equal(dbCalls,0);
await check(access.isAuthorizedAffiliateAdmin(req(token)),true);
await check(access.isAuthorizedAffiliateAdmin(req(other)),false); // Metadata admin never overrides protected DB role.
await check(access.isAuthorizedAffiliateAdmin(req('FORGED')),false);
role='partner';await check(access.isAuthorizedAffiliateAdmin(req(token)),false);role='admin';
rows=2;await check(access.isAuthorizedAffiliateAdmin(req(token)),false);rows=1;
failDb=true;await check(access.isAuthorizedAffiliateAdmin(req(token)),false);failDb=false;
legacy=true;await check(access.isAuthorizedAffiliateAdmin(req()),true);
await check(access.isAuthorizedAffiliateAdmin(req(token,'Bearer FORGED')),false); // Explicit bad bearer cannot fall back to valid cookies.
bearerValid=true;await check(access.isAuthorizedAffiliateAdmin(req(null,'Bearer VALID_SYNTHETIC')),true);bearerValid=false;legacy=false;
session=null;await check(access.isAffiliatePageAdmin(),false);
session=token;await check(access.isAffiliatePageAdmin(),true);
session=other;await check(access.isAffiliatePageAdmin(),false);
session='FORGED';await check(access.isAffiliatePageAdmin(),false);
legacy=true;await check(access.isAffiliatePageAdmin(),true);legacy=false;
await check(actor.financeAdminActor(req(token)),admin);
await assert.rejects(()=>actor.financeAdminActor(req(other)));checks++;
await assert.rejects(()=>actor.financeAdminActor(req(token,'Bearer FORGED')));checks++;
assert.equal(fs.readFileSync('src/app/api/accounting/documents/route.ts','utf8').includes('affiliate/admin-access'),false);checks++;
const page=load('src/app/intern/finanzen/affiliate/page.tsx',{'react/jsx-runtime':require('react/jsx-runtime'),'next/link':{default:()=>null},'next/navigation':{redirect:path=>{throw Error('REDIRECT:'+path);}},'@/lib/accounting/admin-auth':{isAccountingAdmin:async()=>legacy},'@/lib/affiliate/admin-access':access,'@/lib/affiliate/server':{...server,affiliateBackendConfigured:()=>true},'@/components/accounting/affiliate-promo-manager':{AffiliatePromoManager:()=>null},'@/components/shop/account-order-history':{AccountOrderHistory:()=>null}});
session=null;financialReads=0;await assert.rejects(()=>page.default({searchParams:Promise.resolve({})}),/REDIRECT:/);assert.equal(financialReads,0);checks++;
session=other;await assert.rejects(()=>page.default({searchParams:Promise.resolve({})}),/REDIRECT:/);assert.equal(financialReads,0);checks++;
session=token;assert.ok(await page.default({searchParams:Promise.resolve({})}));assert.equal(financialReads,7);checks++;
legacy=true;session=null;financialReads=0;assert.ok(await page.default({searchParams:Promise.resolve({})}));assert.equal(financialReads,7);checks++;
console.log(JSON.stringify({passed:checks,failed:0,scope:'Actual Affiliate-only Admin guard and actor functions with synthetic verified Auth/DB responses; no network, real user changes or payments'}));
