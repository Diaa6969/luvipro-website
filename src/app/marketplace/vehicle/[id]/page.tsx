import {MarketplaceShell} from '@/components/marketplace/shell';import {MarketDetail} from '@/components/marketplace/detail';
export default async function Page({params}:{params:Promise<{id:string}>}){return <MarketplaceShell><MarketDetail id={(await params).id}/></MarketplaceShell>;}
