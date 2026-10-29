import {NextRequest,NextResponse} from "next/server";
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from "pdf-lib";
import {affiliateDb,affiliateConfigured} from "@/lib/affiliate/server";
import {affiliateCurrentSession,claimExistingAffiliate} from "@/lib/affiliate/account";
import {isAuthorizedFinanceAdmin} from "@/lib/accounting/admin-request";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Document={
 id:string;affiliate_id:string;payout_id:string;document_number:string;issued_at:string;
 service_month:string;service_from:string;service_until:string;supplier_legal_name:string;supplier_address:string;supplier_tax_number:string;
 issuer_legal_name:string;issuer_address:string;vat_mode:"de_19"|"de_kleinunternehmer";
 vat_rate:number;net_cents:number;vat_cents:number;gross_cents:number;agreement_ref:string;
};
const euro=(n:number)=>new Intl.NumberFormat("de-DE",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+" EUR";
const latin=(s:string)=>s.normalize("NFC").replace(/[^\x20-\xFF\u20ac]/g,"?").trim();
export async function GET(req:NextRequest){
 if(!affiliateConfigured())return NextResponse.json({error:"Not enabled"},{status:503});
 const id=req.nextUrl.searchParams.get("id")||"";
 if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:"Invalid document"},{status:400});
 try{
  const r=await affiliateDb("luvipro_affiliate_settlement_documents?select=*&id=eq."+id+"&limit=1");
  const d=(await r.json() as Document[])[0];
  if(!d)return NextResponse.json({error:"Not found"},{status:404});
  const admin=await isAuthorizedFinanceAdmin(req);
  if(!admin){
    const bearer=req.headers.get("authorization")||"";
    const cookie=await affiliateCurrentSession();
    const token=/^Bearer [A-Za-z0-9_.-]{40,4000}$/.test(bearer)?bearer.slice(7):cookie;
    if(!token)return NextResponse.json({error:"Unauthorized"},{status:401});
    const partner=await claimExistingAffiliate(token);
    if(partner.id!==d.affiliate_id)return NextResponse.json({error:"Unauthorized"},{status:403});
  }
  const pdf=await PDFDocument.create();pdf.setTitle("Gutschrift "+d.document_number);pdf.setSubject("LUVIPRO Werbeleistungen / Vermittlungsprovision");
  const f=await pdf.embedFont(StandardFonts.Helvetica),fb=await pdf.embedFont(StandardFonts.HelveticaBold);
  let page:PDFPage,y=0;
  function next(){
   page=pdf.addPage([595.28,841.89]);page.drawRectangle({x:0,y:785,width:595.28,height:56,color:rgb(.095,.075,.19)});
   page.drawText("LUVIPRO   GUTSCHRIFT",{x:40,y:805,size:18,font:fb,color:rgb(1,1,1)});y=758;
  }
  function line(s:string,bold=false,size=10){
   if(y<65)next();
   const font:PDFFont=bold?fb:f;
   const text=latin(s);let remaining=text;
   if(!remaining){y-=12;return;}
   while(remaining.length){
    let take=Math.min(remaining.length,104);
    while(take>1&&font.widthOfTextAtSize(remaining.slice(0,take),size)>515)take--;
    page.drawText(remaining.slice(0,take),{x:42,y,size,font,color:rgb(.12,.14,.19)});
    remaining=remaining.slice(take);y-=size+7;
    if(y<65&&remaining)next();
   }
  }
  next();line("Rechnungsaussteller (Gutschrift): "+d.issuer_legal_name,true);
  line(d.issuer_address);line("");
  line("Leistender Unternehmer: "+d.supplier_legal_name,true);
  line(d.supplier_address);
  line("Steuernummer / USt-IdNr. des Leistungserbringers: "+d.supplier_tax_number);
  line("");line("Belegart: Gutschrift / Selbstabrechnung",true);
  line("Gutschrift-Nr.: "+d.document_number);
  line("Ausstellungsdatum: "+d.issued_at.slice(0,10));
  line("Abrechnungsmonat: "+d.service_month.slice(0,7));
  line("Zeitraum der vergüteten Vermittlungen: "+d.service_from+" bis "+d.service_until);
  line("Leistung: Marketing / Vermittlung von LUVIPRO Produktkaeufen");
  line("Leistungsumfang: nach gepruefter Provisionsaufstellung fuer diesen Monat");
  line("Vereinbarung zur Gutschrift: "+d.agreement_ref);
  y-=12;
  line("Netto-Provision: "+euro(d.net_cents),true);
  if(d.vat_mode==="de_19"){
   line("Umsatzsteuer 19 %: "+euro(d.vat_cents));
  }else{
   line("Umsatzsteuer: 0,00 EUR");
   line("Keine Umsatzsteuer nach Paragraph 19 UStG (Kleinunternehmerregelung).");
  }
  line("Gesamtbetrag: "+euro(d.gross_cents),true);
  y-=20;
  line("Diese Abrechnung wurde durch den Leistungsempfaenger erstellt.");
  line("Der ausgewiesene Umsatzsteuerstatus entspricht dem verifizierten Partnerprofil.");
  line("PDF-Ausgabe: strukturierte E-Rechnung bei gesetzlicher Pflicht separat erstellen.");
  const bytes=await pdf.save();
  return new NextResponse(new Uint8Array(bytes),{headers:{
    "Content-Type":"application/pdf","Content-Disposition":'attachment; filename="'+d.document_number+".pdf"+'"',
    "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex"
  }});
 }catch{return NextResponse.json({error:"Gutschrift konnte nicht abgerufen werden"},{status:503});}
}
