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
    "LUVIPRO verbindet professionelle UV-Fahrzeugprüfung, FIN/VIN-basierte Fahrzeugzuordnung und digitale Prüfberichte im Partnerwerkstatt-Netzwerk.",
  keywords: [
    "LUVIPRO",
    "Fahrzeugverifizierung",
    "Gebrauchtwagen",
    "VIN Prüfung",
    "UV Inspektion",
    "Partnerwerkstatt",
    "Fahrzeughistorie",
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
      "LUVIPRO verbindet UV-Fahrzeugprüfung, VIN-basierte Fahrzeugzuordnung und strukturierte digitale Prüfberichte für mehr Transparenz.",
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
      "Mehr Transparenz durch professionelle UV-Prüfung, FIN/VIN-basierte Berichte und Partnerwerkstätten.",
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
