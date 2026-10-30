"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const products={device:"Gerät",inspection_standard:"Prüfung Standard",inspection_premium:"Prüfung Premium"} as const;
type Product=keyof typeof products;
export type PromoRule={product_kind:Product;discount_kind:"percent"|"fixed_net";discount_bps:number;fixed_net_cents:number;maximum_discount_net_cents:number|null;minimum_order_net_cents:number;commission_bps:number|null;settlement_delay_days:number|null;usage_per_customer:number|null;usage_per_partner:number|null;new_partner_only:boolean;enabled:boolean};
export type PromoCode={id:string;code:string;affiliate_id:string|null;code_type:"device"|"inspection"|"both";active:boolean;version:number;valid_from:string;valid_until:string;usage_limit:number|null;redemption_count:number;code_terms_evidence_ref:string;rules:PromoRule[]};
type Affiliate={id:string;company_name:string;status:string;registration_verified_at:string|null};
const control="mt-1 w-full rounded-lg border border-white/15 bg-[#10182a] p-3 text-white";
export function AffiliatePromoManager({codes,affiliates,disabled}:{codes:PromoCode[];affiliates:Affiliate[];disabled:boolean}){
 const router=useRouter();const [editing,setEditing]=useState<PromoCode|null|undefined>();const [scope,setScope]=useState<PromoCode['code_type']>('device');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 function edit(code:PromoCode|null){setEditing(code);setScope(code?.code_type??'device');setError('');}
 async function save(form:FormData){
  if(busy||disabled)return;setBusy(true);setError('');
  try{
   const value=(key:string)=>String(form.get(key)??'').trim();
   const scaled=(key:string)=>{const text=value(key).replace(',','.');if(!/^\d{1,9}(\.\d{1,2})?$/.test(text))throw Error('Beträge und Prozente mit maximal zwei Nachkommastellen eingeben.');return Math.round(Number(text)*100);};
   const optional=(key:string)=>value(key)?Number(value(key)):null;
   const included=(Object.keys(products) as Product[]).filter(p=>scope==='both'||(scope==='device'?p==='device':p!=='device'));
   const rules=included.map(p=>({product_kind:p,discount_kind:value(p+'_kind'),discount_bps:scaled(p+'_discount'),fixed_net_cents:scaled(p+'_fixed'),maximum_discount_net_cents:value(p+'_cap')?scaled(p+'_cap'):null,minimum_order_net_cents:scaled(p+'_minimum'),commission_bps:scaled(p+'_commission'),settlement_delay_days:Number(value(p+'_delay')),usage_per_customer:optional(p+'_customer'),usage_per_partner:optional(p+'_partner'),new_partner_only:form.get(p+'_new')==='on'}));
   if(form.get('code_terms_confirmed')!=='on')throw Error('Geprüfte Bedingungen bestätigen.');
   const response=await fetch('/api/accounting/affiliate/promo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editing?.id??null,version:editing?.version??null,code:{code:value('code'),affiliate_id:value('affiliate_id')||null,code_type:scope,active:form.get('active')==='on',valid_from:value('valid_from'),valid_until:value('valid_until'),usage_limit:optional('usage_limit'),terms_reference:value('code_terms_evidence_ref'),evidence_checked:true},rules})});
   const result=await response.json();if(!response.ok)throw Error(result.error||'Nicht gespeichert.');setEditing(undefined);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Nicht gespeichert.');}finally{setBusy(false);}
 }
 return <section className="mt-12 rounded-2xl border border-white/10 p-6"><h2 className="text-2xl font-bold">Promo Codes · Geräte und Prüfungen</h2><p className="mt-3 text-sm text-slate-300">Eine Codeverwaltung für alle Plattformen. Änderungen gelten für zukünftige Käufe; bestehende Preis- und Provisionssnapshots bleiben erhalten. Zahlungsdienste werden hier nicht aktiviert.</p>
 <button type="button" disabled={disabled||busy} onClick={()=>edit(null)} className="mt-4 rounded-lg bg-violet-600 px-5 py-3 disabled:opacity-40">Promo Code anlegen</button>
 <div className="mt-5 space-y-3">{codes.map(c=><article key={c.id} className="rounded-xl border border-white/15 p-4"><b>{c.code}</b> · {c.code_type} · {c.active?'Aktiv':'Pausiert'}<p className="text-sm text-slate-300">{affiliates.find(a=>a.id===c.affiliate_id)?.company_name??'Allgemeiner Code'} · {c.valid_from} bis {c.valid_until} · {c.redemption_count}/{c.usage_limit??'∞'} Einlösungen</p><button type="button" disabled={busy||disabled} onClick={()=>edit(c)} className="mt-2 text-pulse underline">Bearbeiten / pausieren / verlängern</button></article>)}</div>
 {editing!==undefined&&<form key={editing?.id??'new'} action={save} className="mt-8 grid gap-4 rounded-xl border border-violet-400/30 p-4 sm:grid-cols-2">
 <label>Code<input className={control} name="code" pattern="[A-Za-z0-9][A-Za-z0-9_-]{3,31}" maxLength={32} required defaultValue={editing?.code??''}/></label>
 <label>Affiliate<select className={control} name="affiliate_id" defaultValue={editing?.affiliate_id??''} disabled={!!editing}><option value="">Allgemeiner Code · keine Affiliate-Provision</option>{affiliates.filter(a=>a.status==='approved'&&a.registration_verified_at||a.id===editing?.affiliate_id).map(a=><option value={a.id} key={a.id}>{a.company_name}</option>)}</select>{editing&&<input type="hidden" name="affiliate_id" value={editing.affiliate_id??''}/>}</label>
 <label>Geltungsbereich<select className={control} value={scope} onChange={e=>setScope(e.target.value as typeof scope)}><option value="device">Geräte</option><option value="inspection">Prüfungen</option><option value="both">Geräte und Prüfungen</option></select></label>
 <label className="flex items-center gap-3"><input type="checkbox" name="active" defaultChecked={editing?.active??false}/>Code aktiv (aktiviert keine Zahlung)</label>
 <label>Gültig ab<input className={control} name="valid_from" type="date" required defaultValue={editing?.valid_from??''}/></label><label>Gültig bis<input className={control} name="valid_until" type="date" required defaultValue={editing?.valid_until??''}/></label><label>Gesamtlimit (optional)<input className={control} name="usage_limit" type="number" min={1} step={1} defaultValue={editing?.usage_limit??''}/></label>
 {(Object.keys(products) as Product[]).filter(p=>scope==='both'||(scope==='device'?p==='device':p!=='device')).map(p=>{const rule=editing?.rules.find(r=>r.product_kind===p&&r.enabled);return <fieldset className="grid gap-3 rounded-xl border border-white/15 p-4 sm:col-span-2 sm:grid-cols-2" key={p}><legend className="px-2 font-bold">{products[p]}</legend>
 <label>Rabattmodus<select className={control} name={p+'_kind'} defaultValue={rule?.discount_kind??'percent'}><option value="percent">Prozent</option><option value="fixed_net">Fester Nettobetrag je Bestellung</option></select></label>
 <label>Rabatt %<input className={control} name={p+'_discount'} type="number" min={0} max={100} step="0.01" required defaultValue={(rule?.discount_bps??0)/100}/></label>
 <label>Fester Rabatt EUR netto<input className={control} name={p+'_fixed'} type="number" min={0} step="0.01" required defaultValue={(rule?.fixed_net_cents??0)/100}/></label>
 <label>Rabattobergrenze EUR netto (optional)<input className={control} name={p+'_cap'} type="number" min={0} step="0.01" defaultValue={rule?.maximum_discount_net_cents==null?'':rule.maximum_discount_net_cents/100}/></label>
 <label>Mindestwarenwert EUR netto vor Rabatt<input className={control} name={p+'_minimum'} type="number" min={0} step="0.01" required defaultValue={(rule?.minimum_order_net_cents??0)/100}/></label>
 <label>Gesamtprovision % vom Netto nach Rabatt<input className={control} name={p+'_commission'} type="number" min={0} max={100} step="0.01" required defaultValue={(rule?.commission_bps??0)/100}/></label>
 <label>Vertragliche Wartefrist Tage (mind. 15)<input className={control} name={p+'_delay'} type="number" min={15} max={3660} step={1} required defaultValue={rule?.settlement_delay_days??15}/></label>
 <label>Nutzungen je Kunde (optional)<input className={control} name={p+'_customer'} type="number" min={1} step={1} defaultValue={rule?.usage_per_customer??''}/></label><label>Nutzungen je ausführendem Partner (optional)<input className={control} name={p+'_partner'} type="number" min={1} step={1} defaultValue={rule?.usage_per_partner??''}/></label>
 <label className="flex items-center gap-3"><input type="checkbox" name={p+'_new'} defaultChecked={rule?.new_partner_only??false}/>Nur separat verifizierte Neupartner</label></fieldset>;})}
 <label className="sm:col-span-2">Beleg-/Vertragsreferenz<input className={control} name="code_terms_evidence_ref" minLength={4} maxLength={200} required defaultValue={editing?.code_terms_evidence_ref??''}/></label>
 <label className="flex gap-3 text-sm sm:col-span-2"><input type="checkbox" required name="code_terms_confirmed"/>Konditionen, Gültigkeit und Vergütung sind geprüft und bei Affiliate-Provision ausdrücklich vereinbart. Provision ist der TOTAL-Auszahlungsbetrag inklusive ggf. USt.; keine USt. zusätzlich.</label>
 {error&&<p role="alert" className="text-rose-300 sm:col-span-2">{error}</p>}
 <button disabled={busy||disabled} type="submit" className="rounded-lg bg-violet-600 px-4 py-3 disabled:opacity-40">{busy?'Wird gespeichert…':'Geprüfte Bedingungen speichern'}</button><button disabled={busy} type="button" onClick={()=>setEditing(undefined)}>Abbrechen</button>
 </form>}
 </section>;
}
