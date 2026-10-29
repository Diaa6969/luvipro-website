import { NextRequest, NextResponse } from "next/server";
import { affiliateDb, affiliateConfigured } from "@/lib/affiliate/server";
export const runtime="nodejs";
/**
 * Link an already APPROVED Gewerbe application to the exact verified
 * Supabase Auth email owner. No user_metadata / users.role used.
 * No automatic partner approval or code issuance occurs here.
 */
export async function POST(req:NextRequest){
 if(!affiliateConfigured())return NextResponse.json({error:"Not enabled"},{status:503});
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9_.-]{40,4000}$/.test(bearer))return NextResponse.json({error:"Login required"},{status:401});
 const host=process.env.SUPABASE_URL||"";
 const apiKey=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(host)||!apiKey)return NextResponse.json({error:"Not configured"},{status:503});
 try{
  const userResponse=await fetch(host+"/auth/v1/user",{headers:{apikey:apiKey,Authorization:bearer},cache:"no-store",signal:AbortSignal.timeout(6000)});
  if(!userResponse.ok)return NextResponse.json({error:"Invalid login"},{status:401});
  const user=await userResponse.json() as {id?:string;email?:string;email_confirmed_at?:string|null};
  if(!user.id||!user.email||!user.email_confirmed_at||!/^[0-9a-f-]{36}$/i.test(user.id))return NextResponse.json({error:"Verified email required"},{status:403});
  const email=user.email.toLowerCase().trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return NextResponse.json({error:"Invalid email"},{status:400});
  const response=await affiliateDb("luvipro_affiliate_applications?select=id,owner_uid&status=eq.approved&email=eq."+encodeURIComponent(email)+"&limit=3");
  const apps=await response.json() as {id:string;owner_uid:string|null}[];
  if(apps.length!==1)return NextResponse.json({error:"No unique approved application for the authenticated email"},{status:404});
  if(apps[0].owner_uid===user.id)return NextResponse.json({linked:true});
  if(apps[0].owner_uid)return NextResponse.json({error:"Already linked"},{status:409});
  const updated=await affiliateDb("luvipro_affiliate_applications?id=eq."+apps[0].id+"&owner_uid=is.null&status=eq.approved&select=id",{method:"PATCH",headers:{Prefer:"return=representation"},body:JSON.stringify({owner_uid:user.id,updated_at:new Date().toISOString()})});
  const rows=await updated.json() as {id:string}[];
  if(rows.length!==1)return NextResponse.json({error:"Link conflict"},{status:409});
  await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({action:"partner_account_linked",entity_id:apps[0].id,actor_uid:user.id,details:{method:"verified_supabase_auth_email"}})});
  return NextResponse.json({linked:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Link service unavailable"},{status:503});}
}
