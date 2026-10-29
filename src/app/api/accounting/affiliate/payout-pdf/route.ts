import { NextRequest,NextResponse } from "next/server";
import { PDFDocument,StandardFonts,rgb,type PDFPage } from "pdf-lib";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { affiliateDb, affiliateConfigured } from "@/lib/affiliate/server";
export const runtime="nodejs";
const money=(n:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n/100);
const safe=(s:string)=>s.replace(/[^\x20-\xFF]/g,"?").slice(0,90);
export async function GET(req:NextRequest){
 if(!(await isAuthorizedFinanceAdmin(req)))return NextResponse.json({error:"Unauthorized"},{status:401});
 const id=req.nextUrl.searchParams.get("id")||"";
 if(!affiliateConfigured()||!/^[0-9a-f-]{36}$/.test(id))return NextResponse.json({error:"Not found"},{status:404});
 try{
  const a=await affiliateDb("luvipro_affiliate_payouts?id=eq."+id+"&select=id,affiliate_id,payout_month,status,amount_cents,paid_at,payment_reference&limit=1");
  const p=(await a.json() as {id:string;affiliate_id:string;payout_month:string;status:string;amount_cents:number;paid_at:string|null;payment_reference:string|null}[])[0];
  if(!p)throw new Error("Payout not found");
  const [b,c]=await Promise.all([
   affiliateDb("luvipro_affiliate_applications?id=eq."+p.affiliate_id+"&select=company_name,contact_name,business_address,email&limit=1"),
   affiliateDb("luvipro_affiliate_commissions?payout_id=eq."+id+"&select=source_type,source_order_id,net_after_discount_cents,commission_cents,status,delivered_at&order=created_at.asc&limit=400")
  ]);
  const partner=(await b.json() as {company_name:string;contact_name:string;business_address:string;email:string}[])[0];
  const items=await c.json() as {source_type:string;source_order_id:string;net_after_discount_cents:number;commission_cents:number;status:string;delivered_at:string|null}[];
  if(!partner)throw new Error("Partner not found");
  const pdf=await PDFDocument.create();pdf.setTitle("LUVIPRO Affiliate-Abrechnung "+p.payout_month);
  const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  let page:PDFPage,y=0,index=0;
  function newPage(){page=pdf.addPage([595,842]);index++;page.drawRectangle({x:0,y:784,width:595,height:58,color:rgb(.09,.07,.19)});page.drawText("LUVIPRO  ·  PARTNERABRECHNUNG",{x:40,y:808,size:15,font:bold,color:rgb(1,1,1)});page.drawText("Seite "+index,{x:504,y:810,size:9,font,color:rgb(1,1,1)});y=762;}
  function line(s:string,size=9){if(y<62)newPage();let t=safe(s);while(t.length>1&&font.widthOfTextAtSize(t,size)>520)t=t.slice(0,-1);page.drawText(t,{x:42,y,size,font,color:rgb(.10,.12,.19)});y-=size+13;}
  newPage();line("Monat: "+p.payout_month+"  /  Abrechnungsstatus: "+p.status,11);line("Partner: "+partner.company_name);line("Ansprechpartner: "+partner.contact_name);line("Adresse: "+partner.business_address);line("Kontakt: "+partner.email);
  line("Auszahlung: "+money(p.amount_cents),12);line("Gezahlt am: "+(p.paid_at||"Nicht bezahlt"));line("Bankreferenz: "+(p.payment_reference||"-"));
  y-=14;line("Nachgewiesene Transaktionen (keine Steuerrechnung):",11);
  if(items.length===0)line("Keine zugeordneten Transaktionen.");
  else items.forEach(c=>line(c.source_type+" / "+c.source_order_id+" / "+money(c.net_after_discount_cents)+" / Provision "+money(c.commission_cents)+" / "+c.status));
  y-=12;line("LUVIPRO interner Abrechnungsbeleg. Nicht automatisch eine steuerliche Rechnung.");
  line("Steuerliche Behandlung und erforderliche Provisionsrechnung gesondert prüfen.");
  const bytes=await pdf.save();
  return new NextResponse(new Uint8Array(bytes),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment;filename="LUVIPRO-Affiliate-${p.payout_month}-${id}.pdf"`,"Cache-Control":"private,no-store","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex"}});
 }catch{return NextResponse.json({error:"Abrechnung nicht verfügbar"},{status:404});}
}
