import { PDFDocument, rgb, type PDFFont, type PDFPage } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { regularFont, boldFont } from "./fonts.ts";
import { buildMonthlyTable, validYear, type IncomingInvoice, type OutgoingInvoice } from "./monthly.ts";
const euro=(n:number)=>new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n/100);
const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
  ? value.split("-").reverse().join(".") : value;
const appOrigins = new Set([
 "https://ff-debug-service-frontend-free-ygxkweukma-uc.a.run.app",
]);
function cors(req: Request): Record<string,string> {
 const origin = req.headers.get("origin");
 return origin && appOrigins.has(origin)
  ? {"Access-Control-Allow-Origin": origin, "Vary": "Origin"}
  : {"Vary": "Origin"};
}

Deno.serve(async (req) => {
 const headers = {...cors(req), "Cache-Control":"no-store"};
 const origin = req.headers.get("origin");
 if (origin && !appOrigins.has(origin)) return new Response(null,{status:403,headers});
 if(req.method==="OPTIONS") return new Response(null,{status:204,headers:{...headers,"Access-Control-Allow-Methods":"GET","Access-Control-Allow-Headers":"Authorization, apikey, x-client-info"}});
 if(req.method!=="GET") return new Response(null,{status:405,headers});
 const token=req.headers.get("authorization");
 if(!token?.startsWith("Bearer ")) return Response.json({error:"Unauthorized"},{status:401,headers});
 const url=Deno.env.get("SUPABASE_URL");
 const anon=Deno.env.get("SUPABASE_ANON_KEY");
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!service) return Response.json({error:"Report unavailable"},{status:503,headers});
 try {
 const auth=await fetch(url+"/rest/v1/rpc/is_admin",{method:"POST",headers:{apikey:anon,Authorization:token,"Content-Type":"application/json"},body:"{}",signal:AbortSignal.timeout(10000)});
 if(!auth.ok||await auth.json()!==true) return Response.json({error:"Forbidden"},{status:403,headers});
 const month=new URL(req.url).searchParams.get("month")||"";
 const year=Number(month.slice(0,4));
 if(!/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(month)||!validYear(year)) return Response.json({error:"Invalid month"},{status:400,headers});
 async function readRows(path:string) {
  const response=await fetch(url+"/rest/v1/"+path,{headers:{apikey:service,Authorization:"Bearer "+service},signal:AbortSignal.timeout(15000)});
  if(!response.ok) throw new Error("Accounting read failed");
  return response;
 }
 async function readAll<T>(table:string,fields:string):Promise<T[]> {
  const rows:T[]=[];
  for(let offset=0;offset<10000;offset+=500){
   const response=await readRows(table+"?select="+fields+"&invoice_date=gte."+year+"-01-01&invoice_date=lt."+(year+1)+"-01-01&order=created_at.asc,id.asc&limit=500&offset="+offset);
   const page=await response.json();
   if(!Array.isArray(page)) throw new Error("Accounting response invalid");
   rows.push(...page);
   if(page.length<500) return rows;
  }
  throw new Error("Accounting report exceeds limit");
 }
 const [outgoing,incoming]=await Promise.all([
 readAll<OutgoingInvoice>("luvipro_billing_invoices","id,invoice_number,invoice_date,created_at,delivery_state,net_cents,vat_cents,gross_cents,invoice_snapshot"),
 readAll<IncomingInvoice>("luvipro_billing_expenses","id,supplier,supplier_invoice_number,invoice_date,category,description,net_cents,vat_cents,gross_cents,vat_rate,vorsteuer_confirmed,paid,file_path,created_at"),
 ]);
  const row=buildMonthlyTable(Number(month.slice(0,4)),outgoing,incoming).find(x=>x.month===month);
  if(!row) throw new Error("Missing month");
  const sales=outgoing.filter(x=>x.invoice_date?.startsWith(month)&&x.delivery_state!=="reserved");
  const costs=incoming.filter(x=>x.invoice_date.startsWith(month));
  let transfers:{gross_cents:number;bank_reference:string;transferred_on:string;affiliate_id:string;settlement_document_id:string}[]=[];
  let creditNotes:{id:string;net_cents:number;vat_cents:number;gross_cents:number;document_number:string}[]=[];
  let journal:{event_date:string;direction:"in"|"out";category:string;description:string;gross_cents:number;payment_reference:string}[]=[];
  // Affiliate payouts are shown separately, NOT automatically counted a second time
  // as operating expenses, until commission invoice reconciliation is implemented.
  try{
   const nextMonth=month.endsWith("-12")?String(Number(month.slice(0,4))+1)+"-01":month.slice(0,5)+String(Number(month.slice(5,7))+1).padStart(2,"0");
   const [r,c]=await Promise.all([
     readRows("luvipro_affiliate_manual_transfers?select=gross_cents,bank_reference,transferred_on,affiliate_id,settlement_document_id&transferred_on=gte."+month+"-01&transferred_on=lt."+nextMonth+"-01&limit=500"),
     readRows("luvipro_affiliate_settlement_documents?select=id,net_cents,vat_cents,gross_cents,document_number&limit=1000")
   ]);
   transfers=await r.json() as typeof transfers;
   creditNotes=await c.json() as typeof creditNotes;
  }catch{ /* Optional affiliate finance schema not installed; no false totals. */ }
  try{
   const r=await readRows("luvipro_billing_cash_events?select=event_date,direction,category,description,gross_cents,payment_reference&event_date=gte."+month+"-01&event_date=lt."+ (month.endsWith("-12")?String(Number(month.slice(0,4))+1)+"-01-01":month.slice(0,5)+String(Number(month.slice(5,7))+1).padStart(2,"0")+"-01") +"&order=event_date.asc&limit=500");
   journal=await r.json() as typeof journal;
  }catch{ /* Optional journal table is not installed on legacy installations. */ }
  const doc=await PDFDocument.create();
  doc.setTitle("LUVIPRO Monatsübersicht "+month);
  doc.setAuthor("LUVIPRO");
  doc.setSubject("Interne Buchhaltungsübersicht - kein Steuerbescheid");
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(regularFont, { subset: true });
  const bold = await doc.embedFont(boldFont, { subset: true });
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
   let line = "";
   const draw = () => {
    if (!line) return;
    if (y < 65) addPage();
    page.drawText(line, { x: 43, y, font, size, color: rgb(.12,.14,.20) });
    y -= size + 7;
    line = "";
   };
   for (const word of v.normalize("NFC").split(/\s+/u)) {
    const candidate = line ? line + " " + word : word;
    if (font.widthOfTextAtSize(candidate, size) <= 504) {
     line = candidate;
     continue;
    }
    draw();
    for (const character of word) {
     if (line && font.widthOfTextAtSize(line + character, size) > 504) draw();
     line += character;
    }
   }
   draw();
  }
  function title(t:string){y-=9;txt(t,13,bold);}
  addPage();
  txt("MONATSABRECHNUNG (INTERNE ÜBERSICHT)",15,bold);
  txt("Zeitraum: "+month.slice(5)+"."+month.slice(0,4)+"   Erstellt: "+new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin"}).format(new Date()));
  txt("Hinweis: keine Steuererklärung, E-Rechnung oder GoBD-Zertifizierung.",9);
  title("Monatssummen");
  txt("Ausgangsrechnungen: "+row.outgoingCount+"    Einnahmen netto: "+euro(row.revenueNet));
  txt("Umsatzsteuer Ausgang: "+euro(row.revenueVat)+"    Umsatz brutto: "+euro(row.revenueGross));
  txt("Eingangsbelege: "+row.incomingCount+"    Ausgaben brutto: "+euro(row.costsGross));
  txt("Vorsteuer manuell bestätigt: "+euro(row.inputVatConfirmed));
  txt("Indikativer USt-Saldo: "+euro(row.vatBalance));
  txt("Vereinfachte Netto-Differenz: "+euro(row.netDifference));
  txt("Affiliate Bankauszahlungen brutto (separat): "+euro(transfers.reduce((s,x)=>s+x.gross_cents,0)));
  txt("Affiliate: Vorsteuer NUR NACH Steuerberaterprüfung.");
  title("Nachgewiesene manuelle Affiliate-Überweisungen");
  if(!transfers.length)txt("Keine erfassten Bankueberweisungen.");
  else for(const t of transfers){
    const d=creditNotes.find(x=>x.id===t.settlement_document_id);
    txt([date(t.transferred_on),d?.document_number||"Beleg fehlt","Netto "+euro(d?.net_cents||0),
      "USt "+euro(d?.vat_cents||0),"Brutto "+euro(t.gross_cents)].join("  |  "),9);
  }
  title("Weitere Geldbewegungen (separates Journal)");
  txt("Zugang brutto: "+euro(journal.filter(x=>x.direction==="in").reduce((s,x)=>s+x.gross_cents,0))+"  |  Abgang brutto: "+euro(journal.filter(x=>x.direction==="out").reduce((s,x)=>s+x.gross_cents,0)));
  if(!journal.length) txt("Keine separaten Geldbewegungen.");
  else for(const event of journal){txt([date(event.event_date),event.direction==="in"?"+":"-",event.category,euro(event.gross_cents),event.description].join("  |  "),9);}
  title("Ausgangsrechnungen");
  if(!sales.length) txt("Keine ausgestellten Rechnungen in diesem Monat.");
  else for(const inv of sales){txt([date(inv.invoice_date||""),inv.invoice_number,euro(inv.gross_cents||0),inv.delivery_state].join("  |  "),9);}
  title("Eingangsrechnungen");
  if(!costs.length) txt("Keine Eingangsbelege in diesem Monat.");
  else for(const cost of costs){txt([date(cost.invoice_date),cost.supplier_invoice_number,cost.supplier,euro(cost.gross_cents),cost.paid?"bezahlt":"offen"].join("  |  "),9);}
  title("Abgrenzung / Prüfhinweise");
  txt("Keine automatische GuV / Bilanz / UStVA. Ist-/Soll-Versteuerung,");
  txt("Anzahlungen, Wareneinsatz, AfA, Erstattungen, Bankabgleich,");
  txt("Vorsteuerrecht und Gutschriften sind steuerlich zu prüfen.");
  txt("Belege und Buchungsdaten im Original aufbewahren; PDF ersetzt sie nicht.");
  const body=await doc.save();
  return new Response(new Uint8Array(body),{headers:{...cors(req),"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="LUVIPRO-Monatsabrechnung-${month}.pdf"`,"Cache-Control":"private, no-store","X-Robots-Tag":"noindex","X-Content-Type-Options":"nosniff"}});
 }catch{return Response.json({error:"Buchhaltungs-PDF nicht verfügbar; Tabellen und Verknüpfungen prüfen."},{status:503,headers:{...cors(req),"Cache-Control":"no-store"}});}

});

