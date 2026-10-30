import "server-only";
import type { NextRequest } from "next/server";
import { affiliateDb } from "./server";
import { verifyAffiliateToken } from "./account";
/** Call only AFTER isAuthorizedFinanceAdmin. RPC bridge checks protected DB role again. */
async function protectedAdmin(id:string){
 const response=await affiliateDb("users?select=id,role&id=eq."+id+"&limit=1");const rows=await response.json() as {id:string;role:string}[];
 if(rows.length!==1||rows[0].role.toLowerCase()!=="admin")throw Error("Protected Admin role required");return id;
}
export async function financeAdminActor(req:NextRequest){
 const header=req.headers.get("authorization");
 if(header){if(!/^Bearer [A-Za-z0-9_.-]{40,4000}$/.test(header))throw Error("Invalid session");return protectedAdmin((await verifyAffiliateToken(header.slice(7))).id);}
 const id=process.env.FINANCE_ADMIN_OPERATOR_UID||"";
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error("Verified operator required");
 return protectedAdmin(id);
}
