import {handleMarketplace} from './handler.ts';
import type {SupabaseClient} from 'npm:@supabase/supabase-js@2.117.3';
const actor='11111111-1111-4111-8111-111111111111',listing='22222222-2222-4222-8222-222222222222',photo='33333333-3333-4333-8333-333333333333',upload='44444444-4444-4444-8444-444444444444';
const token='synthetic_test_token_'.repeat(4),path=actor+'/'+listing+'/synthetic.png';
function assert(x:unknown){if(!x)throw Error('assertion failed');}
function harness(options:{authError?:boolean;confirmed?:boolean;reserveError?:boolean;completed?:boolean;uploaded?:boolean;uploadError?:boolean;commitError?:boolean;accessError?:boolean;throwAuth?:boolean}={}){
 const calls:{name:string;params:Record<string,unknown>}[]=[],uploads:unknown[]=[],signs:unknown[]=[];
 const service={auth:{getUser:()=>{if(options.throwAuth)throw Error('private backend message');return Promise.resolve({data:{user:{id:actor,email_confirmed_at:options.confirmed===false?null:'2026-01-01',is_anonymous:false}},error:options.authError});}},rpc:(name:string,params:Record<string,unknown>)=>{
  calls.push({name,params});
  if(name.includes('upload_reserve'))return Promise.resolve({data:{completed:options.completed,photo_id:photo,path,uploaded:options.uploaded},error:options.reserveError});
  if(name.includes('photo_commit'))return Promise.resolve({data:photo,error:options.commitError});
  if(name.includes('photo_access'))return Promise.resolve({data:options.accessError?null:path,error:options.accessError});
  return Promise.resolve({data:{items:[]},error:null});
 },storage:{from:(bucket:string)=>{assert(bucket==='luvipro-marketplace-media');return{upload:(p:string,b:Uint8Array,o:unknown)=>{uploads.push({p,n:b.length,o});return Promise.resolve({error:options.uploadError});},createSignedUrl:(p:string,ttl:number)=>{signs.push({p,ttl});return Promise.resolve({data:{signedUrl:'https://example.supabase.co/storage/v1/object/sign/synthetic'},error:null});}};}}};
 const scoped={rpc:(name:string,params:Record<string,unknown>)=>{calls.push({name,params});return Promise.resolve({data:{items:[]},error:null});}};
 const deps={url:'https://example.supabase.co',secret:'synthetic-service',anon:'synthetic-anon',createClient:(_u:string,k:string)=>(k==='synthetic-service'?service:scoped) as unknown as SupabaseClient};
 return{calls,uploads,signs,run:(r:Request)=>handleMarketplace(r,deps)};
}
function json(body:unknown,auth=true){return new Request('https://example.invalid',{method:'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});}
function image({auth=true,mime='application/octet-stream',id=upload,invalid=false}={}){const form=new FormData();const bytes=new Uint8Array(32);if(!invalid)bytes.set([137,80,78,71,13,10,26,10]);form.set('listing_id',listing);form.set('upload_id',id);form.set('file',new File([bytes],'synthetic.png',{type:mime}));return new Request('https://example.invalid',{method:'POST',headers:auth?{authorization:'Bearer '+token}:{},body:form});}
Deno.test('anonymous public search only; private writes denied before RPC',async()=>{const h=harness();assert((await h.run(json({action:'read',mode:'search'},false))).status===200);assert((await h.run(json({action:'save',data:{}},false))).status===401);assert(h.calls.length===1);});
Deno.test('unconfirmed and invalid sessions fail before upload',async()=>{for(const o of [{confirmed:false},{authError:true}]){const h=harness(o);assert((await h.run(image())).status===401);assert(!h.uploads.length&&!h.calls.length);}});
Deno.test('backend Auth failure is contained without raw error disclosure',async()=>{const r=await harness({throwAuth:true}).run(image());assert(r.status===400&&!(await r.text()).includes('private backend'));});
Deno.test('anonymous multipart never uploads',async()=>{const h=harness();assert((await h.run(image({auth:false}))).status===401);assert(!h.uploads.length);});
Deno.test('native octet MIME accepted only with valid image signature',async()=>{const h=harness();const r=await h.run(image());assert(r.status===200&&(await r.json()).completed===true);assert(h.calls[0].name.endsWith('upload_reserve_v1'));assert(h.calls[0].params.p_actor===actor&&String(h.calls[0].params.p_sha256).length===64);assert(h.uploads.length===1);});
Deno.test('invalid signatures, conflicting MIME and missing upload ID rejected',async()=>{for(const o of [{invalid:true},{mime:'image/jpeg'},{id:''}]){const h=harness();assert((await h.run(image(o))).status>=400);assert(!h.calls.length&&!h.uploads.length);}});
Deno.test('reservation denial never writes Storage',async()=>{const h=harness({reserveError:true});assert((await h.run(image())).status===409);assert(!h.uploads.length&&h.calls.length===1);});
Deno.test('completed retry returns same photo without duplicate upload or commit',async()=>{const h=harness({completed:true});assert((await h.run(image())).status===200);assert(!h.uploads.length&&h.calls.length===1);});
Deno.test('uploaded retry only commits existing reserved object',async()=>{const h=harness({uploaded:true});assert((await h.run(image())).status===200);assert(!h.uploads.length&&h.calls.length===2);});
Deno.test('failed upload cannot be marked complete',async()=>{const h=harness({uploadError:true});assert((await h.run(image())).status===503);assert(h.calls.length===1);});
Deno.test('ambiguous metadata commit is not success and preserves private object',async()=>{const h=harness({commitError:true});assert((await h.run(image())).status===409);assert(h.uploads.length===1);});
Deno.test('unauthorized photo denied before signing; permitted photo expires in 30 seconds',async()=>{const denied=harness({accessError:true});assert((await denied.run(json({action:'photo',id:photo},false))).status===404);assert(!denied.signs.length);const h=harness();const r=await h.run(json({action:'photo',id:photo}));assert(r.headers.get('Cache-Control')==='no-store'&&(await r.json()).expires_in===30);assert((h.signs[0] as {ttl:number}).ttl===30);});
Deno.test('Admin actions remain scoped RPCs; client cannot impersonate actor',async()=>{const h=harness();assert((await h.run(json({action:'admin',actor:'evil',section:'cases'}))).status===200);assert(h.calls[0].name==='luvipro_marketplace_admin_v1'&&!('actor'in h.calls[0].params));assert((await h.run(json({action:'admin'},false))).status===401);});
