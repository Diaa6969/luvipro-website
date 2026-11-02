import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),next=require('next/server');
const savedFetch=globalThis.fetch,savedUrl=process.env.SUPABASE_URL,savedAnon=process.env.SUPABASE_ANON_KEY;
const synthetic='SYNTHETIC_TEST_TOKEN_NOT_A_REAL_CREDENTIAL';let calls=[],checks=0;
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync('src/app/api/marketplace/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const deps={'next/server':next,'@/lib/affiliate/account':{AFFILIATE_COOKIE:'luvipro_affiliate_session'},'@/lib/accounting/admin-auth':{isSameOrigin:req=>req.headers.get('origin')===new URL(req.url).origin}};
new Function('require','module','exports',code)(n=>{if(!(n in deps))throw Error(n);return deps[n];},mod,mod.exports);
const req=(body,headers={})=>new next.NextRequest('https://synthetic.example/api/marketplace',{method:'POST',headers:{origin:'https://synthetic.example',host:'synthetic.example','content-type':'application/json',...headers},body});
try{
 process.env.SUPABASE_URL='https://synthetic.supabase.co';process.env.SUPABASE_ANON_KEY='SYNTHETIC_PUBLIC_ANON';
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({items:[],total:0,has_more:false});};
 assert.equal((await mod.exports.POST(req('{}',{origin:'https://other.invalid'}))).status,403);assert.equal(calls.length,0);checks++;
 assert.equal((await mod.exports.POST(req('{}',{'content-length':'5000000'}))).status,413);assert.equal(calls.length,0);checks++;
 assert.equal((await mod.exports.POST(req('x'.repeat(4259841),{'content-length':'0'}))).status,413);assert.equal(calls.length,0);checks++;
 const search=await mod.exports.POST(req(JSON.stringify({action:'read',mode:'search'})));assert.equal(search.status,200);assert.equal(search.headers.get('cache-control'),'no-store');assert.equal(calls[0].options.headers.Authorization,undefined);checks++;
 calls=[];await mod.exports.POST(req(JSON.stringify({action:'admin'}),{cookie:'luvipro_affiliate_session='+synthetic,authorization:'Bearer FORGED'}));assert.equal(calls[0].url,'https://synthetic.supabase.co/functions/v1/marketplace-v1');assert.equal(calls[0].options.headers.Authorization,'Bearer '+synthetic);assert.equal(calls[0].options.headers.apikey,'SYNTHETIC_PUBLIC_ANON');checks++;
 globalThis.fetch=async()=>Response.json({error:'authentication_required'},{status:401});assert.equal((await mod.exports.POST(req('{"action":"save"}'))).status,401);checks++;
 for(const body of [{action:'read',mode:'search'},{action:'read',mode:'detail',id:'synthetic'},{action:'report_offer',id:'synthetic'},{action:'photo',id:'synthetic'},{action:'promotion',transition:'public'}]){
  calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return calls.length===1?Response.json({error:'invalid_session'},{status:401}):Response.json(null);};
  const response=await mod.exports.POST(req(JSON.stringify(body),{cookie:'luvipro_affiliate_session='+synthetic}));
  assert.equal(response.status,200);assert.equal(calls.length,2);assert.equal(calls[0].options.headers.Authorization,'Bearer '+synthetic);assert.equal(calls[1].options.headers.Authorization,undefined);assert.equal(new TextDecoder().decode(calls[1].options.body),JSON.stringify(body));checks++;
 }
 for(const body of [{action:'save'},{action:'admin'},{action:'read',mode:'mine'},{action:'assist',kind:'search'},{action:'photos'},{action:'promotion',transition:'list'},{action:'promotion',transition:'confirm_payment'},{action:'marketplace_config'}]){
  calls=[];globalThis.fetch=async(url,options)=>{calls.push({url,options});return Response.json({error:'invalid_session'},{status:401});};
  assert.equal((await mod.exports.POST(req(JSON.stringify(body),{cookie:'luvipro_affiliate_session='+synthetic}))).status,401);assert.equal(calls.length,1);checks++;
 }
 globalThis.fetch=async()=>{throw Error('SYNTHETIC PRIVATE SERVER DETAIL');};const unavailable=await mod.exports.POST(req('{}'));assert.equal(unavailable.status,503);assert.ok(!(await unavailable.text()).includes('PRIVATE SERVER'));checks++;
 console.log(JSON.stringify({passed:checks,failed:0,scope:'Actual Next Marketplace proxy with mocked upstream; no network or business writes'}));
}finally{globalThis.fetch=savedFetch;for(const[k,v]of Object.entries({SUPABASE_URL:savedUrl,SUPABASE_ANON_KEY:savedAnon})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
