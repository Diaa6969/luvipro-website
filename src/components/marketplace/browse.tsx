'use client';
import {useEffect,useState} from 'react';import Link from 'next/link';
import {market,Listing,money,panel,input,button} from './client';import {MarketPhoto} from './photo';
export function MarketBrowse(){
 const [filters,setFilters]=useState<Record<string,unknown>>({});const [items,setItems]=useState<Listing[]>([]);const [offset,setOffset]=useState(0);const [total,setTotal]=useState(0);const [busy,setBusy]=useState(true);const [error,setError]=useState('');
 async function search(page=0){setBusy(true);setError('');try{const x=await market({action:'read',mode:'search',filters,offset:page});setItems(x.items||[]);setTotal(x.total||0);setOffset(page);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 useEffect(()=>{void search();},[]); // Searches are explicit; no stale responses from per-keystroke requests.
 const set=(k:string,v:string)=>setFilters(f=>{const next={...f};if(v)next[k]=v;else delete next[k];return next;});
 return <><form className={panel+' grid gap-3 sm:grid-cols-3'} onSubmit={e=>{e.preventDefault();void search();}}>
 <input aria-label="Fahrzeuge suchen" placeholder="Marke, Modell oder Ort" className={input} onChange={e=>set('q',e.target.value)}/>
 <input aria-label="Preis bis EUR" type="number" min="0" placeholder="Preis bis EUR" className={input} onChange={e=>set('max_price',e.target.value?String(Math.round(Number(e.target.value)*100)):'')}/>
 <input aria-label="Kilometer bis" type="number" min="0" placeholder="Kilometer bis" className={input} onChange={e=>set('max_mileage',e.target.value)}/>
 <select aria-label="Kraftstoff" className={input} onChange={e=>set('fuel',e.target.value)}><option value="">Alle Kraftstoffe</option>{['Benzin','Diesel','Elektro','Hybrid','Plug-in-Hybrid','LPG','CNG','Andere'].map(x=><option key={x}>{x}</option>)}</select>
 <select aria-label="Getriebe" className={input} onChange={e=>set('transmission',e.target.value)}><option value="">Alle Getriebe</option><option>Automatik</option><option>Schaltgetriebe</option></select>
 <select aria-label="Sortierung" className={input} onChange={e=>set('sort',e.target.value)}><option value="newest">Neueste zuerst</option><option value="oldest">Älteste zuerst</option><option value="mileage_asc">Kilometerstand aufsteigend</option><option value="mileage_desc">Kilometerstand absteigend</option><option value="registration_desc">Erstzulassung: neueste zuerst</option><option value="registration_asc">Erstzulassung: älteste zuerst</option><option value="price_asc">Preis aufsteigend</option><option value="price_desc">Preis absteigend</option></select>
 <button className={button} disabled={busy}>{busy?'Suche läuft …':'Fahrzeuge entdecken'}</button></form>
 {error&&<p role="alert" className="my-4 text-rose-300">{error} <Link href="/affiliate/login">Anmelden</Link></p>}
 <p className="my-5 text-slate-300">{total} veröffentlichte Fahrzeuge</p>
 {!busy&&!error&&!items.length&&<div className={panel}>Noch keine passenden Fahrzeuge veröffentlicht. Jedes Inserat benötigt einen passenden, freigegebenen LUVIPRO Prüfbericht. <Link href="/inspections/checkout" className="text-cyan-300">Fahrzeug prüfen lassen</Link></div>}
 <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map(l=>{const v=l.vehicle||{};return <article key={l.id} className={panel+' overflow-hidden p-0 transition hover:border-cyan-300/60'}>
 {l.photos?.[0]&&<MarketPhoto id={l.photos[0].id} alt={String(v.brand)+' '+String(v.model)}/>}
 <div className="space-y-3 p-5"><span className="text-xs text-cyan-300">Mit LUVIPRO Prüfbericht</span><h2 className="text-xl font-semibold"><Link href={'/marketplace/vehicle/'+l.id}>{String(v.brand)} {String(v.model)} {String(v.variant||'')}</Link></h2><p className="text-2xl font-bold">{money(v.price_cents)}</p><p className="text-sm text-slate-300">{String(v.first_registration||'Erstzulassung nicht angegeben')} · {String(v.mileage||'–')} km · {String(v.fuel||'–')} · {String(v.transmission||'–')}</p><p>{String(v.city)} · {v.seller_type==='commercial'?'Gewerblich':'Privat'}</p><Link href={'/marketplace/vehicle/'+l.id+'#report'} className="text-cyan-300">LUVIPRO Prüfbericht ansehen →</Link></div></article>;})}</div>
 <nav className="mt-6 flex gap-3" aria-label="Ergebnisseiten"><button className={button} disabled={busy||offset===0} onClick={()=>void search(Math.max(0,offset-24))}>Zurück</button><button className={button} disabled={busy||offset+24>=total} onClick={()=>void search(offset+24)}>Weitere</button></nav></>;
}
