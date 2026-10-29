import { NextRequest,NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/accounting/admin-auth";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { affiliateDb,affiliateConfigured } from "@/lib/affiliate/server";
export const runtime="nodejs";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE=/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
function val(data:FormData,key:string,max=200){
 const v=data.get(key);
 if(typeof v!=="string"||v.length>max||/[\r\n]/.test(v))throw Error("Invalid field");
 return v.trim();
}
function id(v:string){if(!UUID.test(v))throw Error("Invalid id");return v;}
async function actor(req:NextRequest){
 const bearer=req.headers.get("authorization")||"";
 if(/^Bearer [\w.-]{40,4000}$/.test(bearer)){
  const host=process.env.SUPABASE_URL||"",key=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
  const response=await fetch(host+"/auth/v1/user",{
   headers:{"Authorization":bearer,"apikey":key},cache:"no-store",signal:AbortSignal.timeout(5000)
  });
  if(!response.ok)throw Error("Invalid admin");
  const u=await response.json() as {id?:string};return id(u.id||"");
 }
 return id(process.env.FINANCE_ADMIN_OPERATOR_UID||"");
}
export async function POST(req:NextRequest){
 if(!affiliateConfigured())return NextResponse.json({error:"Affiliate finance not enabled"},{status:503});
 if(!req.headers.has("authorization")&&!isSameOrigin(req))return NextResponse.json({error:"Forbidden origin"},{status:403});
 if(!(await isAuthorizedFinanceAdmin(req)))return NextResponse.json({error:"Unauthorized"},{status:401});
 const len=Number(req.headers.get("content-length")||"0");
 if(!Number.isSafeInteger(len)||len<1||len>12000)return NextResponse.json({error:"Payload too large"},{status:413});
 try{
  const f=await req.formData(),action=val(f,"action",36),admin=await actor(req);
  if(action==="save_tax"){
   const affiliate=id(val(f,"affiliate_id",36));
   const mode=val(f,"vat_mode",30);
   if(!["de_19","de_kleinunternehmer"].includes(mode))throw Error("Unsupported VAT classification");
   const legal=val(f,"legal_name",180),address=val(f,"postal_address",400),tax=val(f,"tax_number_or_vat_id",50);
   const agreement=val(f,"agreement_ref",160);
   if(legal.length<3||address.length<6||tax.length<6||agreement.length<4
      ||f.get("reviewed")!=="on"||f.get("selfbilling_agreed")!=="on")throw Error("Written and checked agreement required");
   const app=await affiliateDb("luvipro_affiliate_applications?id=eq."+affiliate+"&status=eq.approved&select=id,country&limit=1");
   const partner=(await app.json() as {id:string;country:string}[])[0];
   if(!partner||partner.country!=="DE")throw Error("Manual domestic tax review required");
   const profile={
    affiliate_id:affiliate,legal_name:legal,postal_address:address,country:"DE",
    tax_number_or_vat_id:tax,vat_mode:mode,selfbilling_agreed:true,
    selfbilling_agreement_reference:agreement,verified_by_uid:admin,
    verified_at:new Date().toISOString(),updated_at:new Date().toISOString()
   };
   await affiliateDb("luvipro_affiliate_tax_profiles?on_conflict=affiliate_id",{
    method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
    body:JSON.stringify(profile)
   });
   await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({
    action:"tax_profile_verified",entity_id:affiliate,actor_uid:admin,
    details:{vat_mode:mode,agreement_ref:agreement}
   })});
  }else if(action==="prepare"){
   const affiliate=id(val(f,"affiliate_id",36)),month=val(f,"month",10);
   if(!DATE.test(month)||!month.endsWith("-01"))throw Error("Invalid payout month");
   await affiliateDb("rpc/luvipro_affiliate_prepare_manual_payout",{method:"POST",
    body:JSON.stringify({p_affiliate:affiliate,p_month:month})});
  }else if(action==="issue_gutschrift"){
   if(f.get("terms_approved")!=="on")throw Error("Missing invoice review");
   const payout=id(val(f,"payout_id",36));
   const legal=process.env.INVOICE_SELLER_NAME||"";
   const address=[process.env.INVOICE_SELLER_STREET,process.env.INVOICE_SELLER_PLZ,process.env.INVOICE_SELLER_CITY].filter(Boolean).join(", ");
   if(legal.length<5||address.length<10||!process.env.INVOICE_SELLER_TAX_ID)throw Error("Registered company invoice data missing");
   await affiliateDb("rpc/luvipro_affiliate_issue_selfbilling",{method:"POST",
    body:JSON.stringify({p_payout:payout,p_issuer_name:legal,p_issuer_address:address})});
  }else if(action==="mark_manual_paid"){
   if(f.get("bank_transfer_done")!=="on"||f.get("evidence_checked")!=="on")
    throw Error("Manual bank evidence required");
   const payout=id(val(f,"payout_id",36)),reference=val(f,"payment_reference",200),paidOn=val(f,"paid_on",10);
   if(reference.length<5||!DATE.test(paidOn))throw Error("Invalid bank payment evidence");
   await affiliateDb("rpc/luvipro_affiliate_record_manual_transfer",{method:"POST",
    body:JSON.stringify({p_payout:payout,p_ref:reference,p_transferred_on:paidOn,p_operator:admin})});
  }else throw Error("Action not supported");
  if(req.headers.has("authorization"))return NextResponse.json({saved:true},{headers:{"Cache-Control":"no-store"}});
  return NextResponse.redirect(new URL("/intern/finanzen/affiliate?ok=1",req.url),303);
 }catch(error){
  // Never log tax numbers, bank references, partner data, or other PII.
  const message=error instanceof Error?error.message:"Internal error";
  const known=/Invalid|missing|already|required|No verified|Unsupported|not prepared|not an unpaid|No single|Duplicate|Incorrect/i.test(message);
  if(!req.headers.has("authorization"))return NextResponse.redirect(new URL("/intern/finanzen/affiliate?error=1",req.url),303);
  return NextResponse.json({error:known?"Bitte Betrag, Monatsperiode, Steuerprofil, Gutschrift und Banknachweis prüfen.":"Abrechnung konnte nicht durchgeführt werden."},{status:422,headers:{"Cache-Control":"no-store"}});
 }
}
