import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { applicationPayload,boundedBody,MAX_PROOF_BYTES,verifiedProof } from "./validation.ts";
import { settlementPdf } from './settlement_pdf.ts';

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS","Cache-Control":"no-store"};
const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers:{...cors,"Content-Type":"application/json"}});
const uuid=(value:unknown):value is string=>typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return reply(405,{error:"method_not_allowed"});
 const base=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!base||!key)return reply(503,{error:"service_unavailable"});
 const token=req.headers.get("authorization")?.match(/^Bearer ([A-Za-z0-9_.-]{40,4000})$/)?.[1];
 if(!token)return reply(401,{error:"authentication_required"});
 const service=createClient(base,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:auth,error:authError}=await service.auth.getUser(token);
 const actor=auth?.user;
 if(authError||!actor||actor.is_anonymous||!actor.email_confirmed_at)return reply(401,{error:"confirmed_account_required"});
 const scoped=createClient(base,key,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false,autoRefreshToken:false}});
 const type=req.headers.get("content-type")||"";
 if(type.startsWith("application/json")){
  try{
   const bytes=await boundedBody(req.body,8192);
   const input=JSON.parse(new TextDecoder().decode(bytes));
   if(input.action==='settlement_document'&&uuid(input.document_id)){
    const {data:document,error:documentError}=await service.from('luvipro_affiliate_settlement_documents').select('*').eq('id',input.document_id).maybeSingle();
    if(documentError||!document)return reply(403,{error:'document_not_authorized'});
    const {data:owner,error:ownerError}=await service.from('luvipro_affiliate_applications').select('owner_uid').eq('id',document.affiliate_id).maybeSingle();
    if(ownerError||!owner)return reply(403,{error:'document_not_authorized'});
    if(owner.owner_uid!==actor.id){const {data:admin,error:adminError}=await scoped.rpc('is_admin');if(adminError||admin!==true)return reply(403,{error:'document_not_authorized'});}
    const bytes=await settlementPdf(document);
    return new Response(new Uint8Array(bytes),{status:200,headers:{...cors,'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="LUVIPRO-Gutschrift.pdf"','X-Content-Type-Options':'nosniff'}});
   }
   if(input.action!=="document"||!uuid(input.application_id))return reply(400,{error:"invalid_request"});
   const {data:application,error}=await service.from("luvipro_affiliate_applications")
    .select("id,owner_uid,registration_path").eq("id",input.application_id).maybeSingle();
   if(error||!application)return reply(403,{error:"document_not_authorized"});
   if(application.owner_uid!==actor.id){
    const {data:admin,error:adminError}=await scoped.rpc("is_admin");
    if(adminError||admin!==true)return reply(403,{error:"document_not_authorized"});
   }
   // Storage path always comes from the authorized record, never from the client.
   const {data:signed,error:signError}=await service.storage.from("luvipro-affiliate-docs").createSignedUrl(application.registration_path,60);
   if(signError||!signed?.signedUrl)return reply(503,{error:"document_unavailable"});
   return reply(200,{url:signed.signedUrl,expires_in:60});
  }catch{return reply(400,{error:"invalid_document_request"});}
 }
 if(!type.startsWith("multipart/form-data;"))return reply(415,{error:"multipart_required"});
 const declared=Number(req.headers.get("content-length")||0);
 if(!Number.isFinite(declared)||declared>MAX_PROOF_BYTES+65536)return reply(413,{error:"request_too_large"});
 // A retry cannot create another membership or upload another proof unnecessarily.
 const {data:existing,error:lookupError}=await service.from("luvipro_affiliate_applications").select("id,status").eq("owner_uid",actor.id).maybeSingle();
 if(lookupError)return reply(503,{error:"account_unavailable"});
 if(existing)return reply(200,{application_id:existing.id,status:existing.status,already_exists:true});
 let newPath:string|undefined;
 try{
  const bytes=await boundedBody(req.body,MAX_PROOF_BYTES+65536);
  const form=await new Response(bytes,{headers:{"Content-Type":type}}).formData();
  const payload=applicationPayload(form),proof=form.get("registration");
  if(!(proof instanceof File))return reply(422,{error:"registration_proof_required"});
  const fileBytes=new Uint8Array(await proof.arrayBuffer()),format=verifiedProof(fileBytes);
  const path=actor.id+"/"+crypto.randomUUID()+"."+format.extension;
  const {error:uploadError}=await service.storage.from("luvipro-affiliate-docs").upload(path,fileBytes,{contentType:format.mime,upsert:false});
  if(uploadError)return reply(503,{error:"secure_upload_failed"});
  newPath=path;
  const {data:id,error:submitError}=await service.rpc("luvipro_affiliate_submit_v1",{p_actor:actor.id,p_payload:payload,p_registration_path:path});
  if(submitError||!uuid(id))throw new Error("submission_failed");
  newPath=undefined;
  return reply(201,{application_id:id,status:"pending"});
 }catch{
  // Only the unlinked object generated by THIS request; never an existing document.
  if(newPath)await service.storage.from("luvipro-affiliate-docs").remove([newPath]);
  return reply(422,{error:"application_not_saved",message:"Bitte Angaben, Gewerbenachweis und Zustimmung prüfen. Kein zweites Konto anlegen."});
 }
});
