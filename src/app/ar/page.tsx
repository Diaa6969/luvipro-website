import { languageAlternates } from "@/lib/site-locales";
import type { Metadata } from "next";
import { InternationalHome } from "@/components/international/international-home";

const title = "LUVIPRO | فحص السيارات بالأشعة فوق البنفسجية والتقارير الرقمية";
const description = "تعرّف على LUVIPRO: فحص السيارات بالأشعة فوق البنفسجية، والبحث عن التقارير برقم الهيكل VIN، وتقارير الفحص الرقمية. يجري التحضير لإطلاق التطبيق وشبكة الشركاء.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://luvipro.de/ar",
    languages: languageAlternates,
  },
  openGraph: {
    title,
    description,
    url: "https://luvipro.de/ar",
    locale: "ar",
    type: "website",
    siteName: "LUVIPRO",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function ArabicHomePage() {
  return <InternationalHome locale="ar" />;
}
