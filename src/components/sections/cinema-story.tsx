import { CinemaVehicle } from "@/components/ui/cinema-vehicle";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Camera, FileCheck2, Fingerprint, Lightbulb, LockKeyhole, Smartphone, Store, Wrench } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CinemaMotion } from "@/components/ui/cinema-motion";
import { CtaLink } from "@/components/ui/cta-link";

const chapters = [
  {
    id: "scanner", label: "UV-gestützte Prüfung", title: "Nicht alles ist auf den ersten Blick sichtbar.",
    description: "LUVIPRO ergänzt die Fahrzeugprüfung durch UV-gestützte Dokumentation. Unterschiede in Lack und Material können Hinweise auf Nachlackierungen und Reparaturspuren geben. Auffällige Bereiche werden in der Werkstatt genauer geprüft.",
    icon: Camera,
  },
  {
    id: "technology", label: "365 nm UV", title: "Technologie, die genauer hinsehen hilft.",
    description: "Das UV-Gerät unterstützt Fachkräfte bei der Sichtprüfung von Oberflächen. Die Werkstatt dokumentiert die Beobachtungen im LUVIPRO System.",
    icon: Lightbulb, links: [["LUVIPRO Gerät entdecken", "/products"]],
  },
  {
    id: "documentation", label: "LUVIPRO App", title: "Jede Prüfung. Digital dokumentiert.",
    description: "Die Werkstatt erfasst Fahrzeugdaten und die FIN, dokumentiert die Prüfschritte und ergänzt die Ergebnisse um Fotos und Videomaterial.",
    icon: Smartphone, steps: ["Fahrzeugdaten und FIN", "Prüfschritte und Fotos", "Videodokumentation", "Bericht abschließen"],
    links: [["LUVIPRO App entdecken", "/app"]],
  },
  {
    id: "digital-report", label: "Digitaler Prüfbericht", title: "Aus einer Prüfung wird nachvollziehbare Dokumentation.",
    description: "Die FIN ordnet die dokumentierten Ergebnisse und Medien dem Fahrzeug zu. Berechtigte Nutzer können den abgeschlossenen Bericht abrufen und als PDF herunterladen.",
    icon: FileCheck2, steps: ["FIN / VIN", "Prüfumfang", "Foto- und Videodokumentation", "Geschützter PDF-Zugriff"],
    links: [["Prüfbericht suchen", "/reports"]],
  },
  {
    id: "premium-history", label: "Premium · In Planung", title: "Fahrzeughistorie als zusätzliche Informationsquelle.",
    description: "Für Premium prüft LUVIPRO, welche externen Fahrzeugdaten die Werkstattprüfung ergänzen könnten. Verfügbarkeit und Umfang hängen von den Datenquellen ab.",
    icon: Fingerprint, steps: ["Schadenhistorie", "Kilometerstände", "Frühere Zulassungen", "Wartungs- und historische Einträge"],
  },
  {
    id: "workshops", label: "Partnernetzwerk", title: "Technologie trifft Werkstattkompetenz.",
    description: "Partnerwerkstätten prüfen das Fahrzeug vor Ort, dokumentieren ihre Beobachtungen und erstellen den digitalen Prüfbericht. Über die Werkstattsuche können Kunden die Verfügbarkeit einer Prüfung anfragen.",
    icon: Wrench, links: [["Partnerwerkstatt finden", "/partner-workshops"], ["Partner werden", "/contact"]],
  },
  {
    id: "vehicle-listing", label: "Marketplace", title: "Fahrzeuge entdecken. Informationen besser verstehen.",
    description: "Ein Inserat kann Fotos, Preis, Fahrzeugdaten und Verkäuferinformationen mit einem LUVIPRO Prüfbericht verbinden. Der Bericht bleibt über den bestehenden geschützten Zugang abrufbar.",
    icon: Store, links: [["Marketplace entdecken", "/marketplace"], ["LUVIPRO Prüfbericht ansehen", "/reports"]],
  },
  {
    id: "ecosystem", label: "LUVIPRO", title: "Ein System. Mehr Transparenz.",
    description: "Von der Sichtprüfung in der Werkstatt bis zum Inserat bleiben die dokumentierten Informationen dem Fahrzeug zugeordnet.",
    icon: LockKeyhole, links: [["UV-Gerät", "/products"], ["Partnerwerkstatt", "/partner-workshops"], ["LUVIPRO App", "/app"], ["Prüfbericht", "/reports"], ["Marketplace", "/marketplace"]],
  },
];

