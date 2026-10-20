import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "LUVIPRO | Fahrzeugprüfung",
  robots: { index: false, follow: true },
};

export default function MarketplacePage() {
  // The marketplace is outside the initial launch scope. Do not present
  // fake listings or an unfinished page. Keep legacy links functional.
  redirect("/verify");
}
