/** Single-product shop configuration. Never accept prices, product IDs or tax rates from a browser request. */
export const DEVICE = {
  sku: "LU3656060",
  brand: "LUVIPRO",
  title: "LUVIPRO LU3656060",
  wavelength: "365 nm",
  unitPriceNetCents: 300000,
  shippingNetCentsGermany: 2999, // fixed per order, NOT per unit, exclusive of tax
  currency: "EUR",
  minQuantity: 1,
  maxQuantity: 10,
} as const;

export const BUNDLE_ITEMS = [
  "1 × LUVIPRO LU3656060 UV-Prüfgerät",
  "2 × Akkus",
  "1 × Ladegerät",
  "1 × Transportkoffer",
  "1 × UV-Schutzbrille",
] as const;

export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100);

export type ShopInquiry = {
  sku: string;
  quantity: number;
  company: string;
  contact: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  country: "DE";
  vatId: string;
  note: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
  website: string; // hidden honeypot; must stay empty
};

function str(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max + 1) : "";
}

export function parseInquiry(payload: unknown): { ok: true; data: ShopInquiry } | { ok: false; message: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, message: "Ungültige Formulardaten." };
  }
  const raw = payload as Record<string, unknown>;
  const quantity = raw.quantity;
  const data: ShopInquiry = {
    sku: str(raw.sku, 30),
    quantity: typeof quantity === "number" ? quantity : NaN,
    company: str(raw.company, 120),
    contact: str(raw.contact, 120),
    email: str(raw.email, 160),
    phone: str(raw.phone, 60),
    street: str(raw.street, 180),
    postalCode: str(raw.postalCode, 12),
    city: str(raw.city, 120),
    country: "DE",
    vatId: str(raw.vatId, 40),
    note: str(raw.note, 1000),
    privacyAccepted: raw.privacyAccepted === true,
    termsAccepted: raw.termsAccepted === true,
    website: str(raw.website, 200),
  };

  if (data.sku !== DEVICE.sku || !Number.isInteger(data.quantity) || data.quantity < DEVICE.minQuantity || data.quantity > DEVICE.maxQuantity) {
    return { ok: false, message: "Bitte wählen Sie eine gültige Gerätemenge." };
  }
  if (!data.company || data.company.length > 120 || !data.contact || data.contact.length > 120) {
    return { ok: false, message: "Bitte geben Sie Ihren Firmen- und Ansprechpartnernamen an." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 160) {
    return { ok: false, message: "Bitte geben Sie eine gültige E-Mail-Adresse an." };
  }
  if (data.phone.length > 60 || data.vatId.length > 40 || data.note.length > 1000 || data.street.length > 180 || data.city.length > 120) {
    return { ok: false, message: "Bitte prüfen Sie die Länge Ihrer Angaben." };
  }
  if (!data.privacyAccepted) return { ok: false, message: "Bitte bestätigen Sie die Datenschutzhinweise." };
  if (data.website) return { ok: false, message: "Anfrage konnte nicht übermittelt werden." };
  return { ok: true, data };
}

export function isPreorderBackendReady() {
  return (
    process.env.STORE_PREORDERS_ENABLED === "true" &&
    Boolean(process.env.RESEND_API_KEY) &&
    Boolean(process.env.STORE_FROM_EMAIL) &&
    Boolean(process.env.STORE_ORDER_EMAIL)
  );
}

export function isStripeCheckoutReady() {
  return (
    process.env.STORE_CHECKOUT_ENABLED === "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    Boolean(process.env.STRIPE_PRICE_ID)
  );
}
