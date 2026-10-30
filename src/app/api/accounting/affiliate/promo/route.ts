import { NextRequest,NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/accounting/admin-auth";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { financeAdminActor } from "@/lib/affiliate/admin-actor";
import { affiliateDb } from "@/lib/affiliate/server";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!isSameOrigin(req))return NextResponse.json({error:"Forbidden origin"},{status:403});
 if(!await isAuthorizedFinanceAdmin(req))return NextResponse.json({error:"Unauthorized"},{status:401});
 const len=Number(req.headers.get("content-length")||0);if(!Number.isSafeInteger(len)||len<1||len>12000)return NextResponse.json({error:"Invalid size"},{status:413});
 try{const actor=await financeAdminActor(req);const body=await req.json();
  if(!body||typeof body!=="object"||!Array.isArray(body.rules)||body.rules.length>3||body.code?.evidence_checked!==true)throw Error("Invalid terms");
  const response=await affiliateDb("rpc/luvipro_promo_admin_dispatch_v1",{method:"POST",body:JSON.stringify({p_actor:actor,p_action:"save_code",p_payload:{id:body.id,version:body.version,code:body.code,rules:body.rules}})});
  return NextResponse.json({saved:true,id:await response.json()},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Nicht gespeichert. Bedingungen, Nachweise, Produktregeln oder veralteten Stand prüfen und neu laden."},{status:422,headers:{"Cache-Control":"no-store"}});}
}
