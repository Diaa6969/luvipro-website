import {AccountOrderHistory} from "@/components/shop/account-order-history";
export const dynamic="force-dynamic";
export const metadata={title:"Meine Bestellungen | LUVIPRO",robots:{index:false,follow:false}};
export default function Orders(){return <main className="min-h-screen bg-obsidian px-5 py-16 text-white"><div className="mx-auto max-w-4xl"><AccountOrderHistory/></div></main>;}
