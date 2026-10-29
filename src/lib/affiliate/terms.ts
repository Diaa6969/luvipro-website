import type { LegalSection } from "@/components/ui/legal-page";

/**
 * Separately identifiable B2B affiliate terms, NOT consumer purchase terms.
 * Important: a submitted application does not create a paid mandate.
 * Individual written commission/gross-inclusive VAT/self-billing agreements
 * must be concluded prior to any active campaigns.
 */
export const affiliateTermsVersion = "2026-10-29";
export const affiliateAgbIntro = [
  "Stand: 29. Oktober 2026 · Fassung 2026-10-29",
  "Diese ergänzenden Teilnahmebedingungen gelten ausschließlich für gewerblich tätige Affiliate-/Werbepartner von LUVIPRO. Sie sind von den allgemeinen LUVIPRO AGB für Kunden, App-Nutzer und Partnerwerkstätten zu unterscheiden.",
  "Eine Bewerbung, die Registrierung oder das Absenden eines Gewerbenachweises ist lediglich eine Anfrage. Ein vergütungspflichtiger Affiliate-Vertrag entsteht erst nach ausdrücklicher Annahme durch LUVIPRO und einer gesonderten Vereinbarung über die konkreten Konditionen. Für den Provisionsbeginn ist die Freigabe des zugeordneten Codes erforderlich.",
];

