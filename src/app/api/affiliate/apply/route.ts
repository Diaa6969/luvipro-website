import { NextRequest, NextResponse } from "next/server";
import { affiliateConfigured, affiliateDb, acceptAffiliateSubmissionRate, deleteRegistration, registrationFileName, uploadRegistration } from "@/lib/affiliate/server";
import { isSameOrigin } from "@/lib/accounting/admin-auth";
export const runtime="nodejs";
const max=5*1024*1024;
function get(f:FormData,k:string,n:number,required=false) {
 const v=f.get(k);if(typeof v!=="string" || v.trim().length>n || (required&&!v.trim()) || /[\r\n]/.test(v)) throw new Error("Invalid field "+k);return v.trim();
}
export async function POST(req:NextRequest) {
 if(!affiliateConfigured()) return NextResponse.json({error:"Das Bewerbungsformular ist derzeit nicht freigeschaltet."},{status:503});
 const length=Number(req.headers.get("content-length")||"0");
 if(!isSameOrigin(req)||!req.headers.get("content-type")?.startsWith("multipart/form-data")||!Number.isFinite(length)||length<=0||length>max+100000) return NextResponse.json({error:"Ungültige Anfrage."},{status:403});
 let path="";
 try {
  const ip = req.headers.get("x-vercel-forwarded-for") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  if(!(await acceptAffiliateSubmissionRate(ip)))return NextResponse.json({error:"Zu viele Bewerbungen. Bitte später erneut versuchen."},{status:429});
  const f=await req.formData();
  if(get(f,"website_check",200)) throw new Error("Invalid request");
  if(f.get("privacy")!=="on"||f.get("terms")!=="on") throw new Error("Consent required");
  const company_name=get(f,"company",160,true),contact_name=get(f,"contact",160,true);
  const email=get(f,"email",200,true).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email");
  const phone=get(f,"phone",60),country=get(f,"country",6,true);
  if(!["DE","AT","CH","NL","FR","PL"].includes(country)) throw new Error("Unsupported country");
  const business_address=get(f,"address",300,true),website=get(f,"social",300);
  const marketing_plan=get(f,"marketing",1600);
  const upload=f.get("registration");
  if(!(upload instanceof File)||upload.size<32||upload.size>max) throw new Error("Invalid proof");
  const bytes=Buffer.from(await upload.arrayBuffer());
  const pdf=bytes.subarray(0,5).toString("ascii")==="%PDF-";
  const png=bytes.subarray(0,8).toString("hex")==="89504e470d0a1a0a";
  const jpg=bytes.subarray(0,3).toString("hex")==="ffd8ff";
  if(!pdf&&!png&&!jpg) throw new Error("Unsupported file");
  const ext=pdf?"pdf":png?"png":"jpg", mime=pdf?"application/pdf":png?"image/png":"image/jpeg";
  path=registrationFileName(ext);
  await uploadRegistration(path,bytes,mime);
  await affiliateDb("luvipro_affiliate_applications",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({company_name,contact_name,email,phone,country,business_address,website,marketing_plan,registration_path:path})});
  return NextResponse.redirect(new URL("/affiliate?submitted=1",req.url),303);
 } catch {
  if(path) await deleteRegistration(path);
  return NextResponse.json({error:"Die Bewerbung konnte nicht gespeichert werden. Prüfen Sie die Eingaben und senden Sie sie nicht mehrfach. Kontakt: info@luvipro.de"},{status:422,headers:{"Cache-Control":"no-store"}});
 }
}
