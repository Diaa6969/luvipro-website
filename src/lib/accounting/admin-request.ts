import "server-only";
import type { NextRequest } from "next/server";
import { isAccountingRequestAuthorized } from "./admin-auth";
/**
 * Shared authorization for website administrator (httpOnly cookie) and FlutterFlow
 * administrator (Supabase access token). Never trust a client-supplied user.role.
 */
export async function isAuthorizedFinanceAdmin(req:NextRequest):Promise<boolean> {
 // When Authorization is supplied, verify it INSTEAD of falling back to cookies.
 // Prevent a forged bearer string from bypassing browser same-origin checks.
 if(!req.headers.has("authorization")) return isAccountingRequestAuthorized(req);
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [a-zA-Z0-9_.-]{40,4000}$/.test(bearer)) return false;
 const host=process.env.SUPABASE_URL||"";
 const apikey=process.env.SUPABASE_ANON_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"";
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(host)||!apikey) return false;
 try {
  const r=await fetch(host+"/rest/v1/rpc/is_admin",{method:"POST",headers:{"Authorization":bearer,"apikey":apikey,"Content-Type":"application/json"},body:"{}",cache:"no-store",signal:AbortSignal.timeout(5000)});
  return r.ok && (await r.json())===true;
 }catch{return false;}
}
