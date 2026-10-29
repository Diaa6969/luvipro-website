import {randomUUID} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {isAccountingRequestAuthorized,isSameOrigin} from "@/lib/accounting/admin-auth";
import {dbRequest,storePrivateExpenseFile} from "@/lib/accounting/database";
import {monthOf,safeVatSplit} from "@/lib/accounting/monthly";
export const runtime="nodejs";
const categories=new Set(["other_sales","other_operating_cost","bank_fee","tax","refund","capital","loan","loan_repayment","asset","affiliate","transfer","other"]);
function field(f:FormData,key:string,max:number,required=false){
 const v=f.get(key); if(typeof v!=="string"||v.length>max||/[\r\n]/.test(v)||(required&&!v.trim())) throw new Error("Ungültiges Feld");return v.trim();
}
export async function POST(req:NextRequest){
 if(!isAccountingRequestAuthorized(req))return NextResponse.json({error:"Nicht autorisiert"},{status:401});
 const n=Number(req.headers.get("content-length")||"0");
 if(!isSameOrigin(req)||!Number.isSafeInteger(n)||n<1||n>5500000)return NextResponse.json({error:"Ungültige Anfrage"},{status:403});
 try{
  const f=await req.formData(),event_date=field(f,"eventDate",10,true);
  if(!monthOf(event_date)||event_date>new Date().toISOString().slice(0,10))throw new Error("Invalid date");
  const direction=field(f,"direction",3,true),category=field(f,"category",30,true);
  if(!["in","out"].includes(direction)||!categories.has(category))throw new Error("Invalid category");
  const description=field(f,"description",500,true);
  if(description.length<3)throw new Error("Description");
  const counterparty=field(f,"counterparty",160),payment_reference=field(f,"reference",160);
  const text=field(f,"gross",16,true).replace(",",".");
  if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(text))throw new Error("Invalid amount");
  const [euros,fract=""]=text.split(".");
  const gross=Number(euros)*100+Number(fract.padEnd(2,"0"));
  if(gross<1||gross>100000000000||!Number.isSafeInteger(gross))throw new Error("Amount");
  const rate=Number(field(f,"vatRate",2,true));
  if(rate!==0&&rate!==7&&rate!==19)throw new Error("VAT");
  const split=safeVatSplit(gross,rate);
  // Preserve the original receipt securely. Never store bytes as a public URL.
  let document_path:string|null=null;
  const receipt=f.get("receipt");
  if(receipt instanceof File && receipt.size){
   if(receipt.size>5*1024*1024||receipt.size<32)throw new Error("Document size");
   const b=Buffer.from(await receipt.arrayBuffer());
   const pdf=b.subarray(0,5).toString("ascii")==="%PDF-";
   const png=b.subarray(0,8).toString("hex")==="89504e470d0a1a0a";
   const jpg=b.subarray(0,3).toString("hex")==="ffd8ff";
   if(!pdf&&!png&&!jpg)throw new Error("Unsupported document");
   const ext=pdf?"pdf":png?"png":"jpg";
   document_path=randomUUID()+"."+ext;
   await storePrivateExpenseFile(document_path,b,pdf?"application/pdf":png?"image/png":"image/jpeg");
  }
  const r=await dbRequest("luvipro_billing_cash_events?select=id",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({event_date,direction,category,description,counterparty,payment_reference,gross_cents:split.grossCents,net_cents:split.netCents,vat_cents:split.vatCents,vat_rate:rate,document_path})});
  const data=await r.json() as {id:string}[];
  if(data.length!==1)throw new Error("Unexpected response");
  return NextResponse.json({saved:true},{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Vorgang konnte nicht gespeichert werden. Angaben, Beleg und DB-Verbindung prüfen."},{status:422});}
}
