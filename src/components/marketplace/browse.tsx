'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';
import {market,Listing,money,panel,input,button} from './client';import {MarketPhoto} from './photo';import {SponsoredSlots} from './promotions';
import {interpretVehicleWish} from '@/lib/marketplace/multilingual-search';
import {CAR_BRANDS} from '@/lib/marketplace/car-brands';
export function MarketBrowse({dealerId}:{dealerId?:string}={}){
 const [filters,setFilters]=useState<Record<string,unknown>>(dealerId?{dealer_id:dealerId}:{});const [applied,setApplied]=useState<Record<string,unknown>>(dealerId?{dealer_id:dealerId}:{});const [items,setItems]=useState<Listing[]>([]);const [offset,setOffset]=useState(0);const [total,setTotal]=useState(0);const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 async function search(page=0,selected=filters){setBusy(true);setError('');try{const x=await market({action:'read',mode:'search',filters:selected,offset:page});setItems(x.items||[]);setApplied({...selected});setTotal(x.total||0);setOffset(page);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 useEffect(()=>{void search();},[]); // Searches are explicit; no stale responses from per-keystroke requests.
 const set=(k:string,v:string)=>setFilters(f=>{const next={...f};if(v)next[k]=v;else delete next[k];return next;});
 const [wish,setWish]=useState('');const [assistNotice,setAssistNotice]=useState('');const [recognized,setRecognized]=useState<string[]>([]);const [assisting,setAssisting]=useState(false);
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
   setFilters(next);
   await search(0,next);
  }finally{setAssisting(false);}
 }
 return <><details className={panel+' mb-5'} open><summary className="cursor-pointer font-semibold">Suchwunsch formulieren · Jede Sprache willkommen</summary><p className="my-3 text-slate-300">Suchanfragen auf Deutsch, Arabisch und vielen weiteren Sprachen möglich. Erkennbare Angaben werden sofort als Filter gesucht. Unklare Angaben bitte manuell ergänzen. Keine privaten Daten eingeben.</p>
 <textarea aria-label="Suchwunsch in beliebiger Sprache" dir="auto" lang="und" className={input} maxLength={1000} value={wish} onChange={e=>setWish(e.target.value)} placeholder="BMW بنزين لحد 18000 يورو · Audi diesel automatic under €20,000"/>
 <button className={button+' mt-3'} disabled={assisting||busy||wish.trim().length<3} onClick={()=>void suggest()}>{assisting?'Suche läuft …':'Suchwunsch suchen / بحث'}</button>
 {assistNotice&&<div role="status" aria-live="polite" className="mt-4 rounded-lg border border-cyan-400/25 p-3 text-sm"><p>{assistNotice}</p>{recognized.length>0&&<p className="mt-2 text-slate-300">Erkannt: {recognized.join(' · ')}</p>}</div>}
 </details><form className={panel+' grid gap-3 sm:grid-cols-3'} onSubmit={e=>{e.preventDefault();void search();}}>
 <select aria-label="Marke" title="Automarke auswählen" value={String(filters.brand??'')} className={input} onChange={e=>set('brand',e.target.value)}>
 <option value="">Alle Marken</option>
 {filters.brand&&!CAR_BRANDS.some(brand=>brand.toLowerCase()===String(filters.brand).toLowerCase())&&<option value={String(filters.brand)}>{String(filters.brand)}</option>}
 {Array.from(new Set(CAR_BRANDS.map(brand=>brand[0]!.toUpperCase()))).map(letter=>
 <optgroup key={letter} label={letter}>{CAR_BRANDS.filter(brand=>brand[0]!.toUpperCase()===letter).map(brand=><option key={brand} value={brand}>{brand}</option>)}</optgroup>
 )}
 </select>
 <input aria-label="Modell oder Ort" placeholder="Modell oder Ort" value={String(filters.q??'')} className={input} onChange={e=>set('q',e.target.value)}/>
 <input aria-label="Preis bis EUR" type="number" min="0" placeholder="Preis bis EUR" value={filters.max_price?Number(filters.max_price)/100:''} className={input} onChange={e=>set('max_price',e.target.value?String(Math.round(Number(e.target.value)*100)):'')}/>
 <input aria-label="Kilometer bis" type="number" min="0" placeholder="Kilometer bis" value={String(filters.max_mileage??'')} className={input} onChange={e=>set('max_mileage',e.target.value)}/>
 <select aria-label="Kraftstoff" value={String(filters.fuel??'')} className={input} onChange={e=>set('fuel',e.target.value)}><option value="">Alle Kraftstoffe</option>{['Benzin','Diesel','Elektro','Hybrid','Plug-in-Hybrid','LPG','CNG','Andere'].map(x=><option key={x}>{x}</option>)}</select>
 <select aria-label="Getriebe" value={String(filters.transmission??'')} className={input} onChange={e=>set('transmission',e.target.value)}><option value="">Alle Getriebe</option><option>Automatik</option><option>Schaltgetriebe</option></select>
 <select aria-label="Sortierung" value={String(filters.sort??'newest')} className={input} onChange={e=>set('sort',e.target.value)}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="mileage_asc">Kilometerstand aufsteigend</option><option value="mileage_desc">Kilometerstand absteigend</option><option value="registration_desc">Erstzulassung: neueste zuerst</option><option value="registration_asc">Erstzulassung: älteste zuerst</option><option value="price_asc">Preis aufsteigend</option><option value="price_desc">Preis absteigend</option></select>
 <button className={button} disabled={busy}>{busy?'Suche läuft …':'Fahrzeuge entdecken'}</button></form>
 <div className="my-3 flex flex-wrap gap-2">{Object.entries(filters).filter(([k,v])=>['city','first_from','equipment'].includes(k)&&Boolean(v)).map(([k,v])=><button key={k} className={button} onClick={()=>set(k,'')}>{String(Array.isArray(v)?v.join(', '):v)} ×</button>)}</div>{error&&<p role="alert" className="my-4 text-rose-300">{error} <Link href="/affiliate/login">Anmelden</Link></p>}
 <SponsoredSlots filters={applied}/><p className="my-5 text-slate-300">{total} veröffentlichte Fahrzeuge</p>
 {!busy&&!error&&!items.length&&<div className={panel}>Noch keine passenden Fahrzeuge veröffentlicht. Jedes Inserat benötigt einen passenden, freigegebenen LUVIPRO Prüfbericht. <Link href="/inspections/checkout" className="text-cyan-300">Fahrzeug prüfen lassen</Link></div>}
 <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map(l=>{const v=l.vehicle||{};return <article key={l.id} className={panel+' overflow-hidden p-0 transition hover:border-cyan-300/60'}>
 {l.photos?.[0]&&<MarketPhoto id={l.photos[0].id} alt={String(v.brand)+' '+String(v.model)}/>}
 <div className="space-y-3 p-5"><span className="text-xs text-cyan-300">LUVIPRO Prüfbericht vorhanden</span><h2 className="text-xl font-semibold"><Link href={'/marketplace/vehicle/'+l.id}>{String(v.brand)} {String(v.model)} {String(v.variant||'')}</Link></h2><p className="text-2xl font-bold">{money(v.price_cents)}</p><p className="text-sm text-slate-300">{String(v.first_registration||'Erstzulassung nicht angegeben')} · {String(v.mileage||'–')} km · {String(v.fuel||'–')} · {String(v.transmission||'–')}</p><p>{String(v.city)} · {v.seller_type==='commercial'?'Gewerblich':'Privat'}</p><Link href={'/marketplace/vehicle/'+l.id+'#report'} className="text-cyan-300">LUVIPRO Prüfbericht ansehen →</Link></div></article>;})}</div>
 <nav className="mt-6 flex gap-3" aria-label="Ergebnisseiten"><button className={button} disabled={busy||offset===0} onClick={()=>void search(Math.max(0,offset-24))}>Zurück</button><button className={button} disabled={busy||offset+24>=total} onClick={()=>void search(offset+24)}>Weitere</button></nav></>;
}
