# LUVIPRO | Buchhaltung & Rechnungsarchiv
Stand: 26. Oktober 2026. Feature-Branch: `feature/international-home-en-ar`.

## Umgesetzte Funktionen (Code)

Die interne Verwaltungsseite liegt auf `/intern/finanzen`, der geschützte Login auf
`/intern/finanzen/login`. **Keine Verlinkung in der öffentlichen Navigation**.

- Zwei getrennte Rechnungstabellen je Geschäftsjahr:
  - **Ausgangsrechnungen**: rechtsgültig konfigurierte und als PDF erzeugte
    Rechnungen **der LUVIPRO-Betreibergesellschaft**. Nummer, Datum, Kunde,
    Bruttobetrag, E-Mail-Status und Download des gespeicherten PDFs. Ein
    unverbindlicher Produktinteressent wird **nicht** als Rechnung gezählt.
  - **Eingangsrechnungen**: Lieferanten, Rechnungsnummer, Datum, Betrag,
    Zahlungsstatus, Input-VAT-Kennzeichnung sowie Originalbeleg zum Download.
    Manuelles Hinzufügen mit PDF/PNG/JPG (max. 5 MB) in **privatem** Storage.
    Kein OCR, keine Schätzung aus Bildern, kein automatisch anerkanntes Vorsteuerrecht.
- **12-Monats-Tabelle** (Januar bis Dezember) + Jahressumme:
  Nettoumsatz, ausgewiesene Ausgangs-USt., Eingangsbelege brutto,
  manuell bestätigte Vorsteuer, vorläufige USt-Differenz und einfache Netto-Differenz.
- KPI-Karten fürs Geschäftsjahr, CSV/Excel Export aller Monatswerte und beider
  Rechnungstabellen. CSV-Zellen sind gegen Formel-Injection geschützt.
- Bereits implementierter Hardware-Rechnungsprozess speichert zukünftig
  `invoice_date`, `net_cents`, `vat_cents`, `gross_cents` als historische,
  unveränderliche Werte. Diese werden **nicht aus aktuellen Produktpreisen**
  rückwirkend neu gerechnet.
- Kein Einbeziehen von Fremdumsätzen: **Standard/Premium 59,99 / 119,99 EUR**
  sind Werkstattleistungen und nicht 1:1 LUVIPRO-Umsatz. LUVIPRO-Provisionen,
  Berichtdownloads und Abrechnungen müssen aus tatsächlich verifizierten
  Zahlungen oder Rechtsverhältnissen erst zusätzlich angeschlossen werden.

## Steuerliche Abgrenzung (sehr wichtig)

**Umsatzsteuer auf Ausgangsrechnungen minus bestätigte Vorsteuer** ist nur
eine Orientierung für 19%/7%/0%-Standardfälle. Finanzamt/UStVA hängt u.a.
an **Ist- vs. Sollversteuerung**, Anzahlungen, Liefer-/Leistungsdatum,
steuerfreien Umsätzen, innergemeinschaftlichen Leistungen, Einfuhrumsatzsteuer,
Rechnungskorrekturen und §19 UStG.

Die angezeigte **Netto-Differenz ist KEIN handels- oder steuerrechtlicher
Gewinn**. Bestandsveränderungen (Geräteinkauf als Vorrat), AfA,
Rückstellungen, Personal-/Geschäftsführergehalt, Körperschaftsteuer,
Gewerbesteuer und weitere Buchungskreise werden damit nicht berechnet.
USt ist keine Gewinnausgabe und keine Endsteuer auf den Unternehmensertrag.
Das Buchhaltungsmodul ersetzt weder einen Steuerberater, eine
ordnungsgemäße Finanzbuchhaltung noch ELSTER-USt-Voranmeldungen.

## Sicherheitskonzept

1. Feature ist **standardmäßig vollständig deaktiviert**.
   `ACCOUNTING_PANEL_ENABLED=false`.
2. Die HTTP-Seiten und privaten API-Endpunkte verlangen ein kryptografisch
   signiertes, 8 Stunden gültiges HttpOnly/SameSite=Strict Session-Cookie.
   Passwörter werden nie an den Browser als Antwort zurückgegeben.
   Zustandsänderungen akzeptieren nur Requests vom gleichen Origin.
3. `ACCOUNTING_ADMIN_PASSWORD` mindestens 24 Zeichen und
   `ACCOUNTING_SESSION_SECRET` mindestens 32 Zeichen; **als Vercel
   Preview-Environment-Secret**, niemals in Git, Chat oder Clientcode.
4. Datenabfragen und Storage-Downloads laufen serverseitig über
   `SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY`. Beide bleiben geheim.
5. Die neuen Tabellen haben RLS **ohne** `anon`/`authenticated` Policies
   und entziehen diesen Rollen sämtliche Tabellenrechte.
   Lieferantenbelege liegen im Bucket `luvipro-accounting` mit
   `public=false`. Supabase-Service-Role ist ausschließlich serverseitig.
6. Noch nicht produktionsreif: Brute-Force-Limits, MFA/SSO, Admin-Aktivitätslogs,
   Offsite-Backups, langfristige GoBD-konforme Unveränderlichkeit/Archivierung,
   Belegkorrekturen und differenzierte Mitarbeiterberechtigungen. Vor
   öffentlichem Deployment **müssen** diese Sicherheitsmaßnahmen geprüft
   werden. Ein eigenes Admin-Passwort ist eine anfängliche Preview-Lösung.

## Vorschlag für sichere Aktivierung (noch NICHT durchgeführt)

- **Niemals ungeprüft Produktions-SQL ausführen.** Backup und Freigabe
  erfordern separaten Arbeitsschritt. GitHub enthält lediglich
  `docs/sql/invoicing-schema.sql` (bestehender Entwurf) und
  `docs/sql/bookkeeping-extension.sql` (neu). Beide wurden **nicht**
  in der LUVIPRO Supabase-Projekt-Datenbank ausgeführt.
- Falls Datentabellen nur über Supabase Data API mit expliziten Grants
  sichtbar werden, die vorgesehenen Grants für `service_role` prüfen
  (es gibt **keine** Grants für anon oder authenticated).
- Lokale/Staging-Datenbank mit synthetischen Testrechnungen, dokumentierten
  und nicht abzugsfähigen Belegen, doppelten Lieferanten-Rechnungsnummern,
  fehlendem Upload und parallelen API-Zugriffen testen.
- `.env.local` oder Vercel Preview Secrets:
  `ACCOUNTING_PANEL_ENABLED=true`, `ACCOUNTING_ADMIN_PASSWORD`,
  `ACCOUNTING_SESSION_SECRET`, `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- Diese Zugangsdaten nie als `NEXT_PUBLIC_` veröffentlichen.
- Erst nach Security/Datenschutz/Steuer-Review und expliziter Nutzerfreigabe
  in Production deployen.

## Rückgängig machen
`main` und Vercel Production bleiben unverändert. Jede Änderung ist auf
dem Feature-Branch committed; einfach nicht mergen oder gezielt revertieren.
Es wurden **keine Live-Daten** angelegt, gelöscht oder geändert.
