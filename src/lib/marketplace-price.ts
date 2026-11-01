/** Exact decimal EUR parsing. No floating point rounding or implicit NaN/zero. */
export function marketplacePriceCents(text: string): string {
  if (!/^\d{1,9}([.,]\d{1,2})?$/.test(text.trim())) throw new Error('Preis mit höchstens zwei Nachkommastellen eingeben.');
  const [euros, decimals = ''] = text.trim().replace(',', '.').split('.');
  const cents = BigInt(euros) * BigInt(100) + BigInt(decimals.padEnd(2, '0'));
  if (cents <= BigInt(0)) throw new Error('Preis muss größer als null sein.');
  return cents.toString();
}
