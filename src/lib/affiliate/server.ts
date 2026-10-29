import "server-only";
import { randomUUID } from "node:crypto";
export function affiliateConfigured() {
 return process.env.AFFILIATE_APPLICATIONS_ENABLED === "true" && !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
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
export function registrationFileName(ext:"pdf"|"png"|"jpg") {return randomUUID()+"."+ext;}
export async function uploadRegistration(path:string,data:Buffer,mime:string) {
 const {host,key}=env();
 const r=await fetch(host+"/storage/v1/object/luvipro-affiliate-docs/"+path,{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":mime,"x-upsert":"false"},body:new Uint8Array(data),signal:AbortSignal.timeout(20000)});
 if(!r.ok) throw new Error("Secure document upload failed");
}
export async function deleteRegistration(path:string) {
 const {host,key}=env();
 await fetch(host+"/storage/v1/object/luvipro-affiliate-docs",{method:"DELETE",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({prefixes:[path]}),signal:AbortSignal.timeout(12000)}).catch(()=>{});
}
