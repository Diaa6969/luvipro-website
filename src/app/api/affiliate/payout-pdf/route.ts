import { NextRequest,NextResponse } from "next/server";
import { PDFDocument,StandardFonts,rgb } from "pdf-lib";
import { affiliateCurrentSession,claimExistingAffiliate } from "@/lib/affiliate/account";
import { affiliateDb } from "@/lib/affiliate/server";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const token=await affiliateCurrentSession();
 if(!token)return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=req.nextUrl.searchParams.get("id")||"";
 if(!/^[0-9a-f-]{36}$/.test(id))return NextResponse.json({error:"Invalid reference"},{status:400});
 try{
  const affiliate=await claimExistingAffiliate(token);
  const p=await affiliateDb("luvipro_affiliate_payouts?id=eq."+id+"&affiliate_id=eq."+affiliate.id+"&status=eq.paid&select=id,payout_month,amount_cents,paid_at,payment_reference&limit=1");
  const rows=await p.json() as {id:string;payout_month:string;amount_cents:number;paid_at:string;payment_reference:string}[];
  if(rows.length!==1)return NextResponse.json({error:"Not found"},{status:404});
  const item=rows[0];
  const transactions=await affiliateDb("luvipro_affiliate_commissions?affiliate_id=eq."+affiliate.id+"&payout_id=eq."+id+"&select=source_order_id,commission_cents&limit=400");
  const tx=await transactions.json() as {source_order_id:string;commission_cents:number}[];
  const euro=(c:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(c/100);
  const pdf=await PDFDocument.create();
  pdf.setTitle("LUVIPRO Affiliate-Abrechnung "+item.payout_month);
  const pg=pdf.addPage([595,842]),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  pg.drawRectangle({x:0,y:782,width:595,height:60,color:rgb(.10,.07,.20)});
  pg.drawText("LUVIPRO · AFFILIATE-ABRECHNUNG",{x:45,y:808,size:16,font:bold,color:rgb(1,1,1)});
  const texts=[
   "Monat: "+item.payout_month,
   "Unternehmen: "+affiliate.company_name,
   "Ansprechpartner: "+affiliate.contact_name,
   "Ausgezahlt: "+euro(item.amount_cents),
   "Zahlungsdatum: "+item.paid_at?.slice(0,10),
   "Verwendungszweck: "+item.payment_reference,
   "Abgerechnete Auftraege: "+tx.length,
   "Einzelne Provisionen:"
  ];
  let y=742;
  function line(raw:string){const clean=raw.replace(/[^\x20-\xFF]/g,"?").slice(0,105);pg.drawText(clean,{x:45,y,size:10,font,color:rgb(.14,.16,.23)});y-=27;}
  texts.forEach(line);
  for(const entry of tx.slice(0,14))line(entry.source_order_id.slice(0,45)+" / "+euro(entry.commission_cents));
  line("Interner Zahlungsnachweis – keine steuerliche Rechnung / Gutschrift.");
  const bytes=await pdf.save();
  return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="LUVIPRO-Affiliate-${item.payout_month}.pdf"`,"Cache-Control":"no-store, private","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex"}});
 }catch{return NextResponse.json({error:"Auszahlungsbeleg nicht verfügbar"},{status:503});}
}
