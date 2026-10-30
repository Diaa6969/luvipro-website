import {applicationPayload,boundedBody,MAX_PROOF_BYTES,verifiedProof} from './validation.ts';
function assert(value:unknown){if(!value)throw new Error('assertion failed');}
function rejects(fn:()=>unknown){let failed=false;try{fn();}catch{failed=true;}assert(failed);}
Deno.test('file content, not caller extension or MIME, controls accepted format',()=>{
 const pdf=new Uint8Array(64);pdf.set([37,80,68,70,45]);assert(verifiedProof(pdf).extension==='pdf');
 const png=new Uint8Array(64);png.set([137,80,78,71,13,10,26,10]);assert(verifiedProof(png).mime==='image/png');
 const jpg=new Uint8Array(64);jpg.set([255,216,255]);assert(verifiedProof(jpg).extension==='jpg');
 rejects(()=>verifiedProof(new Uint8Array(64)));rejects(()=>verifiedProof(new Uint8Array(8)));rejects(()=>verifiedProof(new Uint8Array(MAX_PROOF_BYTES+1)));
});
function form(){const f=new FormData();for(const [k,v] of Object.entries({company_name:'SYNTHETIC COMPANY',contact_name:'SYNTHETIC CONTACT',business_address:'SYNTHETIC ADDRESS',phone:'',website:'',marketing_plan:'',country:'DE',terms_version:'2026-10-29',terms_accepted:'true',privacy_accepted:'true'}))f.set(k,v);return f;}
Deno.test('current explicit consent and bounded fields required',()=>{
 assert(applicationPayload(form()).terms_accepted===true);
 for(const key of ['terms_version','terms_accepted','privacy_accepted']){const f=form();f.delete(key);rejects(()=>applicationPayload(f));}
 const changed=form();changed.set('terms_version','historic');rejects(()=>applicationPayload(changed));
 const huge=form();huge.set('company_name','x'.repeat(161));rejects(()=>applicationPayload(huge));
 const injected=form();injected.set('contact_name','a\nb');rejects(()=>applicationPayload(injected));
 const country=form();country.set('country','XX');rejects(()=>applicationPayload(country));
});
Deno.test('chunked bodies cannot bypass request size limit',async()=>{
 const allowed=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(4));c.enqueue(new Uint8Array(4));c.close();}});
 assert((await boundedBody(allowed,8)).length===8);
 const tooBig=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(9));c.close();}});
 let failed=false;try{await boundedBody(tooBig,8);}catch{failed=true;}assert(failed);
});