export function CinemaStory() {
  return <>
    <div className="cinema-story" lang="de" dir="ltr">
      <CinemaMotion className="cinema-opening">
        <CinemaVehicle priority />
        <div className="section-shell cinema-opening-copy">
          <p className="cinema-label">LUVIPRO</p>
          <h1>Jedes Fahrzeug hat eine Geschichte.</h1>
          <p>Wir bringen die Wahrheit ans Licht.</p>
        </div>
        <div className="section-shell cinema-opening-actions">
          <a href="#scanner"><ArrowDown size={16} aria-hidden="true" /> Geschichte entdecken</a>
          <a href="#direktzugriff">Direkt zu den Angeboten <ArrowUpRight size={16} aria-hidden="true" /></a>
        </div>
      </CinemaMotion>
      <div id="direktzugriff" className="section-shell cinema-shortcuts scroll-mt-24" tabIndex={-1}>
        <CtaLink href="/verify#partner-map">Fahrzeug prüfen lassen</CtaLink>
        <CtaLink href="/reports" variant="secondary">Prüfbericht suchen</CtaLink>
        <CtaLink href="/marketplace" variant="secondary">Marketplace entdecken</CtaLink>
      </div>
      {chapters.map(({ id, label, title, description, icon: Icon, links, steps }) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
          <CinemaMotion className={`cinema-chapter cinema-chapter-${id}`}>
            <div className="section-shell cinema-chapter-grid">
              <div className="cinema-copy">
                <p className="cinema-label">{label}</p>
                <h2 id={`${id}-title`}>{title}</h2>
                <p className="cinema-description">{description}</p>
                {links && <div className="cinema-chapter-links">
                  {links.map(([name, href]) => <Link key={href} href={href}>{name}<ArrowUpRight size={16} aria-hidden="true" /></Link>)}
                </div>}
              </div>
              <div className="cinema-chapter-art">
                <CinemaVehicle />
                {id === "scanner" && <label className="cinema-uv-control"><input type="checkbox" /> UV-Licht einblenden</label>}
                {steps && <div className="cinema-evidence">
                  <Icon size={23} aria-hidden="true" />
                  <p>{id === "premium-history" ? "Mögliche Datenquellen" : "Beispielhafter Ablauf"}</p>
                  <ol>{steps.map(step => <li key={step}>{step}</li>)}</ol>
                </div>}
              </div>
            </div>
          </CinemaMotion>
        </section>
      ))}
    </div>
  </>;
}

export function CinemaEnding() {
  return <section aria-labelledby="cinema-ending-title" lang="de" dir="ltr">
    <CinemaMotion className="cinema-ending">
      <CinemaVehicle />
      <div className="section-shell cinema-ending-copy">
        <BrandLogo />
        <h2 id="cinema-ending-title">Vertrauen ist gut, LUVIPRO ist besser.</h2>
        <div className="cinema-shortcuts">
          <CtaLink href="/verify#partner-map">Fahrzeug prüfen lassen</CtaLink>
          <CtaLink href="/products" variant="secondary">Gerät entdecken</CtaLink>
          <CtaLink href="/marketplace" variant="secondary">Marketplace entdecken</CtaLink>
        </div>
      </div>
    </CinemaMotion>
  </section>;
}
