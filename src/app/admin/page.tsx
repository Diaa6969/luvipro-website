import Link from 'next/link';
import {isAffiliatePageAdmin} from '@/lib/affiliate/admin-access';
export const metadata={title:'Admin Center | LUVIPRO',robots:{index:false,follow:false}};
export default async function Page(){
 if(!await isAffiliatePageAdmin())return <main className="min-h-screen bg-obsidian px-6 py-16 text-white"><h1 className="text-3xl">Admin Center</h1><p className="my-5">Dieser Bereich ist nur für autorisierte LUVIPRO Admins verfügbar.</p><Link href="/affiliate/login" className="text-cyan-300">Mit bestehendem Konto anmelden</Link></main>;
 return <main className="min-h-screen bg-obsidian px-6 py-16 text-white"><div className="mx-auto max-w-4xl"><p className="text-sm uppercase tracking-widest text-cyan-300">LUVIPRO · Nur Admin</p><h1 className="my-5 text-4xl font-semibold">Admin Center</h1><div className="grid gap-5 md:grid-cols-2"><Link href="/intern/finanzen/affiliate" className="rounded-2xl border border-violet-400/30 bg-violet-950/30 p-6"><h2 className="text-xl font-semibold">Affiliate-Verwaltung</h2><p className="mt-3 text-slate-300">Bewerbungen, Freigaben, Promo Codes, Provisionen, Abrechnungen und dokumentierte externe Zahlungen.</p></Link></div></div></main>;
}
