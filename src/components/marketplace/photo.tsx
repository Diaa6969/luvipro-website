'use client';
import {useEffect,useState} from 'react';
import {market} from './client';
export function MarketPhoto({id,alt,className='aspect-video w-full object-cover'}:{id:string;alt:string;className?:string}){
 const [url,setUrl]=useState('');const [error,setError]=useState(false);
 useEffect(()=>{let active=true;const load=()=>market({action:'photo',id}).then(x=>{if(active){setUrl(x.url);setError(false);}}).catch(()=>{if(active){setUrl('');setError(true);}});load();const timer=setInterval(load,25000);return()=>{active=false;clearInterval(timer);};},[id]);
 return url?<img src={url} alt={alt} className={className} onError={()=>{setUrl('');setError(true);}}/>:<div className={className+' flex items-center justify-center bg-slate-900 text-slate-400'}>{error?'Foto derzeit nicht verfügbar':'Foto wird geladen …'}</div>;
}