export const affiliateAgbSections: LegalSection[] = [
  {
    title: "1. Anbieter und Vertragsparteien",
    paragraphs: [
      "Anbieter ist LUVIPRO – Diaa Alameen, Hannover, Deutschland. Die jeweils maßgeblichen ladungsfähigen Kontaktangaben ergeben sich aus dem Impressum unter /impressum; Anfragen zum Partnerprogramm: info@luvipro.de.",
      "Vertragspartner auf Affiliate-Seite ist ausschließlich die bei Annahme benannte selbstständig gewerblich tätige Person oder das rechtmäßig registrierte Unternehmen. Das Programm richtet sich nicht an Verbraucher in ihrer Eigenschaft als Verbraucher (§ 13 BGB).",
      "Die Bezeichnung „Affiliate“ oder „Werbepartner“ ist eine Beschreibung des Programms und entscheidet nicht über die rechtliche Einordnung einer Tätigkeit. Die tatsächliche Zusammenarbeit und gegebenenfalls zwingende Vorschriften über Handelsvertreter (§§ 84 ff. HGB), Arbeits- und Sozialversicherungsrecht gehen vor.",
    ],
  },
  {
    title: "2. Bewerbung, Gewerbenachweis und Aufnahme",
    paragraphs: [
      "Vorausgesetzt werden eine rechtlich zulässige selbstständige gewerbliche Tätigkeit und auf Verlangen ein geeigneter Gewerbe-/Register- oder gleichwertiger Tätigkeitsnachweis sowie die Richtigkeit der gemachten Angaben. Bei Personen oder Unternehmen außerhalb Deutschlands können ergänzende Prüfungen und gesonderte steuerliche Abreden erforderlich sein.",
      "LUVIPRO kann Bewerbungen nach sachlichen, nachvollziehbaren Kriterien prüfen und ablehnen. Ein Anspruch auf Aufnahme, bestimmte Codes, Exklusivität, Mindestumsatz oder Mindestprovision besteht durch die Bewerbung nicht.",
      "Vor Beginn einer vergütungspflichtigen Bewerbung müssen die Aufnahmebestätigung, die konkreten individuellen Vergütungskonditionen und die für eine Gutschrift erforderliche gesonderte Vereinbarung in nachweisbarer Form vorliegen. Die erfolgte Gewerbeprüfung oder das bloße Anlegen eines Kontos ersetzt diese Vereinbarungen nicht.",
      "Änderungen der Firmierung, Anschrift, steuerlichen Einordnung, Kontaktdaten oder Gewerbeberechtigung hat der Affiliate unverzüglich mitzuteilen; Nachweise sind bei berechtigtem Anlass zu aktualisieren.",
    ],
  },
  {
    title: "3. Zusätzliche Affiliate-Funktion im bestehenden Konto",
    paragraphs: [
      "Ein bereits bestehendes LUVIPRO Kunden- oder Partnerwerkstatt-Konto kann nach Identitäts- und Gewerbeprüfung eine zusätzliche Affiliate-Berechtigung erhalten. Ein neues Nutzerkonto ist dafür nicht notwendig; die bisherigen Rechte und Pflichten bleiben bestehen.",
      "Die Verknüpfung erfolgt über die bestätigte Kontoinhaberschaft oder nach dokumentierter manueller Zuordnung durch LUVIPRO. Zugangsdaten und Werbecodes sind vor unberechtigtem Zugriff zu schützen. Ein übertragbarer Anspruch auf die Weitergabe der persönlichen Affiliate-Berechtigung besteht nicht.",
    ],
  },
  {
    title: "4. Gegenstand der Werbekooperation und Selbstständigkeit",
    paragraphs: [
      "Der Affiliate kann auf eigene unternehmerische Verantwortung ausgewiesene LUVIPRO Produkte oder Leistungen bewerben und genehmigte Rabattcodes oder Links nutzen. Art und Umfang der konkret vergüteten Werbemaßnahmen sowie die einbezogenen Produkte ergeben sich aus der gesonderten Konditionenvereinbarung.",
      "Ohne gesonderte ausdrückliche Bevollmächtigung darf der Affiliate keine Verträge im Namen von LUVIPRO abschließen, keine Zahlungen für LUVIPRO einziehen, keine Garantien, Nachlässe oder Zusicherungen geben und sich nicht als Mitarbeiter, amtliche Prüfstelle oder gesetzlicher Vertreter ausgeben.",
      "Soweit keine im Einzelfall abweichende rechtlich wirksame Vereinbarung besteht, organisiert der Affiliate seine zulässigen Werbemaßnahmen eigenverantwortlich. Ob und welche zwingenden handelsvertreter-, arbeits- oder sozialrechtlichen Vorschriften gelten, hängt von der tatsächlichen Durchführung ab und wird durch diese Formulierung nicht ausgeschlossen.",
    ],
  },
  {
    title: "5. Werbekennzeichnung und rechtmäßiges Marketing",
    paragraphs: [
      "Der Affiliate muss kommerzielle Inhalte entsprechend dem jeweiligen Medium deutlich und rechtzeitig als „Werbung“ oder „Anzeige“ kennzeichnen und den kommerziellen Zusammenhang mit LUVIPRO wahrheitsgemäß offenlegen. Es gelten insbesondere § 5a UWG und § 6 DDG, soweit einschlägig.",
      "Unzulässig sind irreführende technische oder sicherheitsbezogene Aussagen, erfundene Prüfungen und Kundenbewertungen, gefälschte Vorher-Nachher-Belege, die Behauptung nicht nachgewiesener Zulassungen/CE-Prüfungen, garantierte Fahrzeugzustände oder die Darstellung eines UV-Tests als vollumfängliches Sachverständigengutachten.",
      "Unzulässig sind insbesondere unerbetene Werbe-E-Mails oder Direktnachrichten entgegen den geltenden Einwilligungs- und Wettbewerbsregeln, Spam, Täuschung über die Herkunft einer Empfehlung, unzulässiges Tracking, Markenverletzungen und manipulative Gutschein- oder Suchmaschinenwerbung.",
      "Gesetzlich vorgeschriebene Anbieterkennzeichnung, Datenschutzinformationen, Einwilligungen, Preisangaben und erforderliche Pflichtinformationen sind vom jeweiligen Werbenden für seine eigenen Kanäle einzuhalten. Eigene Werbemittel und verwendete Bilder müssen die nötigen Rechte besitzen.",
    ],
  },
  {
    title: "6. Nutzungsrechte an Marke und Werbemitteln",
    paragraphs: [
      "LUVIPRO gewährt für die Dauer einer aktiven Zusammenarbeit eine einfache, nicht übertragbare und widerrufliche Erlaubnis, ausdrücklich freigegebene LUVIPRO Namen, Logos, Produkttexte und Werbemittel ausschließlich für die vertraglich genehmigte Werbung zu verwenden. Eigentum an Marken, Designs oder Software wird nicht übertragen.",
      "Veränderungen, die Logos verfälschen, Markenregistrierungen im eigenen Namen, Domainnamen mit Verwechslungsgefahr und Werbung mit falscher offizieller Stellung sind ohne Zustimmung untersagt. Bei Beendigung sind freigegebene Materialien unverzüglich aus aktiv betriebenen Werbekanälen zu entfernen, soweit rechtlich und tatsächlich möglich.",
    ],
  },
  {
    title: "7. Rabattcodes: Vergabe, Änderung und Sperrung",
    paragraphs: [
      "LUVIPRO legt Codes ausschließlich durch autorisierte Mitarbeiter an und bestimmt für jeden Code separat die begünstigten Produkte, den Kundenrabatt, den Provisionssatz, den Gültigkeitszeitraum, mögliche Nutzungslimits und den Freigabestatus. Es gibt keinen automatisch garantierten Provisionssatz von 10 %.",
      "Nur tatsächlich aktivierte und zum Kaufzeitpunkt gültige Codes sind einlösbar. LUVIPRO darf Codes bei Missbrauchsverdacht, technischen Fehlern oder Rechtsrisiken vorübergehend sperren. Änderungen der Vergütungskonditionen für künftige Geschäfte bedürfen einer gesonderten Vereinbarung; bereits entstandene Provisionsansprüche werden nicht rückwirkend durch eine Codeänderung beseitigt.",
      "Verbraucher erhalten einen beworbenen Rabatt nur nach den im konkreten Angebot transparent mitgeteilten Bedingungen. Eine Kombination mit weiteren Aktionen ist nur möglich, soweit im Einzelfall ausgewiesen. Keine irreführende Werbung mit nicht tatsächlich verfügbaren Codes.",
    ],
  },
  {
    title: "8. Zuordnung von Käufen und Provisionsgrundlage",
    paragraphs: [
      "Für das vereinbarte Affiliate-Modell dient der einem Affiliate zugeordnete, beim Kauf wirksam eingelöste Rabattcode als technisches Zuordnungsmittel. Eine bloße Codegenerierung, ein Klick oder eine unverbindliche Bestellung allein löst keine Auszahlung aus. Andere ausdrücklich vereinbarte Zuordnungsmethoden sind möglich.",
      "Der vereinbarte Provisionssatz wird auf den Nettoverkaufspreis des jeweils provisionsfähigen Artikels nach wirksamen Kundenrabatten angewendet, ohne den auf den Verkauf entfallenden Umsatzsteuerbetrag. Separat berechnete Versandkosten und nicht provisionsfähige Leistungen werden nur ausgenommen, soweit dies wirksam vereinbart ist und zwingende gesetzliche Vorschriften nicht entgegenstehen.",
      "Es wird keine Provision für künstliche, gefälschte, rechtsmissbräuchliche oder eigenständig manipulierte Bestellungen geschuldet. Tatsächlich auf die Tätigkeit zurückzuführende Geschäfte sowie zwingende Rechte, insbesondere bei rechtlicher Einordnung als Handelsvertreter, bleiben nach den gesetzlichen Vorgaben zu berücksichtigen.",
    ],
  },
  {
    title: "9. Vergütung einschließlich Umsatzsteuer und Steuerverantwortung",
    paragraphs: [
      "Die individuell schriftlich vereinbarte Provisionsquote wird aus dem maßgeblichen Nettoverkaufspreis errechnet. Der sich so ergebende Eurobetrag ist – ausschließlich bei entsprechend klar vereinbarter Bruttopreisabrede – die gesamte Vergütung einschließlich einer gegebenenfalls auf die Affiliate-Leistung anfallenden Umsatzsteuer. Eine Umsatzsteuer wird in diesem Fall nicht zusätzlich auf den vereinbarten Gesamtbetrag aufgeschlagen.",
      "Rechenbeispiel (nur zur Erläuterung, kein zugesagter Provisionssatz): Kaufpreis 2.700,00 EUR netto nach Kundenrabatt × individuell vereinbarte 10 % = 270,00 EUR Gesamtvergütung. Bei regulärer inländischer Umsatzsteuer von 19 % sind darin 226,89 EUR Nettoentgelt und 43,11 EUR Umsatzsteuer enthalten. Bei wirksam angewendeter Kleinunternehmerregelung gemäß § 19 UStG werden keine 19 % Umsatzsteuer ausgewiesen; die Gesamtvergütung beträgt ebenfalls 270,00 EUR.",
      "Der Affiliate ist für die ordnungsgemäße Anmeldung seiner Tätigkeit, Einkommen- bzw. Körperschaftsteuer, gegebenenfalls Gewerbesteuer, Sozialversicherung sowie für seine eigenen steuerlichen Erklärungen und Pflichten verantwortlich. LUVIPRO übernimmt nicht pauschal die Steuerschulden des Affiliates.",
      "Die Umsatzsteuer muss dennoch nach der für den konkreten Umsatz maßgeblichen Rechtslage korrekt behandelt, auf zulässigen Belegen ausgewiesen und von der jeweils gesetzlich verpflichteten Person abgeführt werden. Eine bloße Klausel, dass „alle Steuern der Affiliate zahlt“, ändert gesetzliche Steuerpflichten, mögliche Steuerschuldnerschaft des Leistungsempfängers oder Rechnungsanforderungen nicht. Auslandsfälle oder Reverse-Charge-Sachverhalte bedürfen einer gesonderten steuerlichen Prüfung und schriftlichen Vereinbarung.",
      "Ändert sich die steuerliche Einstufung, insbesondere die Anwendbarkeit von § 19 UStG, muss der Affiliate dies rechtzeitig mitteilen. Die Bruttopreisabrede gilt nur, wenn sie für den konkreten Vertrag wirksam vereinbart ist; zwingendes Recht und individuelle ausdrückliche Vereinbarungen bleiben vorrangig.",
    ],
  },
  {
    title: "10. Provisionsentstehung, Rückgaben und Prüfung",
    paragraphs: [
      "Für die administrative Freigabe prüft LUVIPRO insbesondere Zahlungsnachweis, Ausführung bzw. nachgewiesene Lieferung, eindeutige Zuordnung des Geschäfts und bekannte Rückabwicklungen. Eine interne Sicherheitsfrist von mindestens 14 Tagen nach dokumentierter Warenlieferung – beziehungsweise eine längere im Einzelfall anwendbare Rückgabe- oder Widerrufsfrist – dient der Überprüfung. Sie bedeutet nicht, dass bei jedem B2B-Verkauf ein gesetzliches 14-tägiges Widerrufsrecht besteht.",
      "Rückerstattete oder endgültig nicht bezahlte Geschäfte sowie wirksam rückabgewickelte Geschäftsteile können nach den maßgeblichen gesetzlichen Regeln zu einer entsprechenden Provisionsanpassung führen. Für bereits rechtswirksam entstandene Ansprüche gilt keine pauschale rückwirkende Streichung; bei zwingend anwendbarem Handelsvertreterrecht gelten insbesondere §§ 87 bis 87c HGB.",
      "Technisch als „pending“ oder „eligible“ gekennzeichnete Beträge sind reine Statusanzeigen und ersetzen nicht die Prüfung der rechtlichen Fälligkeit eines Provisionsanspruchs. Nicht gerechtfertigte Zurückbehaltung über gesetzliche Fälligkeiten hinaus ist durch diesen Status nicht vereinbart.",
    ],
  },
  {
    title: "11. Monatliche Abrechnung und ausschließlich manuelle Auszahlung",
    paragraphs: [
      "LUVIPRO erstellt monatliche Provisionsübersichten mit den verifizierten, abgerechneten Vorgängen und dem jeweils maßgeblichen Abrechnungszeitraum. Soweit rechtlich ein Handelsvertreterverhältnis vorliegt, gelten dessen zwingende Abrechnungs-, Auskunfts-, Buchauszugs- und Fälligkeitsrechte insbesondere aus §§ 87a und 87c HGB uneingeschränkt.",
      "Eine Überweisung wird ausschließlich durch eine autorisierte Person von LUVIPRO über deren externen Bankzugang veranlasst. Die Plattform selbst bietet keine automatische Affiliate-Auszahlung. Der Administrator dokumentiert den tatsächlich erfolgten Zahlungsausgang anschließend mit Datum, Betrag und eindeutiger Bankreferenz; erforderlichenfalls zeigt die Plattform interne Zahlungserinnerungen.",
      "Eine fehlende technische Bestätigung im Admin-Bereich lässt eine rechtlich fällige Forderung nicht entfallen und ändert keine gesetzliche Zahlungsfrist. Der Affiliate stellt die für eine rechtmäßige Überweisung erforderlichen Zahlungsdaten sicher und kann unrichtige Abrechnungsstände zur Prüfung melden.",
    ],
  },
  {
    title: "12. Rechnungen, Gutschrift und E-Rechnung",
    paragraphs: [
      "Der Affiliate ist als leistender Unternehmer für die korrekte steuerliche Behandlung seiner Werbeleistung verantwortlich. Sofern zuvor ausdrücklich ein Gutschriftverfahren vereinbart wurde, kann LUVIPRO als Leistungsempfänger eine Gutschrift im umsatzsteuerrechtlichen Sinne ausstellen (§ 14 UStG). Die Vereinbarung und ein überprüftes Steuerprofil müssen vor dem ersten Gutschriftbeleg nachgewiesen sein.",
      "Eine Gutschrift muss die jeweils gesetzlichen Pflichtangaben sowie den eindeutigen Hinweis „Gutschrift“ enthalten. Der Affiliate hat das Dokument zu prüfen und etwaige Unstimmigkeiten unverzüglich mitzuteilen. Sein gesetzliches Widerspruchsrecht gegen eine Gutschrift bleibt unberührt. Ohne gültige Gutschriftvereinbarung stellt der Affiliate eine eigene ordnungsgemäße Rechnung aus, soweit gesetzlich erforderlich.",
      "Ein Beleg über den Bankzahlungsausgang ist keine steuerliche Rechnung. Wird nach der geltenden Rechtslage ein strukturiertes E-Rechnungsformat benötigt, ist ein bloßes PDF nicht ausreichend; Übergangsregelungen und steuerliche Ausnahmen sind zu beachten. Ausstellung, Zustellung, Berichtigung, Archivierung und Aufbewahrung richten sich nach den jeweils geltenden gesetzlichen Vorschriften.",
    ],
  },
  {
    title: "13. Werbungskosten, Mindestumsätze und Selbstkäufe",
    paragraphs: [
      "Ohne ausdrücklich vorherige Kostenübernahmevereinbarung trägt der Affiliate seine eigenen üblichen Werbe-, Reise-, Produktions- und Betriebskosten. LUVIPRO verspricht keine Mindestanzahl vermittelter Käufe, keine Mindesteinnahmen und keine Aufwandsentschädigung.",
      "Eigenkäufe und Käufe von nahestehenden Personen sind nicht grundsätzlich allein wegen der Beziehung ausgeschlossen. Ein Provisionsausschluss kommt nur bei nachweislichem Missbrauch oder aufgrund einer wirksamen, vorher transparent getroffenen Einzelvereinbarung in Betracht; zwingende Ansprüche bleiben gewahrt.",
    ],
  },
  {
    title: "14. Datenschutz, Nachweise und Vertraulichkeit",
    paragraphs: [
      "Die Verarbeitung von Gewerbenachweisen, Kontaktdaten, gegebenenfalls Steuerdaten, zugeordneten Bestellungen, Provisionsinformationen und Zahlungsbelegen richtet sich nach der LUVIPRO Datenschutzerklärung unter /datenschutz.",
      "Der Affiliate erhält nur die Daten, die für seine eigene Tätigkeit und die nachvollziehbare Abrechnung erforderlich sind. Personenbezogene Daten von Käufern dürfen nicht ohne tragfähige Rechtsgrundlage offengelegt, weiterverkauft oder für eigene, fremde Zwecke genutzt werden.",
      "Vertrauliche nicht öffentliche Konditionen, Sicherheitsinformationen und geschäftliche Unterlagen sind während der Zusammenarbeit und nach deren Ende vertraulich zu behandeln, soweit keine gesetzlichen Offenlegungsrechte oder Auskunftspflichten entgegenstehen.",
    ],
  },
  {
    title: "15. Verantwortlichkeit und Haftung",
    paragraphs: [
      "Der Affiliate ist für eigene Werbeaussagen, Kanalinhalte und selbst begangene Rechtsverstöße im Rahmen der gesetzlichen Vorschriften verantwortlich. LUVIPRO bleibt für eigenes Handeln, eigene Produktangaben und eigene gesetzliche Pflichten verantwortlich; eine pauschale Verlagerung fremder Pflichten findet nicht statt.",
      "Bei Vorsatz, grober Fahrlässigkeit und Schäden aus der Verletzung von Leben, Körper oder Gesundheit wird die Haftung nicht durch diese Teilnahmebedingungen beschränkt. Bei einfach fahrlässiger Verletzung wesentlicher Vertragspflichten können gesetzlich zulässige, angemessene Beschränkungen greifen; zwingende gesetzliche Haftung bleibt unberührt.",
      "Ein Anspruch auf Freistellung besteht nur, soweit der Affiliate eine nachweisbare, zurechenbare Pflichtverletzung zu vertreten hat und die gesetzlichen Voraussetzungen vorliegen; eine grenzenlose verschuldensunabhängige Freistellung wird nicht vereinbart.",
    ],
  },
  {
    title: "16. Laufzeit, ordentliche Kündigung und wichtige Gründe",
    paragraphs: [
      "Die Laufzeit und ordentliche Kündigung richten sich nach der individuellen Vereinbarung und den gesetzlich anwendbaren Vorschriften. Ohne eine wirksame abweichende Vereinbarung gelten die gesetzlichen Regelungen. Bei einem rechtlich bestehenden Handelsvertreterverhältnis sind insbesondere die Kündigungsfristen des § 89 HGB zu beachten.",
      "Das Recht beider Seiten zur außerordentlichen Kündigung aus wichtigem Grund (§ 89a HGB, soweit anwendbar) bleibt bestehen. Bei begründetem Betrugs- oder Sicherheitsverdacht kann eine verhältnismäßige vorläufige Sperre zur Prüfung erfolgen, ohne bestehende rechtmäßige Abrechnungs- und Informationsansprüche auszuschließen.",
      "Bereits entstandene Provisionsansprüche und zwingende Ansprüche aus § 89b HGB bleiben – soweit dessen Voraussetzungen vorliegen – auch bei Beendigung bestehen. Es wird kein Vorausverzicht auf zwingende gesetzliche Ausgleichsansprüche vereinbart.",
    ],
  },
  {
    title: "17. Änderungen, Rangfolge und Dokumentation",
    paragraphs: [
      "Maßgeblich sind die bei Abschluss nachweisbar einbezogene Fassung dieser Affiliate-Bedingungen und die individuellen Konditionen. Änderungen der Provisionshöhe, des einbezogenen Produktsortiments, der Steuer-/Bruttoabrede oder sonstiger wesentlicher Entgeltregeln gelten nicht allein durch eine Website-Aktualisierung; sie müssen für die Zukunft wirksam vereinbart werden.",
      "Individuelle rechtswirksame Abreden haben Vorrang vor diesen ergänzenden Teilnahmebedingungen, danach gelten diese Affiliate-Bedingungen und ergänzend die allgemeinen LUVIPRO AGB, soweit sie für das Partnerverhältnis sachlich passen und nicht widersprechen.",
      "Die Verfügbarkeit dieser Seite oder das Anklicken einer Bewerbungs-Checkbox ersetzt weder die individuelle Konditionenvereinbarung noch die erforderliche gesonderte Zustimmung zum Gutschriftverfahren. Gesetzliche Rechte, insbesondere die AGB-Kontrolle nach § 307 BGB, bleiben unberührt.",
    ],
  },
  {
    title: "18. Anwendbares Recht, Streitigkeiten und Kontakt",
    paragraphs: [
      "Es gilt deutsches Recht, soweit keine zwingenden entgegenstehenden Vorschriften anzuwenden sind. Eine ausschließliche Gerichtsstandsvereinbarung wird über diese öffentlich abrufbaren Bedingungen nicht pauschal getroffen.",
      "Für Rückfragen zu Teilnahme, Vergütung, Abrechnung, Rechnungen oder Beanstandungen: info@luvipro.de. Rechnungs- und Partnerunterlagen können unter Wahrung gesetzlicher Aufbewahrungs- und Prüfpflichten angefordert werden.",
      "Sollte eine Bestimmung unwirksam sein, bleiben die übrigen Bestimmungen im gesetzlich zulässigen Umfang wirksam; an ihre Stelle treten die gesetzlichen Vorschriften. Eine automatische, für den Partner nachteilige Ersetzungsklausel ist nicht vereinbart.",
    ],
  },
];