import {optionalAssist,type AssistConfig} from './assist.ts';
import type {SupabaseClient, SupabaseClientOptions} from 'npm:@supabase/supabase-js@2.117.3';
import {UUID,imageType,bounded,rpcAction} from './validation.ts';
type Dependencies={assist?:AssistConfig;url?:string;secret?:string;anon?:string;createClient:(url:string,key:string,options:SupabaseClientOptions<'public'>)=>SupabaseClient};
const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json'}});
export async function handleMarketplace(req:Request,deps:Dependencies):Promise<Response>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 const {url,secret,anon}=deps;
 if(!url||!secret||!anon)return reply(503,{error:'unavailable'});
 try{
 const service=deps.createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const token=req.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]{40,4000})$/)?.[1];
 let actor:string|null=null;
 if(token&&token!==anon){const {data,error}=await service.auth.getUser(token);if(error||!data.user?.email_confirmed_at||data.user.is_anonymous)return reply(401,{error:'confirmed_account_required'});actor=data.user.id;}
 const scoped=deps.createClient(url,anon,{global:{headers:{Authorization:'Bearer '+(actor?token:anon)}},auth:{persistSession:false,autoRefreshToken:false}});
 if((req.headers.get('content-type')||'').startsWith('multipart/form-data')){
  if(!actor)return reply(401,{error:'authentication_required'});
  const raw=await bounded(req,10485760+65536);
  const form=await new Response(new Uint8Array(raw),{headers:{'Content-Type':req.headers.get('content-type')!}}).formData();
  const id=String(form.get('listing_id')||''),requestId=String(form.get('upload_id')||''),category=String(form.get('category')||'other'),file=form.get('file');
  if(!UUID.test(id)||!UUID.test(requestId)||!(file instanceof File)||file.size<16||file.size>10485760)return reply(400,{error:'invalid_image_or_upload_id'});
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=imageType(bytes);
  if(!mime||(file.type&&file.type!=='application/octet-stream'&&mime!==file.type))return reply(415,{error:'jpeg_png_webp_required'});
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const {data:reservation,error:reserveError}=await service.rpc('luvipro_marketplace_upload_reserve_v1',{p_actor:actor,p_listing:id,p_request:requestId,p_mime:mime,p_bytes:bytes.length,p_sha256:sha,p_category:category});
  if(reserveError||!reservation)return reply(409,{error:'upload_not_reserved_check_owner_status_or_limit'});
  if(reservation.completed&&UUID.test(String(reservation.photo_id)))return reply(200,{photo_id:reservation.photo_id,completed:true});
  const path=reservation.path;
  if(typeof path!=='string'||!path.startsWith(actor+'/'+id+'/')||path.includes('..'))return reply(503,{error:'invalid_reservation'});
  if(!reservation.uploaded){
   const {error}=await service.storage.from('luvipro-marketplace-media').upload(path,bytes,{contentType:mime,upsert:false});
   if(error)return reply(503,{error:'upload_failed_retry_same_upload_id'});
  }
  const {data,error}=await service.rpc('luvipro_marketplace_photo_commit_v1',{p_actor:actor,p_listing:id,p_path:path,p_mime:mime,p_bytes:bytes.length,p_category:category});
  if(error||!UUID.test(String(data)))return reply(409,{error:'link_pending_retry_same_upload_id'});
  return reply(200,{photo_id:data,completed:true});
 }
 const input=JSON.parse(new TextDecoder().decode(await bounded(req,30000)));
 if(!input||Array.isArray(input)||typeof input!=='object')return reply(400,{error:'invalid_request'});
 if(input.action==='photo'){
  if(!UUID.test(String(input.id)))return reply(400,{error:'invalid_photo'});
  const {data:path,error}=await service.rpc('luvipro_marketplace_photo_access_v1',{p_photo:input.id,p_actor:actor});
  if(error||!path)return reply(404,{error:'photo_unavailable'});
  const {data,error:signError}=await service.storage.from('luvipro-marketplace-media').createSignedUrl(path,30);
  return signError||!data?.signedUrl?reply(503,{error:'photo_unavailable'}):reply(200,{url:data.signedUrl,expires_in:30});
 }
 const call=rpcAction(input);if(!call)return reply(400,{error:'invalid_action'});
 if(!call.public&&!actor)return reply(401,{error:'authentication_required'});
 const {data,error}=await scoped.rpc(call.name,call.params);
 if(error)return reply(422,{error:'Aktion nicht ausgeführt. Berechtigung, Pflichtangaben, Prüfbericht und aktuellen Status prüfen.'});
 if(input.action==='assist'&&actor&&data&&typeof data==='object'){
  const assisted=await optionalAssist(String(input.kind),String(input.text??''),data,deps.assist,async(request,action,cost,model)=>{
   const {data:accepted,error}=await service.rpc('luvipro_marketplace_ai_reserve_v1',{p_actor:actor,p_request:request,p_action:action,p_cost:cost,p_model:model});return !error&&accepted===true;
  });return reply(200,assisted);
 }
 return reply(200,data);
 }catch{return reply(400,{error:'request_not_completed_retry_safely'});}
}
