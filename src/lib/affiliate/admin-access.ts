import "server-only";
import type { NextRequest } from "next/server";
import { isAccountingAdmin,isAccountingRequestAuthorized } from "@/lib/accounting/admin-auth";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { AFFILIATE_COOKIE,affiliateCurrentSession } from "./account";
import { affiliateAdminActorFromToken } from "./admin-actor";
/** Existing protected Supabase Admin identity, scoped to Affiliate pages/routes only. */
export async function isAuthorizedAffiliateAdmin(req:NextRequest):Promise<boolean>{
 if(req.headers.has("authorization"))return isAuthorizedFinanceAdmin(req);
 if(isAccountingRequestAuthorized(req))return true;
 const token=req.cookies.get(AFFILIATE_COOKIE)?.value;
 if(!token)return false;
 try{await affiliateAdminActorFromToken(token);return true;}catch{return false;}
}
export async function isAffiliatePageAdmin():Promise<boolean>{
 if(await isAccountingAdmin())return true;
 const token=await affiliateCurrentSession();
 if(!token)return false;
 try{await affiliateAdminActorFromToken(token);return true;}catch{return false;}
}
