'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';
import {market,Listing,money,panel,input,button} from './client';import {MarketPhoto} from './photo';import {SponsoredSlots} from './promotions';
import {interpretVehicleWish} from '@/lib/marketplace/multilingual-search';
import {CAR_BRANDS} from '@/lib/marketplace/car-brands';
import {modelsForBrand} from '@/lib/marketplace/car-models';
import {useSiteLocale} from '@/components/ui/site-locale-bridge';
import {marketCopy,marketOption} from '@/lib/marketplace/market-copy';
import {marketplaceSearchHint} from '@/lib/marketplace/search-hints';
export function MarketBrowse({dealerId}:{dealerId?:string}={}){
 const locale=useSiteLocale();const txt=marketCopy(locale);
 const [filters,setFilters]=useState<Record<string,unknown>>(dealerId?{dealer_id:dealerId}:{});const [applied,setApplied]=useState<Record<string,unknown>>(dealerId?{dealer_id:dealerId}:{});const [items,setItems]=useState<Listing[]>([]);const [offset,setOffset]=useState(0);const [total,setTotal]=useState(0);const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 async function search(page=0,selected=filters){setBusy(true);setError('');try{const x=await market({action:'read',mode:'search',filters:selected,offset:page});setItems(x.items||[]);setApplied({...selected});setTotal(x.total||0);setOffset(page);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 useEffect(()=>{void search();},[]); // Searches are explicit; no stale responses from per-keystroke requests.
 const set=(k:string,v:string)=>setFilters(f=>{const next={...f};if(v)next[k]=v;else delete next[k];return next;});
 const years=Array.from({length:new Date().getFullYear()-1899},(_,i)=>String(new Date().getFullYear()-i));
 const chooseBrand=(brand:string)=>setFilters(f=>{const next={...f};delete next.model;if(brand)next.brand=brand;else delete next.brand;return next;});
 const chooseModel=(model:string)=>setFilters(f=>{const next={...f};if(model)next.model=model;else delete next.model;return next;});
 const chooseYear=(key:'first_from'|'first_to',year:string)=>setFilters(f=>{
  const next={...f};if(!year){delete next[key];return next;}
  next[key]=key==='first_from'?year+'-01':year+'-12-31';
  if(next.first_from&&next.first_to&&String(next.first_from).slice(0,4)>String(next.first_to).slice(0,4)){
   if(key==='first_from')delete next.first_to;else delete next.first_from;
  }
  return next;
 });
 const snap=(key:'max_price'|'max_mileage',number:number,step:number)=>setFilters(f=>{
  const next={...f};if(!Number.isFinite(number)||number<=0){delete next[key];return next;}
  const rounded=Math.max(step,Math.round(number/step)*step);
  next[key]=key==='max_price'?rounded*100:rounded;
  return next;
 });

 const [customBrand,setCustomBrand]=useState(false);const [customModel,setCustomModel]=useState(false);const [wish,setWish]=useState('');const [assistNotice,setAssistNotice]=useState('');const [recognized,setRecognized]=useState<string[]>([]);const [assisting,setAssisting]=useState(false);
 async function suggest(){
  setAssisting(true);
  try{
   const result=interpretVehicleWish(wish);
   setRecognized(result.recognized);
   setAssistNotice(result.notice);
   if(!result.recognized.length)return;
   // Search immediately, including for anonymous buyers and right-to-left text.
   // Keep dealer scope and selected sort, replace old search wish constraints.
   const next:Record<string,unknown>={...(dealerId?{dealer_id:dealerId}:{}),sort:filters.sort||'newest',...result.filters};
   setCustomBrand(false);setCustomModel(false);
   setFilters(next);
   await search(0,next);
  }finally{setAssisting(false);}
 }
 return <><details className={panel+' mb-5'} open><summary className="cursor-pointer font-semibold">{txt.wishTitle}</summary><p className="my-3 text-slate-300">{txt.wishHelp}</p>
 <textarea aria-label={txt.wishTitle} dir={locale==='ar'?'rtl':'auto'} lang={locale} className={input} maxLength={1000} value={wish} onChange={e=>setWish(e.target.value)} placeholder={marketplaceSearchHint(locale)}/>
 <button className={button+' mt-3'} disabled={assisting||busy||wish.trim().length<3} onClick={()=>void suggest()}>{assisting?txt.loading:txt.wishButton}</button>
 {assistNotice&&<div role="status" aria-live="polite" className="mt-4 rounded-lg border border-cyan-400/25 p-3 text-sm"><p>{assistNotice}</p>{recognized.length>0&&<p className="mt-2 text-slate-300">{txt.recognized}: {recognized.join(' · ')}</p>}</div>}
 </details><form className={panel+' grid gap-3 sm:grid-cols-3'} onSubmit={e=>{e.preventDefault();void search();}}>
 
 <select aria-label={txt.brands} value={customBrand?'__other__':String(filters.brand??'')} className={input} onChange={e=>{
  const val=e.target.value;if(val==='__other__'){setCustomBrand(true);chooseBrand('');}else{setCustomBrand(false);chooseBrand(val);}
  setCustomModel(false);
 }}>
  <option value="">{txt.brands}</option>
  {Boolean(filters.brand)&&!CAR_BRANDS.includes(String(filters.brand) as typeof CAR_BRANDS[number])&&!customBrand&&<option value={String(filters.brand)}>{String(filters.brand)}</option>}
  {Array.from(new Set(CAR_BRANDS.map(b=>b[0]!.toUpperCase()))).map(letter=><optgroup key={letter} label={letter}>
   {CAR_BRANDS.filter(brand=>brand[0]!.toUpperCase()===letter).map(brand=><option key={brand} value={brand}>{brand}</option>)}
  </optgroup>)}
  <option value="__other__">{txt.brandOther}</option>
 </select>
 {customBrand&&<input aria-label="Andere Automarke" placeholder={txt.brandOther} className={input} maxLength={80} value={String(filters.brand??'')} onChange={e=>chooseBrand(e.target.value)}/>}
 <select aria-label={txt.models} value={customModel?'__other__':String(filters.model??'')} className={input} disabled={!filters.brand} onChange={e=>{
  if(e.target.value==='__other__'){setCustomModel(true);chooseModel('');}else{setCustomModel(false);chooseModel(e.target.value);}
 }}>
  <option value="">{txt.models}</option>
  {Boolean(filters.model)&&!modelsForBrand(String(filters.brand)).includes(String(filters.model))&&!customModel&&<option value={String(filters.model)}>{String(filters.model)}</option>}
  {modelsForBrand(String(filters.brand??'')).map(model=><option key={model} value={model}>{model}</option>)}
  <option value="__other__">{txt.modelOther}</option>
 </select>
 {customModel&&<input aria-label="Anderes Modell" placeholder={txt.modelOther} className={input} maxLength={100} value={String(filters.model??'')} onChange={e=>chooseModel(e.target.value)}/>}
 <input aria-label={txt.place} placeholder={txt.place} value={String(filters.q??'')} className={input} onChange={e=>set('q',e.target.value)}/>
 <input aria-label={txt.maxPrice} title="In 100-€-Schritten" type="number" min="0" step="100" placeholder={txt.maxPrice+" (€ 100)"} value={filters.max_price?Number(filters.max_price)/100:''} className={input} onChange={e=>set('max_price',e.target.value?String(Math.round(Number(e.target.value)*100)):'')} onBlur={e=>snap('max_price',Number(e.target.value),100)}/>
 <input aria-label={txt.maxMileage} title="In 1.000-km-Schritten" type="number" min="0" step="1000" placeholder={txt.maxMileage+" (1.000 km)"} value={String(filters.max_mileage??'')} className={input} onChange={e=>set('max_mileage',e.target.value)} onBlur={e=>snap('max_mileage',Number(e.target.value),1000)}/>
 <select aria-label={txt.firstFrom} value={String(filters.first_from??'').slice(0,4)} className={input} onChange={e=>chooseYear('first_from',e.target.value)}>
  <option value="">{txt.firstFrom}</option>{years.map(year=><option key={year} value={year}>{year}</option>)}
 </select>
 <select aria-label={txt.firstTo} value={String(filters.first_to??'').slice(0,4)} className={input} onChange={e=>chooseYear('first_to',e.target.value)}>
  <option value="">{txt.firstTo}</option>{years.map(year=><option key={year} value={year}>{year}</option>)}
 </select>
 <select aria-label={txt.fuel} value={String(filters.fuel??'')} className={input} onChange={e=>set('fuel',e.target.value)}><option value="">{txt.fuel}</option>{['Benzin','Diesel','Elektro','Hybrid','Plug-in-Hybrid','LPG','CNG','Andere'].map(x=><option key={x} value={x}>{marketOption(locale,({Benzin:'petrol',Diesel:'diesel',Elektro:'electric',Hybrid:'hybrid','Plug-in-Hybrid':'plugIn',Andere:'other'} as Record<string,string>)[x]||x)}</option>)}</select>
 <select aria-label={txt.gear} value={String(filters.transmission??'')} className={input} onChange={e=>set('transmission',e.target.value)}><option value="">{txt.gear}</option><option value="Automatik">{marketOption(locale,'automatic')}</option><option value="Schaltgetriebe">{marketOption(locale,'manual')}</option></select>
 <select aria-label={txt.sort} value={String(filters.sort??'newest')} className={input} onChange={e=>set('sort',e.target.value)}><option value="newest">{marketOption(locale,'newest')}</option><option value="oldest">{marketOption(locale,'oldest')}</option><option value="mileage_asc">{marketOption(locale,'mileage_asc')}</option><option value="mileage_desc">{marketOption(locale,'mileage_desc')}</option><option value="registration_desc">{marketOption(locale,'registration_desc')}</option><option value="registration_asc">{marketOption(locale,'registration_asc')}</option><option value="price_asc">{marketOption(locale,'price_asc')}</option><option value="price_desc">{marketOption(locale,'price_desc')}</option></select>
 <button className={button} disabled={busy}>{busy?txt.loading:txt.find}</button></form>
 <div className="my-3 flex flex-wrap gap-2">{Object.entries(filters).filter(([k,v])=>['city','equipment'].includes(k)&&Boolean(v)).map(([k,v])=><button key={k} className={button} onClick={()=>set(k,'')}>{String(Array.isArray(v)?v.join(', '):v)} ×</button>)}</div>{error&&<p role="alert" className="my-4 text-rose-300">{error} <Link href="/affiliate/login">Anmelden</Link></p>}
 <SponsoredSlots filters={applied}/><p className="my-5 text-slate-300">{total} {txt.results}</p>
 {!busy&&!error&&!items.length&&<div className={panel}>{txt.empty} <Link href="/inspections/checkout" className="text-cyan-300">Fahrzeug prüfen lassen</Link></div>}
 <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map(l=>{const v=l.vehicle||{};return <article key={l.id} className={panel+' overflow-hidden p-0 transition hover:border-cyan-300/60'}>
 {l.photos?.[0]&&<MarketPhoto id={l.photos[0].id} alt={String(v.brand)+' '+String(v.model)}/>}
 <div className="space-y-3 p-5"><span className="text-xs text-cyan-300">{txt.reportBadge}</span><h2 className="text-xl font-semibold"><Link href={'/marketplace/vehicle/'+l.id}>{String(v.brand)} {String(v.model)} {String(v.variant||'')}</Link></h2><p className="text-2xl font-bold">{money(v.price_cents)}</p><p className="text-sm text-slate-300">{String(v.first_registration||'Erstzulassung nicht angegeben')} · {String(v.mileage||'–')} km · {String(v.fuel||'–')} · {String(v.transmission||'–')}</p><p>{String(v.city)} · {v.seller_type==='commercial'?'Gewerblich':'Privat'}</p><Link href={'/marketplace/vehicle/'+l.id+'#report'} className="text-cyan-300">{txt.reportView} →</Link></div></article>;})}</div>
 <nav className="mt-6 flex gap-3" aria-label="Ergebnisseiten"><button className={button} disabled={busy||offset===0} onClick={()=>void search(Math.max(0,offset-24))}>{txt.back}</button><button className={button} disabled={busy||offset+24>=total} onClick={()=>void search(offset+24)}>{txt.more}</button></nav><p className="mt-10 text-xs text-slate-400">Fahrzeugmodelle: <a className="underline hover:text-white" href="https://vehiclesdb.com" target="_blank" rel="noopener noreferrer">Vehicle data by VehiclesDB</a> (CC BY 4.0), ergänzt um Global Car Models (MIT). <a className="underline hover:text-white" href="/vehicle-data-attribution.md">Datenquellen &amp; Lizenzhinweise</a></p></>;
}
