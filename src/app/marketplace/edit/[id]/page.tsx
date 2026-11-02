import {MarketplaceShell} from '@/components/marketplace/shell';import {MarketEditor} from '@/components/marketplace/editor';
export default async function Page({params}:{params:Promise<{id:string}>}){return <MarketplaceShell><MarketEditor id={(await params).id}/></MarketplaceShell>;}
