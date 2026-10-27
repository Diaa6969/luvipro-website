import { redirect } from "next/navigation";

/** Legacy URL only: never use QR/public tokens to retrieve report data.
 * Preserve harmless navigation for old bookmarks without exposing tokens.
 */
export default function LegacyReportRoute() {
  redirect("/reports");
}
