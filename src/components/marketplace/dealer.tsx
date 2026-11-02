'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {market,Dealer,panel,button} from './client';
import {MarketBrowse} from './browse';
export function MarketDealer({id}:{id:string}){
 const [profile,setProfile]=useState<Dealer|null>(null),[ready,setReady]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let current=true;setProfile(null);setReady(false);setError('');market({action:'dealer',id}).then(p=>{if(current)setProfile(p);}).catch(()=>{if(current)setError('Händlerprofil konnte nicht geladen werden.');}).finally(()=>{if(current)setReady(true);});return()=>{current=false;};},[id]);
 if(!ready)return <p role="status">Händlerprofil wird geladen …</p>;
 if(!profile)return <section className={panel}><h1 className="text-2xl">Händler derzeit nicht verfügbar</h1><p role="status">{error||'Dieses Geschäft ist nicht für die öffentliche Anzeige freigegeben oder derzeit inaktiv.'}</p><Link href="/marketplace" className={button}>Zum Marketplace</Link></section>;
 return <><section className={panel+' mb-6'}><Link href="/marketplace" className="text-cyan-300">← Marketplace</Link><h1 className="my-4 text-3xl font-semibold">{profile.company_name}</h1>{profile.logo_url&&<img src={profile.logo_url} alt={profile.company_name+" Logo"} referrerPolicy="no-referrer" className="mb-4 max-h-24 max-w-52 object-contain"/>}{profile.business_description&&<p className="my-4 whitespace-pre-wrap">{profile.business_description}</p>}{profile.website_url&&<a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="my-4 block text-cyan-300">Unternehmenswebsite öffnen ↗</a>}<address className="not-italic">{profile.street} {profile.house_number}<br/>{profile.postal_code} {profile.city} · {profile.country}</address><p className="mt-4">Öffentlich freigegebene Geschäftsangaben. Kontakt und Fahrzeugpass über das jeweilige Inserat. Keine privaten Prüfunterlagen.</p></section><MarketBrowse key={id} dealerId={id}/></>;
}
