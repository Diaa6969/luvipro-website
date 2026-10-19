import type { Metadata } from "next";
import { InternationalHome } from "@/components/international/international-home";

const title = "LUVIPRO | UV Vehicle Inspections & Digital Reports";
const description = "Discover LUVIPRO: UV-supported vehicle inspection, VIN-based report lookup and structured digital inspection reports. Partner network and app in preparation.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://luvipro.de/en",
    languages: {
      "de-DE": "https://luvipro.de/",
      "en": "https://luvipro.de/en",
      "ar": "https://luvipro.de/ar",
      "x-default": "https://luvipro.de/",
    },
  },
  openGraph: {
    title,
    description,
    url: "https://luvipro.de/en",
    locale: "en_GB",
    type: "website",
    siteName: "LUVIPRO",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function EnglishHomePage() {
  return <InternationalHome locale="en" />;
}
