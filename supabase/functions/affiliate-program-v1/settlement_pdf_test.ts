import {settlementPdf} from './settlement_pdf.ts';
import {PDFDocument} from 'npm:pdf-lib@1.17.1';
const fixture={document_number:'SYNTHETIC-GS-1',issuer_legal_name:'SYNTHETIC LUVIPRO',issuer_address:'SYNTHETIC ADDRESS',supplier_legal_name:'SYNTHETIC AFFILIATE',supplier_address:'SYNTHETIC ADDRESS',supplier_tax_number:'SYNTHETIC-TAX',agreement_ref:'SYNTHETIC AGREEMENT',issued_at:'2026-10-29',service_month:'2026-09-01',service_from:'2026-09-01',service_until:'2026-09-30',net_cents:'22689',vat_cents:'4311',gross_cents:'27000',vat_mode:'de_19'};
Deno.test('synthetic VAT-inclusive document is a readable PDF',async()=>{
 const bytes=await settlementPdf(fixture);const loaded=await PDFDocument.load(bytes);
 if(loaded.getPageCount()<1||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('invalid PDF');
});
Deno.test('Kleinunternehmer document and long text remain readable',async()=>{
 const bytes=await settlementPdf({...fixture,net_cents:'27000',vat_cents:'0',vat_mode:'de_kleinunternehmer',supplier_address:'SYNTHETIC ADDRESS '.repeat(150)});
 if((await PDFDocument.load(bytes)).getPageCount()<2)throw new Error('pagination missing');
});
Deno.test('incorrect financial balance is never rendered',async()=>{
 let failed=false;try{await settlementPdf({...fixture,gross_cents:'30000'});}catch{failed=true;}if(!failed)throw new Error('balance accepted');
});
