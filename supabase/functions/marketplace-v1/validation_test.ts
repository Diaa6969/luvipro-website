import {imageType,rpcAction,bounded} from './validation.ts';
function assert(x:unknown){if(!x)throw Error('assertion failed');}
Deno.test('magic bytes reject executable, svg and unknown data',()=>{assert(imageType(new TextEncoder().encode('<svg onload=alert(1)>'))===null);assert(imageType(new Uint8Array(100))===null);});
Deno.test('PNG signature and minimum size',()=>{const b=new Uint8Array(32);b.set([137,80,78,71,13,10,26,10]);assert(imageType(b)==='image/png');assert(imageType(b.slice(0,8))===null);});
Deno.test('client cannot select arbitrary SQL RPC or actor',()=>{assert(rpcAction({action:'execute_sql'})===null);const x=rpcAction({action:'save',actor:'evil',data:{brand:'test'}});assert(x?.public===false&&!('actor' in x.params));});
Deno.test('mandate revocation supplies required nullable RPC arguments without weakening Admin guard',()=>{const x=rpcAction({action:'authority',revoke:'synthetic-id',evidence:'SYNTHETIC reviewed revocation'});assert(x?.public===false&&x.params.p_seller===null&&x.params.p_vehicle===null&&x.params.p_report===null&&x.params.p_expires===null);});
Deno.test('only search/detail are anonymous',()=>{for(const mode of ['mine','review','eligible'])assert(rpcAction({action:'read',mode})?.public===false);assert(rpcAction({action:'read',mode:'search'})?.public===true);});
Deno.test('request bytes bounded independently of content-length',async()=>{let failed=false;try{await bounded(new Request('https://example.invalid',{method:'POST',body:'123456'}),3);}catch{failed=true;}assert(failed);});
