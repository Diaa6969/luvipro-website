import type {Metadata} from "next";
import Link from "next/link";
import {AccountCheckout} from "@/components/shop/account-checkout";
export const metadata:Metadata={title:"Prüfung & Promo Code | LUVIPRO",robots:{index:false,follow:false}};
export default async function Checkout({searchParams}:{searchParams:Promise<{product?:string}>}){const p=await searchParams;return <main className="min-h-screen bg-obsidian px-5 py-16 text-white"><div className="mx-auto max-w-3xl"><Link href="/verify" className="text-cyan-300">← Fahrzeugprüfung</Link><h1 className="mb-8 mt-6 text-4xl font-bold">Prüfung & Bestellung</h1><AccountCheckout initialProduct={p.product}/></div></main>;}
