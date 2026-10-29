import "server-only";
import { cookies } from "next/headers";
import { affiliateDb, affiliateConfigured } from "./server";

export const AFFILIATE_COOKIE = "luvipro_affiliate_session";
type AuthUser = {id:string;email:string;email_confirmed_at?:string|null};
export type AffiliateOwner = {id:string;owner_uid:string|null;company_name:string;contact_name:string;status:string;email:string};
function hostAndKey(){
 const base=process.env.SUPABASE_URL||"";
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
 if(!affiliateConfigured() || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(base) || !key)throw new Error("Affiliate account disabled");
 return {base,key};
}
export async function verifyAffiliateToken(token:string):Promise<AuthUser>{
 const {base,key}=hostAndKey();
 if(!/^[A-Za-z0-9_.-]{40,4000}$/.test(token))throw new Error("Invalid session");
 const response=await fetch(base+"/auth/v1/user",{
   headers:{apikey:key,Authorization:"Bearer "+token},cache:"no-store",signal:AbortSignal.timeout(6000)
 });
 if(!response.ok)throw new Error("Session not valid");
 const user=await response.json() as AuthUser;
 if(!user.id||!user.email||!user.email_confirmed_at||!/^[0-9a-f-]{36}$/i.test(user.id))throw new Error("Confirmed email required");
 return {...user,email:user.email.trim().toLowerCase()};
}
/** Uses the SAME Supabase Auth UID as an existing regular or workshop user.
 * Does not modify users.role or create an additional user.
 * The verified email must EXACTLY match ONE approved Gewerbe application.
 */
export async function claimExistingAffiliate(token:string):Promise<AffiliateOwner>{
 const user=await verifyAffiliateToken(token);
 const matches=await affiliateDb("luvipro_affiliate_applications?select=id,owner_uid,company_name,contact_name,email,status&status=eq.approved&email=eq."+encodeURIComponent(user.email)+"&limit=2");
 const rows=await matches.json() as AffiliateOwner[];
 if(rows.length!==1)throw new Error("No single approved application for this email");
 const partner=rows[0];
 if(partner.owner_uid && partner.owner_uid!==user.id)throw new Error("Application already linked to another account");
 // Linking is explicit only when logged-in user opens the affiliate account.
 if(!partner.owner_uid){
  const claim=await affiliateDb("luvipro_affiliate_applications?select=id&id=eq."+partner.id+"&owner_uid=is.null&status=eq.approved",{
    method:"PATCH",headers:{Prefer:"return=representation"},
    body:JSON.stringify({owner_uid:user.id,updated_at:new Date().toISOString()})
  });
  const changed=await claim.json() as {id:string}[];
  if(changed.length!==1)throw new Error("Link conflict: contact support");
  partner.owner_uid=user.id;
  await affiliateDb("luvipro_affiliate_audit",{method:"POST",body:JSON.stringify({
   action:"partner_account_linked",entity_id:partner.id,actor_uid:user.id,
   details:{method:"existing_user_confirmed_email"}
  })});
 }
 return partner;
}
export async function affiliateCurrentSession(){
 const store=await cookies();
 const token=store.get(AFFILIATE_COOKIE)?.value;
 return token||null;
}
export async function affiliateAccountSummary(token:string){
 const owner=await claimExistingAffiliate(token);
 const id=owner.id;
 const [c,comm,p]=await Promise.all([
  affiliateDb("luvipro_discount_codes?affiliate_id=eq."+id+"&select=id,code,discount_bps,commission_bps,valid_from,valid_until,usage_limit,redemption_count,active&order=valid_from.desc&limit=100"),
  affiliateDb("luvipro_affiliate_commissions?affiliate_id=eq."+id+"&select=id,status,commission_cents,created_at,verified_paid_at,delivered_at&order=created_at.desc&limit=500"),
  affiliateDb("luvipro_affiliate_payouts?affiliate_id=eq."+id+"&select=id,payout_month,status,amount_cents,paid_at&order=payout_month.desc&limit=100")
 ]);
 const codes=await c.json() as {id:string;code:string;discount_bps:number;commission_bps:number;valid_from:string;valid_until:string;usage_limit:number|null;redemption_count:number;active:boolean}[];
 const commissions=await comm.json() as {id:string;status:string;commission_cents:number;created_at:string;verified_paid_at:string|null;delivered_at:string|null}[];
 const payouts=await p.json() as {id:string;payout_month:string;status:string;amount_cents:number;paid_at:string|null}[];
 const sum=(status:string)=>commissions.filter(c=>c.status===status).reduce((total,c)=>total+c.commission_cents,0);
 return {owner,codes,commissions,payouts,
  totals:{pending:sum("pending"),eligible:sum("eligible"),paid:sum("paid"),payoutsPaid:payouts.filter(p=>p.status==="paid").reduce((t,p)=>t+p.amount_cents,0)}
 };
}
