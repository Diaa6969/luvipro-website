"use client";
import {useSiteLocale} from '@/components/ui/site-locale-bridge';
import {commerceCopy,type CommerceKey} from '@/lib/commerce-copy';

/** Render localized public interface copy without translating protected records. */
export function SitePhrase({id}:{id:CommerceKey}){
 const locale=useSiteLocale();
 return <>{commerceCopy(locale)[id]}</>;
}
