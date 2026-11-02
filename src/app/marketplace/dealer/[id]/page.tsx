import {MarketplaceShell} from '@/components/marketplace/shell';
import {MarketDealer} from '@/components/marketplace/dealer';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <MarketplaceShell><MarketDealer id={id}/></MarketplaceShell>;}
