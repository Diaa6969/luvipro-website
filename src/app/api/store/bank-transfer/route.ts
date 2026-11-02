import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { parseInquiry } from "@/lib/store";
import { createBankOrder, createPromoBankOrder, isBankTransferReady } from "@/lib/bank-transfer/service";

import { AFFILIATE_COOKIE,verifyAffiliateToken } from "@/lib/affiliate/account";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  if (!isBankTransferReady()) return NextResponse.json({error:"Banküberweisung ist derzeit nicht freigeschaltet."},{status:503});
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host ||
      !req.headers.get("content-type")?.includes("application/json") ||
      Number(req.headers.get("content-length") || "0") > 12000) {
    return NextResponse.json({error:"Ungültige Anfrage."},{status:403});
  }
  try {
    const payload: unknown = await req.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload))
      return NextResponse.json({error:"Ungültige Bestelldaten."},{status:400});
    const key = (payload as Record<string,unknown>).requestKey;
    if (typeof key !== "string") return NextResponse.json({error:"Bestellreferenz fehlt."},{status:400});
    const parsed = parseInquiry(payload);
    if (!parsed.ok) return NextResponse.json({error:parsed.message},{status:400});
    if (!parsed.data.termsAccepted || !parsed.data.street || !parsed.data.postalCode || !parsed.data.city)
      return NextResponse.json({error:"Bitte AGB und vollständige Rechnungsadresse angeben."},{status:400});
    const forwardedIp = req.headers.get("x-vercel-forwarded-for") ||
      req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = createHmac("sha256", process.env.BANK_ORDER_RATE_SECRET!)
      .update(forwardedIp.trim().slice(0,90)).digest("hex");
    const quote=(payload as Record<string,unknown>).promoQuoteId;
    const code=(payload as Record<string,unknown>).promoCode;
    if(code&&!quote)return NextResponse.json({error:"Rabatt zuerst prüfen."},{status:422});
    let order;
    if(quote){
     if(typeof quote!=="string")throw Error("Invalid quote");
     const token=req.cookies.get(AFFILIATE_COOKIE)?.value;if(!token)return NextResponse.json({error:"Bitte mit bestehendem Konto anmelden."},{status:401});
     const user=await verifyAffiliateToken(token);
     order=await createPromoBankOrder(parsed.data,key,ipHash,user.id,quote);
    }else order=await createBankOrder(parsed.data,key,ipHash);
    return NextResponse.json(order,{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Bestellung konnte nicht automatisch abgeschlossen werden. Bitte kontaktieren Sie customerservice@luvipro.de und geben Sie Ihre Anfrage an. Wiederholen Sie die Zahlung nicht eigenständig."},{status:503});
  }
}
