import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'npm:pdf-lib@1.17.1';
export async function settlementPdf(d:Record<string,unknown>) {
 const cents=(key:string)=>{const value=String(d[key]??'');if(!/^\d{1,15}$/.test(value))throw new Error('invalid_document_amount');return BigInt(value);};
 const net=cents('net_cents'),vat=cents('vat_cents'),gross=cents('gross_cents');
 if(net+vat!==gross||!['de_19','de_kleinunternehmer'].includes(String(d.vat_mode))||
  (d.vat_mode==='de_kleinunternehmer'&&vat!==0n))throw new Error('invalid_document_balance');
 const euro=(value:bigint)=>(value/100n).toString()+','+(value%100n).toString().padStart(2,'0')+' EUR';
 const latin=(s:unknown)=>String(s??'').normalize('NFC').replace(/[^\x20-\xFF\u20ac]/g,'?').trim();
 const pdf=await PDFDocument.create();pdf.setTitle('Gutschrift '+latin(d.document_number));
 const normal=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 let page:PDFPage,y=0;
 const next=()=>{page=pdf.addPage([595.28,841.89]);page.drawRectangle({x:0,y:785,width:595.28,height:56,color:rgb(.095,.075,.19)});page.drawText('LUVIPRO   GUTSCHRIFT',{x:40,y:805,size:18,font:bold,color:rgb(1,1,1)});y=758;};
 const line=(value:unknown,strong=false)=>{let text=latin(value);if(!text){y-=16;return;}const font:PDFFont=strong?bold:normal;
  while(text.length){if(y<65)next();let n=Math.min(text.length,104);while(n>1&&font.widthOfTextAtSize(text.slice(0,n),10)>510)n--;page.drawText(text.slice(0,n),{x:42,y,size:10,font,color:rgb(.12,.14,.19)});text=text.slice(n);y-=17;}};
 next();line('Rechnungsaussteller (Gutschrift): '+latin(d.issuer_legal_name),true);line(d.issuer_address);line('');
 line('Leistender Unternehmer: '+latin(d.supplier_legal_name),true);line(d.supplier_address);
 line('Steuernummer / USt-IdNr.: '+latin(d.supplier_tax_number));line('');
 line('Belegart: Gutschrift / Selbstabrechnung',true);line('Gutschrift-Nr.: '+latin(d.document_number));
 line('Ausstellungsdatum: '+String(d.issued_at).slice(0,10));line('Abrechnungsmonat: '+String(d.service_month).slice(0,7));
 line('Zeitraum der vergüteten Vermittlungen: '+latin(d.service_from)+' bis '+latin(d.service_until));
 line('Leistung: Marketing / Vermittlung von LUVIPRO Produktkaeufen und vereinbarten Leistungen');
 line('Leistungsumfang: nach gepruefter Provisionsaufstellung fuer diesen Monat');line('Vereinbarung zur Gutschrift: '+latin(d.agreement_ref));line('');
 line('Netto-Provision: '+euro(net),true);
 line(d.vat_mode==='de_19'?'Umsatzsteuer 19 %: '+euro(vat):'Keine Umsatzsteuer nach Paragraph 19 UStG (Kleinunternehmerregelung).');
 line('Gesamtbetrag: '+euro(gross),true);line('');
 line('Die vereinbarte Provision ist der Gesamtbetrag einschließlich gegebenenfalls anfallender Umsatzsteuer.');
 line('Diese Abrechnung wurde durch den Leistungsempfaenger erstellt.');
 line('Der Umsatzsteuerstatus entspricht dem verifizierten Affiliate-Profil.');
 line('PDF-Ausgabe: strukturierte E-Rechnung bei gesetzlicher Pflicht separat erstellen.');
 return await pdf.save();
}
