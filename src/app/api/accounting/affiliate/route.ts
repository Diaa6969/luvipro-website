import { NextRequest, NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/accounting/admin-auth";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import {describeCodeChange,type DiscountCodeRow} from "@/lib/affiliate/code-controls";
import { affiliateDb } from "@/lib/affiliate/server";
import { monthOf } from "@/lib/accounting/monthly";
export const runtime="nodejs";
function str(f:FormData,k:string,max:number) {const v=f.get(k);if(typeof v!=="string"||v.length>max||/[\r\n]/.test(v)) throw new Error("Invalid "+k);return v.trim();}
function optionalStr(f:FormData,k:string,max:number) {const v=f.get(k);if(v===null)return "";if(typeof v!=="string"||v.length>max||/[\r\n]/.test(v))throw new Error("Invalid "+k);return v.trim();}
function pct(s:string) {if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(s)) throw new Error("Percent");const v=Math.round(Number(s)*100);if(v>10000) throw new Error("Percent");return v;}
function date(s:string) {if(monthOf(s)==="") throw new Error("Date");return s;}
function uuid(s:string) {if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) throw new Error("UUID");return s;}
export async function POST(req:NextRequest) {
 if(!isSameOrigin(req)&&!req.headers.has("authorization")) return NextResponse.json({error:"Forbidden origin"},{status:403});
 if(!(await isAuthorizedFinanceAdmin(req))) return NextResponse.json({error:"Unauthorized"},{status:401});
 const size=Number(req.headers.get("content-length")||"0");
 if(!Number.isSafeInteger(size)||size<=0||size>7000) return NextResponse.json({error:"Invalid request size"},{status:403});
 try {
  const f=await req.formData(),action=str(f,"action",30);
  if(action==="approve"||action==="reject") {
   const affiliate_id=uuid(str(f,"affiliate_id",36)),review_notes=str(f,"review_notes",500);
   const status=action==="approve"?"approved":"rejected";
   const contractRef=action==="approve"?str(f,"individual_agreement_ref",200):"";
   if(action==="approve" && (contractRef.length<4 || f.get("individual_agreement_confirmed")!=="on"
     || f.get("gross_inclusive_terms")!=="on")) throw new Error("Signed individual terms and gross-inclusive compensation agreement required");
   // Update only pending applications. A signed-in admin must inspect document before approving.
   const r=await affiliateDb("luvipro_affiliate_applications?id=eq."+affiliate_id+"&status=eq.pending&select=id",{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({status,review_notes,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString(),
      ...(action==="approve"?{individual_agreement_ref:contractRef,individual_agreement_accepted_at:new Date().toISOString()}: {})})});
   const data=await r.json() as {id:string}[];
   if(data.length!==1) throw new Error("Not pending");
   await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({action:"application_"+status,entity_id:affiliate_id,details:{review_notes,...(action==="approve"?{individual_agreement_ref:contractRef,gross_inclusive_verified:true}: {})}})});
  }else if(action==="create_code") {
   const affiliate_id=uuid(str(f,"affiliate_id",36));
   const a=await affiliateDb("luvipro_affiliate_applications?id=eq."+affiliate_id+"&status=eq.approved&select=id,legal_agb_version,legal_agb_accepted_at,individual_agreement_ref,individual_agreement_accepted_at&limit=1");
   const rows=await a.json() as {id:string;legal_agb_version:string|null;legal_agb_accepted_at:string|null;individual_agreement_ref:string;individual_agreement_accepted_at:string|null}[];
   if(rows.length!==1||!rows[0].legal_agb_accepted_at||!rows[0].individual_agreement_accepted_at||rows[0].individual_agreement_ref.length<4) throw new Error("Partner must accept AGB and sign individual terms");
   const code=str(f,"code",32).toUpperCase();
   if(!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)) throw new Error("Code");
   const valid_from=date(str(f,"valid_from",10)),valid_until=date(str(f,"valid_until",10));
   if(valid_until<valid_from) throw new Error("Dates");
   const usage=str(f,"usage_limit",10);
   const usage_limit=usage?Number(usage):null;
   if(usage_limit!==null&&(!Number.isSafeInteger(usage_limit)||usage_limit<1)) throw new Error("Usage");
   const codeTermsRef=str(f,"code_terms_evidence_ref",200);
   if(codeTermsRef.length<4||f.get("code_terms_confirmed")!=="on")throw new Error("Signed code conditions required");
   const body={affiliate_id,code,discount_bps:pct(str(f,"discount",6)),commission_bps:pct(str(f,"commission",6)),valid_from,valid_until,usage_limit,active:false,
     code_terms_evidence_ref:codeTermsRef,code_terms_confirmed_at:new Date().toISOString()};
   const r=await affiliateDb("luvipro_discount_codes?select=id",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(body)});
   const out=await r.json() as {id:string}[];
   await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({action:"code_created",entity_id:out[0]?.id,details:{code,valid_from,valid_until,affiliate_id,code_terms_evidence_ref:codeTermsRef}})});
  }else if(action==="link_existing_account"){
   const affiliate_id=uuid(str(f,"affiliate_id",36));
   const owner_uid=uuid(str(f,"owner_uid",36));
   if(f.get("identity_verified")!=="on")throw new Error("Identity verification required");
   const host=process.env.SUPABASE_URL||"";
   const service=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
   if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(host)||!service)throw new Error("Backend unavailable");
   // Lookup uses server-side Admin API and never exposes service key to browser/app.
   const u=await fetch(host+"/auth/v1/admin/users/"+owner_uid,{
     headers:{apikey:service,Authorization:"Bearer "+service},
     cache:"no-store",signal:AbortSignal.timeout(7000)
   });
   if(!u.ok)throw new Error("Existing account not found");
   const person=await u.json() as {id?:string;email_confirmed_at?:string|null};
   if(person.id!==owner_uid||!person.email_confirmed_at)throw new Error("Verified login required");
   const patch=await affiliateDb("luvipro_affiliate_applications?id=eq."+affiliate_id+"&status=eq.approved&owner_uid=is.null&select=id",{
     method:"PATCH",headers:{Prefer:"return=representation"},
     body:JSON.stringify({owner_uid,updated_at:new Date().toISOString()})
   });
   const changed=await patch.json() as {id:string}[];
   if(changed.length!==1)throw new Error("Account already linked or not approved");
   await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({
     action:"admin_verified_existing_auth_link",entity_id:affiliate_id,
     details:{owner_uid,identity_confirmed_by_admin:true}
   })});
  }else if(["pause_code","resume_code","renew_code","edit_code"].includes(action)){
   const codeId=uuid(str(f,"code_id",36));
   const expectedVersion=Number(str(f,"expected_version",10));
   if(!Number.isSafeInteger(expectedVersion)||expectedVersion<1)throw new Error("Invalid version");
   const currentResult=await affiliateDb("luvipro_discount_codes?select=id,code,affiliate_id,discount_bps,commission_bps,valid_from,valid_until,usage_limit,redemption_count,active,version,code_terms_evidence_ref,code_terms_confirmed_at&id=eq."+codeId+"&limit=1");
   const current=(await currentResult.json() as (DiscountCodeRow & {code_terms_evidence_ref:string;code_terms_confirmed_at:string|null})[])[0];
   if(!current||current.version!==expectedVersion)throw new Error("Stale code version");
   const app=await affiliateDb("luvipro_affiliate_applications?select=status,legal_agb_accepted_at,individual_agreement_accepted_at&id=eq."+current.affiliate_id+"&limit=1");
   const agreement=(await app.json() as {status:string;legal_agb_accepted_at:string|null;individual_agreement_accepted_at:string|null}[])[0];
   if(action==="resume_code" && (!agreement||agreement.status!=="approved"||!agreement.legal_agb_accepted_at||!agreement.individual_agreement_accepted_at||!current.code_terms_confirmed_at||current.code_terms_evidence_ref.length<4))
      throw new Error("Partner and code terms not verified");
   const hasPast=await affiliateDb("luvipro_affiliate_commissions?select=id&code_id=eq."+codeId+"&limit=1");
   const previousSales=(await hasPast.json() as {id:string}[]).length>0;
   const input={
    code:optionalStr(f,"code",32),discount:optionalStr(f,"discount",8),commission:optionalStr(f,"commission",8),
    valid_from:optionalStr(f,"valid_from",10),valid_until:optionalStr(f,"valid_until",10),
    usage_limit:optionalStr(f,"usage_limit",12)
   };
   const now=new Date().toISOString().slice(0,10);
   const changes={...describeCodeChange(action,input,current,previousSales,
     process.env.AFFILIATE_COUPON_REDEMPTION_ENABLED==="true",now)};
   if(action==="edit_code"||action==="renew_code"){
     const codeTermsRef=str(f,"code_terms_evidence_ref",200);
     if(codeTermsRef.length<4||f.get("code_terms_confirmed")!=="on")throw new Error("Signed changed code conditions required");
     Object.assign(changes,{code_terms_evidence_ref:codeTermsRef,code_terms_confirmed_at:new Date().toISOString()});
   }
   const patch=await affiliateDb("luvipro_discount_codes?select=id&id=eq."+codeId+"&version=eq."+expectedVersion,{
    method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify(changes)
   });
   const updated=await patch.json() as {id:string}[];
   if(updated.length!==1)throw new Error("Code changed concurrently");
   // Database trigger writes immutable before/after audit in the same transaction.
  } else throw new Error("Unsupported action");
  if(req.headers.has("authorization"))return NextResponse.json({saved:true},{headers:{"Cache-Control":"no-store"}});
  return NextResponse.redirect(new URL("/intern/finanzen/affiliate?ok=1",req.url),303);
 }catch{
  if(!req.headers.has("authorization"))return NextResponse.redirect(new URL("/intern/finanzen/affiliate?error=1",req.url),303);
  return NextResponse.json({error:"Aktion fehlgeschlagen. Bitte Daten, Berechtigungen und möglichen Dubletten prüfen."},{status:422,headers:{"Cache-Control":"no-store"}});
 }
}
