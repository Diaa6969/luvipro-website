import {NextRequest,NextResponse} from "next/server";
import {AFFILIATE_COOKIE,verifyAffiliateToken} from "@/lib/affiliate/account";
import {isSameOrigin} from "@/lib/accounting/admin-auth";
import {isAuthorizedAffiliateAdmin} from "@/lib/affiliate/admin-access";
export const runtime="nodejs";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function call(req:NextRequest,write:boolean){
 const token=req.cookies.get(AFFILIATE_COOKIE)?.value;
 if(!token)return NextResponse.json({error:"Bitte mit Ihrem bestehenden LUVIPRO-Konto anmelden.",login:"/affiliate/login"},{status:401});
 if(write&&!isSameOrigin(req))return NextResponse.json({error:"Forbidden origin"},{status:403});
 try{
  await verifyAffiliateToken(token);let rpc="luvipro_checkout_history_v1",params:Record<string,unknown>={p_offset:0};
  if(!write){const offset=Number(req.nextUrl.searchParams.get("offset")||0);if(!Number.isInteger(offset)||offset<0||offset>100000)throw Error("Invalid page");params={p_offset:offset};
   if(req.nextUrl.searchParams.get("kind")==="partners"){rpc="luvipro_checkout_partners_v1";params.p_search=(req.nextUrl.searchParams.get("search")||"").slice(0,100);}
   if(req.nextUrl.searchParams.get("kind")==="admin_orders"){if(!await isAuthorizedAffiliateAdmin(req))return NextResponse.json({error:"Admin required"},{status:403});rpc="luvipro_promo_orders_admin_v1";}
  }else{
   const n=Number(req.headers.get("content-length")||0);if(!Number.isSafeInteger(n)||n<1||n>12000)return NextResponse.json({error:"Ungültige Größe"},{status:413});
   const p=await req.json();
   if(p.action==="cancel"){if(!uuid.test(p.orderId)||typeof p.reason!=="string")throw Error("Invalid cancellation");rpc="luvipro_checkout_cancel_v1";params={p_order:p.orderId,p_reason:p.reason};}
   else if(p.action==="refund"){
    if(!await isAuthorizedAffiliateAdmin(req))return NextResponse.json({error:"Admin required"},{status:403});
    if(!uuid.test(p.orderId)||p.confirmed!==true)throw Error("External refund confirmation required");
    rpc="luvipro_checkout_refund_v1";params={p_order:p.orderId,p_date:p.date,p_reference:p.reference,p_reason:p.reason,p_external_refund_confirmed:p.confirmed};
   }else{
    if(p.action!=="create"||!uuid.test(p.quoteId)||!uuid.test(p.requestKey)||!p.billing||typeof p.billing!=="object")throw Error("Invalid checkout");
    rpc="luvipro_checkout_order_v1";params={p_quote:p.quoteId,p_request:p.requestKey,p_billing:p.billing};
   }
  }
  const response=await fetch(process.env.SUPABASE_URL+"/rest/v1/rpc/"+rpc,{method:"POST",headers:{apikey:process.env.SUPABASE_ANON_KEY!,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify(params),cache:"no-store",signal:AbortSignal.timeout(20000)});
  if(!response.ok)return NextResponse.json({error:"Aktion nicht ausgeführt. Preisbindung, Partner, Berechtigung und bisherigen Status prüfen. Bereits abgerechnete Erstattungen benötigen eine geprüfte Korrekturabrechnung."},{status:422});
  return NextResponse.json(await response.json(),{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Aktion nicht ausgeführt. Bitte anmelden, Angaben prüfen und Preis bei Bedarf erneut berechnen lassen."},{status:422,headers:{"Cache-Control":"no-store"}});}
}
export async function GET(req:NextRequest){return call(req,false);}
export async function POST(req:NextRequest){return call(req,true);}
