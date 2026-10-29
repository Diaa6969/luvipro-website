import { NextRequest,NextResponse } from "next/server";
import { AFFILIATE_COOKIE,claimExistingAffiliate } from "@/lib/affiliate/account";
import { affiliateConfigured,acceptAffiliateSubmissionRate } from "@/lib/affiliate/server";
import { isSameOrigin } from "@/lib/accounting/admin-auth";

export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(!affiliateConfigured())return NextResponse.json({error:"Partnerkonto noch nicht freigeschaltet"},{status:503});
 const n=Number(req.headers.get("content-length")||"0");
 if(!isSameOrigin(req)||n>3000||n<=0)return NextResponse.json({error:"Ungültige Anfrage"},{status:403});
 try{
  const forwarded=req.headers.get("x-vercel-forwarded-for")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
  if(!await acceptAffiliateSubmissionRate("affiliate-login:"+forwarded,20))return NextResponse.json({error:"Bitte später erneut versuchen"},{status:429});
  const f=await req.formData(),email=f.get("email"),password=f.get("password");
  if(typeof email!=="string"||!/^\S+@\S+\.\S+$/.test(email)||email.length>200||typeof password!=="string"||password.length>256||password.length<1)throw Error("Bad login");
  const base=process.env.SUPABASE_URL||"";
  const anon=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
  if(!anon)throw Error("Auth not configured");
  const response=await fetch(base+"/auth/v1/token?grant_type=password",{
    method:"POST",headers:{apikey:anon,"Content-Type":"application/json"},
    body:JSON.stringify({email:email.trim().toLowerCase(),password}),cache:"no-store",signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)throw Error("Credentials rejected");
  const tokens=await response.json() as {access_token?:string;expires_in?:number};
  if(!tokens.access_token)throw Error("No token");
  await claimExistingAffiliate(tokens.access_token);
  const next=NextResponse.redirect(new URL("/affiliate/dashboard",req.url),303);
  next.cookies.set(AFFILIATE_COOKIE,tokens.access_token,{
    httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",
    path:"/",maxAge:Math.min(3000,Math.max(60,Number(tokens.expires_in)||3000))
  });
  next.headers.set("Cache-Control","no-store");
  return next;
 }catch{
  return NextResponse.redirect(new URL("/affiliate/login?error=1",req.url),303);
 }
}
export async function DELETE(req:NextRequest){
 if(!isSameOrigin(req))return NextResponse.json({error:"Forbidden"},{status:403});
 const resp=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
 resp.cookies.set(AFFILIATE_COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
 return resp;
}
