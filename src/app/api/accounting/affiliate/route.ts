import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized, isSameOrigin } from "@/lib/accounting/admin-auth";
import { affiliateDb } from "@/lib/affiliate/server";
import { monthOf } from "@/lib/accounting/monthly";
export const runtime="nodejs";
function str(f:FormData,k:string,max:number) {const v=f.get(k);if(typeof v!=="string"||v.length>max||/[\r\n]/.test(v)) throw new Error("Invalid "+k);return v.trim();}
function pct(s:string) {if(!/^\d{1,3}(?:\.\d{1,2})?$/.test(s)) throw new Error("Percent");const v=Math.round(Number(s)*100);if(v>10000) throw new Error("Percent");return v;}
function date(s:string) {if(monthOf(s)==="") throw new Error("Date");return s;}
function uuid(s:string) {if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) throw new Error("UUID");return s;}
export async function POST(req:NextRequest) {
 if(!isAccountingRequestAuthorized(req)) return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!isSameOrigin(req)||Number(req.headers.get("content-length")||"0")>7000) return NextResponse.json({error:"Forbidden"},{status:403});
 try {
  const f=await req.formData(),action=str(f,"action",30);
  if(action==="approve"||action==="reject") {
   const affiliate_id=uuid(str(f,"affiliate_id",36)),review_notes=str(f,"review_notes",500);
   const status=action==="approve"?"approved":"rejected";
   // Update only pending applications. A signed-in admin must inspect document before approving.
   const r=await affiliateDb("luvipro_affiliate_applications?id=eq."+affiliate_id+"&status=eq.pending&select=id",{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({status,review_notes,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()})});
   const data=await r.json() as {id:string}[];
   if(data.length!==1) throw new Error("Not pending");
   await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({action:"application_"+status,entity_id:affiliate_id,details:{review_notes}})});
  }else if(action==="create_code") {
   const affiliate_id=uuid(str(f,"affiliate_id",36));
   const a=await affiliateDb("luvipro_affiliate_applications?id=eq."+affiliate_id+"&status=eq.approved&select=id&limit=1");
   const rows=await a.json() as {id:string}[];if(rows.length!==1) throw new Error("Not approved");
   const code=str(f,"code",32).toUpperCase();
   if(!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)) throw new Error("Code");
   const valid_from=date(str(f,"valid_from",10)),valid_until=date(str(f,"valid_until",10));
   if(valid_until<valid_from) throw new Error("Dates");
   const usage=str(f,"usage_limit",10);
   const usage_limit=usage?Number(usage):null;
   if(usage_limit!==null&&(!Number.isSafeInteger(usage_limit)||usage_limit<1)) throw new Error("Usage");
   const body={affiliate_id,code,discount_bps:pct(str(f,"discount",6)),commission_bps:pct(str(f,"commission",6)),valid_from,valid_until,usage_limit,active:false};
   const r=await affiliateDb("luvipro_discount_codes?select=id",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify(body)});
   const out=await r.json() as {id:string}[];
   await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({action:"code_created",entity_id:out[0]?.id,details:{code,valid_from,valid_until,affiliate_id}})});
  } else throw new Error("Unsupported action");
  return NextResponse.redirect(new URL("/intern/finanzen/affiliate?ok=1",req.url),303);
 }catch{
  return NextResponse.json({error:"Aktion fehlgeschlagen. Bitte Daten, Berechtigungen und möglichen Dubletten prüfen."},{status:422,headers:{"Cache-Control":"no-store"}});
 }
}
