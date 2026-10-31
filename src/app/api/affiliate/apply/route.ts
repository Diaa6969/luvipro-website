import { NextRequest, NextResponse } from "next/server";
import { affiliateTermsVersion } from "@/lib/affiliate/terms";
import { affiliateConfigured } from "@/lib/affiliate/server";
import { AFFILIATE_COOKIE, verifyAffiliateToken } from "@/lib/affiliate/account";
import { isSameOrigin } from "@/lib/accounting/admin-auth";
export const runtime="nodejs";
export async function POST(req:NextRequest) {
 if(!affiliateConfigured())return NextResponse.json({error:"Bewerbung derzeit nicht freigeschaltet."},{status:503});
 if(!isSameOrigin(req))return NextResponse.json({error:"Forbidden origin"},{status:403});
 const token=req.cookies.get(AFFILIATE_COOKIE)?.value;
 if(!token)return NextResponse.json({error:"Bitte zuerst mit Ihrem bestehenden LUVIPRO-Konto anmelden. Kein zweites Konto anlegen.",login:"/affiliate/login"},{status:401});
 const length=Number(req.headers.get("content-length")||"0");
 if(!Number.isSafeInteger(length)||length<1||length>5*1024*1024+65536||!req.headers.get("content-type")?.startsWith("multipart/form-data"))return NextResponse.json({error:"Ungültige Dateigröße."},{status:413});
 try{
  await verifyAffiliateToken(token);
  const source=await req.formData();
  if(source.get("website_check")||source.get("privacy")!=="on"||source.get("terms")!=="on"||source.get("terms_version")!==affiliateTermsVersion)throw Error("Consent required");
  const body=new FormData();
  for(const [target,key] of Object.entries({company_name:"company",contact_name:"contact",business_address:"address",phone:"phone",website:"social",marketing_plan:"marketing",country:"country"})){
   const value=source.get(key);if(typeof value!=="string")throw Error("Invalid field");body.set(target,value);
  }
  const file=source.get("registration");if(!(file instanceof File)||file.size<32||file.size>5*1024*1024)throw Error("Invalid proof");
  body.set("registration",file);body.set("terms_version",affiliateTermsVersion);body.set("terms_accepted","true");body.set("privacy_accepted","true");
  const response=await fetch(process.env.SUPABASE_URL+"/functions/v1/affiliate-program-v1",{method:"POST",headers:{Authorization:"Bearer "+token,apikey:process.env.SUPABASE_SERVICE_ROLE_KEY!},body,cache:"no-store",signal:AbortSignal.timeout(60000)});
  if(!response.ok)throw Error("Application not saved");
  return NextResponse.redirect(new URL("/affiliate/dashboard",req.url),303);
 }catch{return NextResponse.json({error:"Nicht gespeichert. Sitzung, Angaben und Nachweis prüfen. Kein zweites Konto anlegen."},{status:422,headers:{"Cache-Control":"no-store"}});}
}
