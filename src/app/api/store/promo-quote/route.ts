import { NextRequest,NextResponse } from "next/server";
import { AFFILIATE_COOKIE,verifyAffiliateToken } from "@/lib/affiliate/account";
import { isSameOrigin } from "@/lib/accounting/admin-auth";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!isSameOrigin(req))return NextResponse.json({error:"Forbidden origin"},{status:403});
 const token=req.cookies.get(AFFILIATE_COOKIE)?.value;
 if(!token)return NextResponse.json({error:"Bitte zuerst mit Ihrem bestehenden LUVIPRO-Konto anmelden.",login:"/affiliate/login"},{status:401});
 const size=Number(req.headers.get("content-length")||0);if(!Number.isSafeInteger(size)||size<1||size>8192)return NextResponse.json({error:"Invalid payload"},{status:413});
 try{
  await verifyAffiliateToken(token);const p=await req.json();
  if(!["device","inspection_standard","inspection_premium"].includes(p.product)||!Number.isInteger(p.quantity)||typeof p.code!=="string"||p.code.length>32)throw Error("Invalid quote");
  const response=await fetch(process.env.SUPABASE_URL+"/rest/v1/rpc/luvipro_promo_quote_v1",{method:"POST",headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY!,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({p_product:p.product,p_quantity:p.quantity,p_code:p.code,p_partner:p.partnerUid||null}),cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error("Quote not eligible");
  return NextResponse.json(await response.json(),{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Code nicht verfügbar, abgelaufen oder für diese Bestellung nicht berechtigt. Bitte Angaben und Konto prüfen."},{status:422,headers:{"Cache-Control":"no-store"}});}
}
