import { NextRequest, NextResponse } from "next/server";
import { isAccountingRequestAuthorized } from "@/lib/accounting/admin-auth";
import { affiliateDb, affiliateConfigured } from "@/lib/affiliate/server";
export const runtime="nodejs";
export async function GET(req:NextRequest) {
 if(!isAccountingRequestAuthorized(req)) return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=req.nextUrl.searchParams.get("id")||"";
 if(!affiliateConfigured()||!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({error:"Not found"},{status:404});
 try{
  const r=await affiliateDb("luvipro_affiliate_applications?id=eq."+id+"&select=registration_path&limit=1");
  const rows=await r.json() as {registration_path:string}[];
  const path=rows[0]?.registration_path;
  if(!path||!/^[0-9a-f-]{36}\.(pdf|png|jpg)$/.test(path)) throw new Error("Invalid path");
  const base=process.env.SUPABASE_URL!,key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const file=await fetch(base+"/storage/v1/object/authenticated/luvipro-affiliate-docs/"+path,{headers:{apikey:key,Authorization:"Bearer "+key},cache:"no-store",signal:AbortSignal.timeout(15000)});
  if(!file.ok) throw new Error("Unavailable");
  const body=Buffer.from(await file.arrayBuffer());if(body.length>5*1024*1024) throw new Error("Too large");
  const type=path.endsWith(".pdf")?"application/pdf":path.endsWith(".png")?"image/png":"image/jpeg";
  return new NextResponse(new Uint8Array(body),{headers:{"Content-Type":type,"Content-Disposition":`attachment; filename="Gewerbenachweis-${id}.${path.split(".").pop()}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex"}});
 }catch{return NextResponse.json({error:"Dokument nicht verfügbar"},{status:404});}
}
