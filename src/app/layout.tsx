import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LUVIPRO – Digitale Fahrzeugverifizierung für den Gebrauchtwagenmarkt",
  description:
    "LUVIPRO verbindet UV-Inspektionsgeräte, QR-Reports, VIN-Suche, Fahrzeugschein-OCR und Partnerwerkstätten zu einem digitalen Verifizierungssystem für Gebrauchtwagen.",
  keywords: [
    "LUVIPRO",
    "Fahrzeugverifizierung",
    "Gebrauchtwagen",
    "VIN Prüfung",
    "UV Inspektion",
    "QR Report",
    "Partnerwerkstatt",
    "Fahrzeughistorie",
    "Fahrzeugschein OCR",
    "Gebrauchtwagen Prüfung",
  ],
  metadataBase: new URL("https://luvipro.de"),
  alternates: {
    canonical: "https://luvipro.de",
  },
  icons: {
    icon: "/brand/luvipro-logo.png",
    apple: "/brand/luvipro-logo.png",
  },
  openGraph: {
    title: "LUVIPRO – Digitale Fahrzeugverifizierung",
    description:
      "Ein vernetztes System aus UV-Inspektionsgeräten, QR-Stickern, VIN-Suche, OCR und digitalen Reports für mehr Transparenz im Gebrauchtwagenmarkt.",
    url: "https://luvipro.de",
    siteName: "LUVIPRO",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/brand/luvipro-logo.png",
        width: 1024,
        height: 512,
        alt: "LUVIPRO",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LUVIPRO – Digitale Fahrzeugverifizierung",
    description:
      "Mehr Transparenz für Gebrauchtwagen durch UV-Prüfung, QR-Reports, VIN-Suche und Partnerwerkstätten.",
    images: ["/brand/luvipro-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de-DE">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
