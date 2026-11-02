import Link from 'next/link';
import {MarketplaceShell} from '@/components/marketplace/shell';
import {MarketAdmin} from '@/components/marketplace/admin';
import {isAffiliatePageAdmin} from '@/lib/affiliate/admin-access';
export const metadata={title:'Marketplace Verwaltung | LUVIPRO',robots:{index:false,follow:false}};
export default async function Page(){if(!await isAffiliatePageAdmin())return <MarketplaceShell><h1>Admin-Zugang erforderlich</h1><p>Nur autorisierte LUVIPRO Admins können diesen Bereich öffnen.</p><Link href="/affiliate/login">Mit bestehendem Konto anmelden</Link></MarketplaceShell>;return <MarketplaceShell><Link href="/admin" className="text-cyan-300">← Admin Center</Link><MarketAdmin/></MarketplaceShell>;}
