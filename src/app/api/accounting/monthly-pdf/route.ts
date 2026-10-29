import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { isAuthorizedFinanceAdmin } from "@/lib/accounting/admin-request";
import { dbRequest, readAccountingYear } from "@/lib/accounting/database";
import { buildMonthlyTable, validYear } from "@/lib/accounting/monthly";
export const runtime="nodejs";
const euro=(n:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n/100);
const clean=(s:string)=>s.replace(/[\u0000-\u001f\u007f]/g," ").replace(/[\u2000-\u206f]/g,"-").trim();
export async function GET(req:NextRequest) {
 if(!(await isAuthorizedFinanceAdmin(req))) return NextResponse.json({error:"Unauthorized"},{status:401});
 const month=req.nextUrl.searchParams.get("month")||"";
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)||!validYear(Number(month.slice(0,4)))) return NextResponse.json({error:"Ungültiger Monat"},{status:400});
 try{
  const {outgoing,incoming}=await readAccountingYear(Number(month.slice(0,4)));
  const row=buildMonthlyTable(Number(month.slice(0,4)),outgoing,incoming).find(x=>x.month===month);
  if(!row) throw new Error("Missing month");
  const sales=outgoing.filter(x=>x.invoice_date?.startsWith(month)&&x.delivery_state!=="reserved");
  const costs=incoming.filter(x=>x.invoice_date.startsWith(month));
  let paidAffiliate:{amount_cents:number;affiliate_id:string}[]=[];
  // Affiliate payouts are shown separately, NOT automatically counted a second time
  // as operating expenses, until commission invoice reconciliation is implemented.
  try{
   const r=await dbRequest("luvipro_affiliate_payouts?select=amount_cents,affiliate_id&status=eq.paid&payout_month=eq."+month+"-01&limit=500");
   paidAffiliate=await r.json() as typeof paidAffiliate;
  }catch{ /* Optional table is not installed on legacy installations. */ }
  const doc=await PDFDocument.create();
  doc.setTitle("LUVIPRO Monatsuebersicht "+month);
  doc.setAuthor("LUVIPRO");
  doc.setSubject("Interne Buchhaltungsuebersicht - kein Steuerbescheid");
  const regular=await doc.embedFont(StandardFonts.Helvetica), bold=await doc.embedFont(StandardFonts.HelveticaBold);
  let page:PDFPage, y=0, pageNo=0;
  const width=595.28;
  function addPage(){
   page=doc.addPage([width,841.89]);pageNo++;
   page.drawRectangle({x:0,y:785,width,height:56,color:rgb(.08,.09,.15)});
   page.drawText("LUVIPRO  /  BUCHHALTUNG",{x:43,y:808,font:bold,size:17,color:rgb(1,1,1)});
   page.drawText("Seite "+pageNo,{x:490,y:808,font:regular,size:9,color:rgb(1,1,1)});
   y=754;
  }
  function txt(v:string,size=10,font:PDFFont=regular){
   if(y<65) addPage();
   // WinAnsi text only: replace characters outside latin1 to avoid PDF encoding errors.
   const safe=clean(v).replace(/[^\x20-\xFF]/g,"?").slice(0,103);
   const max=504;let line=safe;
   while(line.length>1&&font.widthOfTextAtSize(line,size)>max) line=line.slice(0,-1);
   page.drawText(line,{x:43,y,font,size,color:rgb(.12,.14,.20)});
   y-=size+9;
  }
  function title(t:string){y-=9;txt(t,13,bold);}
  addPage();
  txt("MONATSABRECHNUNG (INTERNE UEBERSICHT)",15,bold);
  txt("Zeitraum: "+month+"   Erstellt: "+new Date().toISOString().slice(0,10));
  txt("Hinweis: keine Steuererklaerung, E-Rechnung oder GoBD-Zertifizierung.",9);
  title("Monatssummen");
  txt("Ausgangsrechnungen: "+row.outgoingCount+"    Einnahmen netto: "+euro(row.revenueNet));
  txt("Umsatzsteuer Ausgang: "+euro(row.revenueVat)+"    Umsatz brutto: "+euro(row.revenueGross));
  txt("Eingangsbelege: "+row.incomingCount+"    Ausgaben brutto: "+euro(row.costsGross));
  txt("Vorsteuer manuell bestaetigt: "+euro(row.inputVatConfirmed));
  txt("Indikativer USt-Saldo: "+euro(row.vatBalance));
  txt("Vereinfachte Netto-Differenz: "+euro(row.netDifference));
  txt("Affiliate-Auszahlungen (separat): "+euro(paidAffiliate.reduce((s,x)=>s+x.amount_cents,0)));
  title("Ausgangsrechnungen");
  if(!sales.length) txt("Keine ausgestellten Rechnungen in diesem Monat.");
  else for(const inv of sales){txt([inv.invoice_date||"",inv.invoice_number,euro(inv.gross_cents||0),inv.delivery_state].join("  |  "),9);}
  title("Eingangsrechnungen");
  if(!costs.length) txt("Keine Eingangsbelege in diesem Monat.");
  else for(const cost of costs){txt([cost.invoice_date,cost.supplier_invoice_number,cost.supplier,euro(cost.gross_cents),cost.paid?"bezahlt":"offen"].join("  |  "),9);}
  title("Abgrenzung / Pruefhinweise");
  txt("Keine automatische GuV / Bilanz / UStVA. Ist-/Soll-Versteuerung,");
  txt("Anzahlungen, Wareneinsatz, AfA, Erstattungen, Bankabgleich,");
  txt("Vorsteuerrecht und Gutschriften sind steuerlich zu pruefen.");
  txt("Belege und Buchungsdaten im Original aufbewahren; PDF ersetzt sie nicht.");
  const body=await doc.save();
  return new NextResponse(new Uint8Array(body),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="LUVIPRO-Monatsabrechnung-${month}.pdf"`,"Cache-Control":"private, no-store","X-Robots-Tag":"noindex","X-Content-Type-Options":"nosniff"}});
 }catch{return NextResponse.json({error:"Buchhaltungs-PDF nicht verfügbar; Tabellen und Verknüpfungen prüfen."},{status:503,headers:{"Cache-Control":"no-store"}});}
}
