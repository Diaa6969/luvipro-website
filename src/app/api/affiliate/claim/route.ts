import { NextRequest,NextResponse } from "next/server";
import { claimExistingAffiliate } from "@/lib/affiliate/account";
import { affiliateConfigured } from "@/lib/affiliate/server";
export const runtime="nodejs";
/** Link the same signed-in Supabase account – customer OR partner workshop.
 * Existing role is never replaced or promoted; only approved Gewerbe gets affiliate.
 */
export async function POST(req:NextRequest){
 if(!affiliateConfigured())return NextResponse.json({error:"Not enabled"},{status:503});
 const bearer=req.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9_.-]{40,4000}$/.test(bearer))return NextResponse.json({error:"Login required"},{status:401});
 try{
  const owner=await claimExistingAffiliate(bearer.slice(7));
  return NextResponse.json({linked:true,affiliate_id:owner.id},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({error:"No approved Gewerbe application linked to this user"},{status:403,headers:{"Cache-Control":"no-store"}});
 }
}
