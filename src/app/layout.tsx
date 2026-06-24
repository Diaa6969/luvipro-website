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
  title: "LUVIPRO | Automobil-Verifizierungs-Ökosystem",
  description:
    "LUVIPRO verbindet UV-Inspektionsgeräte, verschlüsselte QR-Sticker, VIN-Suche, Fahrzeugschein-OCR und digitale Fahrzeugreports für den deutschen Gebrauchtwagenmarkt.",
  metadataBase: new URL("https://luvipro.de"),
  openGraph: {
    title: "LUVIPRO",
    description: "Das Verifizierungssystem für vertrauenswürdige Gebrauchtwagen.",
    url: "https://luvipro.de",
    siteName: "LUVIPRO",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
