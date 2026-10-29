import "server-only";
import { randomUUID, createHmac } from "node:crypto";
export function affiliateConfigured() {
 return process.env.AFFILIATE_APPLICATIONS_ENABLED === "true" && !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY && (process.env.AFFILIATE_RATE_SECRET?.length || 0)>=32;
}
function env() {
 const host = process.env.SUPABASE_URL || "";
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
 if(!affiliateConfigured() || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(host)) throw new Error("Affiliate backend disabled");
 return {host,key};
}
export async function affiliateDb(path:string, init:RequestInit={}) {
 const {host,key}=env();
 const r=await fetch(host+"/rest/v1/"+path,{...init,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...init.headers},cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!r.ok) throw new Error("Affiliate database failed: "+r.status);
 return r;
}
export async function acceptAffiliateSubmissionRate(ip:string) {
 const secret=process.env.AFFILIATE_RATE_SECRET;
 if(!secret||secret.length<32)throw new Error("Rate control disabled");
 const key=createHmac("sha256",secret).update(ip.trim().slice(0,110)).digest("hex");
 const response=await affiliateDb("rpc/luvipro_affiliate_take_rate",{method:"POST",body:JSON.stringify({p_key:key,p_limit:5})});
 return (await response.json())===true;
}
export function registrationFileName(ext:"pdf"|"png"|"jpg") {return randomUUID()+"."+ext;}
export async function uploadRegistration(path:string,data:Buffer,mime:string) {
 const {host,key}=env();
 const r=await fetch(host+"/storage/v1/object/luvipro-affiliate-docs/"+path,{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":mime,"x-upsert":"false"},body:new Uint8Array(data),signal:AbortSignal.timeout(20000)});
 if(!r.ok) throw new Error("Secure document upload failed");
}
export async function deleteRegistration(path:string) {
 const {host,key}=env();
 await fetch(host+"/storage/v1/object/luvipro-affiliate-docs/"+path,{method:"DELETE",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},signal:AbortSignal.timeout(12000)}).catch(()=>{});
}
