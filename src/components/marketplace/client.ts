'use client';
export async function market(action:Record<string,unknown>){
 const r=await fetch('/api/marketplace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)});
 const data=await r.json();if(!r.ok)throw Error(r.status===401?'Bitte mit Ihrem bestehenden LUVIPRO-Konto anmelden.':data.error||'Aktion fehlgeschlagen.');return data;
}
export type Dealer={id:string;company_name:string;city:string;postal_code:string;street:string;house_number:string;country:string};
export type Listing={dealer?:Dealer|null;id:string;status:string;revision?:number;vehicle_id?:string;inspection_id?:string;data?:Record<string,unknown>;vehicle?:Record<string,unknown>;photos?:{id:string;category:string;position:number}[];report?:{reference:string;inspected_at:string;status:string;brand:string;model:string;year:number;mileage:number}};
export const money=(n:unknown)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n||0)/100);
export const panel='rounded-2xl border border-violet-400/20 bg-slate-950/80 p-5 shadow-xl backdrop-blur';
export const input='w-full rounded-lg border border-violet-300/25 bg-slate-900 p-3 text-white';
export const button='inline-flex items-center justify-center rounded-xl border border-cyan-300/30 bg-violet-700 px-4 py-3 text-white hover:bg-violet-600 disabled:opacity-40';
export const equipment=['Klimaanlage','Klimaautomatik','Navigation','Bluetooth','Apple CarPlay','Android Auto','Parksensoren','Rückfahrkamera','360°-Kamera','Sitzheizung','Elektrische Sitze','Leder','Tempomat','Abstandsregeltempomat','Spurhalteassistent','Totwinkelassistent','LED-Scheinwerfer','Matrix-LED','Panoramadach','Schiebedach','Anhängerkupplung','Leichtmetallfelgen','Winterreifen','Sommerreifen'];
