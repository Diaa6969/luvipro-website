import type { LegalSection } from "@/components/ui/legal-page";

export const datenschutzIntro = [
  "Stand: [Datum einfügen]",
  "Diese Datenschutzerklärung informiert Nutzer, Fahrzeughalter, Käufer, Verkäufer, Partnerwerkstätten und Besucher darüber, welche personenbezogenen Daten im Zusammenhang mit der Nutzung der LUVIPRO Website, der LUVIPRO App, der Fahrzeugverifizierung, der VIN-Suche, der QR-Reports, der Partnerwerkstatt-Funktionen und des LUVIPRO Marktplatzes verarbeitet werden.",
  "Diese Seite ist jederzeit ohne Registrierung über die Website erreichbar.",
  "Hinweis: Diese Datenschutzerklärung ist ein Entwurf und muss vor produktiver Nutzung durch eine fachkundige Stelle rechtlich geprüft und vervollständigt werden.",
];

export const datenschutzSections: LegalSection[] = [
  {
    title: "Verantwortlicher",
    paragraphs: [
      "Verantwortlicher im Sinne der Datenschutz-Grundverordnung ist:",
      "[Unternehmensname einfügen]\n[Rechtsform einfügen]\nStandort: Hannover, Deutschland\n[vollständige ladungsfähige Anschrift einfügen]",
      "Projektverantwortlicher / Ansprechpartner: Diaa Alameen",
      "Telefon: +49 177 7969259",
      "Allgemeine Informationen: info@luvipro.de",
      "Kundenservice, Beschwerden und Datenschutzanfragen: customerservice@luvipro.de",
      "Falls ein Datenschutzbeauftragter bestellt wurde: [Kontaktdaten des Datenschutzbeauftragten einfügen]",
    ],
  },
  {
    title: "Allgemeine Grundsätze der Datenverarbeitung",
    paragraphs: [
      "LUVIPRO verarbeitet personenbezogene Daten ausschließlich, soweit dies zur Bereitstellung, Sicherheit, Nachvollziehbarkeit, Qualitätssicherung, Betrugsprävention und Weiterentwicklung der LUVIPRO Dienste erforderlich ist.",
      "Die Verarbeitung erfolgt insbesondere nach den Grundsätzen der Rechtmäßigkeit, Transparenz, Zweckbindung, Datenminimierung, Integrität, Vertraulichkeit und Speicherbegrenzung.",
    ],
  },
  {
    title: "Kategorien verarbeiteter Daten",
    paragraphs: ["Im Rahmen der LUVIPRO Dienste können insbesondere folgende Daten verarbeitet werden:"],
    list: [
      "Kontaktdaten von Nutzern, Kunden, Verkäufern und Partnern",
      "Fahrzeugdaten, VIN und fahrzeugbezogene Prüfdaten",
      "Bild- und UV-Prüfnachweise",
      "Standortdaten bei Nutzung der Werkstattsuche",
      "Dokumentendaten bei Fahrzeugschein-OCR",
      "zahlungsbezogene Transaktionsinformationen",
      "Partnerwerkstatt- und Prüferdaten",
      "technische Logdaten und Sicherheitsprotokolle",
    ],
  },
  {
    title: "Fahrzeugdaten und VIN",
    paragraphs: [
      "Zur Erstellung einer digitalen Fahrzeugidentität und eines verifizierbaren Fahrzeugreports verarbeitet LUVIPRO insbesondere Fahrzeugidentifikationsnummern, Hersteller, Modell, Basisdaten, Datum und Uhrzeit der Prüfung, Prüfergebnis, technische Prüffelder, Bewertungs- und Zustandsinformationen, QR-Report-ID sowie Verknüpfungen zwischen Fahrzeug, QR-Sticker und digitalem Report.",
      "Die VIN kann personenbezogen sein, wenn sie direkt oder indirekt einer Person, einem Fahrzeughalter, Verkäufer oder Käufer zugeordnet werden kann. Daher behandelt LUVIPRO VIN-bezogene Daten mit erhöhter Sorgfalt.",
    ],
  },
  {
    title: "Technische Prüffelder und digitale Fahrzeugidentität",
    paragraphs: [
      "Zur Erstellung der digitalen Fahrzeugidentität können technische Prüffelder gespeichert werden. Dazu gehören insbesondere technische Merkmale, Prüfzonen, Prüfstatus, Hinweise auf Lackabweichungen, Materialunterschiede, Reparaturspuren, Bildnachweise und verknüpfte Reportdaten.",
      "Diese Daten dienen der technischen Nachvollziehbarkeit, der Qualitätssicherung, der Betrugsprävention und der Bereitstellung eines strukturierten digitalen Fahrzeugreports.",
    ],
  },
  {
    title: "In-App-Kameradaten und UV-Bilddaten",
    paragraphs: [
      "Bei Nutzung der LUVIPRO App oder der Partnerwerkstatt-Funktionen können Bilder und Prüfdaten verarbeitet werden, die ausschließlich über die in der App vorgesehene Kamerafunktion aufgenommen werden.",
      "Dies kann Bilder unter normalem Licht, Bilder unter UV-Licht, Bilddaten relevanter Fahrzeugbereiche, visuelle Prüfnachweise, Zeitstempel der Aufnahme sowie Zuordnungen zu VIN, Prüfung, Werkstatt, Prüfer und Report umfassen.",
      "Die Verarbeitung dieser Bilddaten dient der Nachvollziehbarkeit der Fahrzeugprüfung, der Qualitätssicherung und dem Schutz vor nachträglicher Manipulation. Nach Abschluss und Sperrung eines Reports können bestimmte Prüfdaten und Bildnachweise dauerhaft oder langfristig gespeichert werden, soweit dies zur Integrität des Reports, zur Betrugsprävention, zur Nachweisführung und zur Wahrung berechtigter Interessen erforderlich ist.",
    ],
  },
  {
    title: "Standortdaten",
    paragraphs: [
      "Bei Nutzung bestimmter Funktionen, insbesondere bei der Suche nach einer Partnerwerkstatt oder bei einer nicht gefundenen VIN, kann die App den aktuellen Standort des Nutzers abfragen.",
      "Die Standortdaten werden ausschließlich verwendet, um dem Nutzer nahegelegene LUVIPRO Partnerwerkstätten anzuzeigen oder eine passende Prüfoption vorzuschlagen.",
      "Der aktuelle Standort wird grundsätzlich nicht dauerhaft gespeichert. Eine dauerhafte Speicherung erfolgt nicht zur Erstellung von Bewegungsprofilen. Eine Standortverarbeitung erfolgt nur, wenn der Nutzer die entsprechende Berechtigung im Endgerät erteilt hat.",
    ],
  },
  {
    title: "Dokumenten-Scanning und Fahrzeugschein-OCR",
    paragraphs: [
      "Wenn Nutzer oder Verkäufer im Rahmen des Marktplatzes oder einer Fahrzeugverifizierung ein offizielles Fahrzeugdokument, insbesondere den Fahrzeugschein, hochladen, kann LUVIPRO eine automatisierte Texterkennung, OCR, einsetzen.",
      "Zweck der Verarbeitung ist insbesondere das Auslesen relevanter Fahrzeugdaten, der Abgleich der VIN mit dem Fahrzeugdokument, die Prüfung der Datenkonsistenz, die Vermeidung falscher oder manipulierter Fahrzeugangaben und der Schutz der Integrität des Marktplatzes.",
      "Soweit technisch umgesetzt, wird die Originaldatei des hochgeladenen Dokuments nach erfolgreicher Prüfung und Abgleichung gelöscht oder durch eine datensparsame Prüfreferenz ersetzt. Gespeichert werden können insbesondere das Ergebnis des Abgleichs, Zeitstempel, Prüfstatus und technisch erforderliche Nachweise.",
      "Falls eine gesetzliche Pflicht, ein Sicherheitsinteresse oder ein Streitfall entgegensteht, kann eine längere Speicherung erforderlich sein. In diesem Fall wird die Speicherung auf das erforderliche Maß beschränkt.",
    ],
  },
  {
    title: "Zahlungsabwicklung",
    paragraphs: [
      "LUVIPRO speichert keine vollständigen Kreditkartendaten und keine vollständigen Bankverbindungsdaten auf eigenen Servern.",
      "Zahlungen werden, soweit angeboten, über externe Zahlungsdienstleister abgewickelt, zum Beispiel Stripe, PayPal oder vergleichbare Anbieter. Diese Zahlungsdienstleister verarbeiten Zahlungsdaten in eigener Verantwortung oder im Rahmen der jeweiligen vertraglichen und datenschutzrechtlichen Vereinbarungen.",
      "LUVIPRO erhält in der Regel nur transaktionsbezogene Informationen, beispielsweise Zahlungsstatus, Betrag, Rechnungsreferenz, Zeitpunkt und technische Zahlungsbestätigung.",
    ],
  },
  {
    title: "Partnerwerkstätten, Prüfer und Partnerkonten",
    paragraphs: ["Für Partnerwerkstätten können zusätzliche Daten verarbeitet werden, insbesondere:"],
    list: [
      "Name und Kontaktdaten der Werkstatt",
      "Adresse und Standort der Werkstatt",
      "Partner-ID sowie Prüfer- oder Nutzerkonten",
      "Prüfaktivitäten, erstellte Reports und QR-Sticker-Aktivierungen",
      "Buchungen und vermittelte Prüfungen",
      "Abrechnungs- und Provisionsdaten",
      "Audit- und Sicherheitsprotokolle",
    ],
  },
  {
    title: "Unveränderbarkeit von Reports und Schutz vor Manipulation",
    paragraphs: [
      "LUVIPRO ist darauf ausgelegt, die Integrität digitaler Fahrzeugreports zu schützen. Sobald ein Report finalisiert und gesperrt wurde, können die technischen Prüfdaten, Bildnachweise, Zeitstempel und zugehörigen Report-Daten aus Gründen der Nachvollziehbarkeit und Betrugsprävention grundsätzlich nicht frei geändert oder gelöscht werden.",
      "Soweit personenbezogene Daten betroffen sind, werden Betroffenenrechte berücksichtigt. Eine vollständige Löschung oder Änderung kann eingeschränkt sein, wenn überwiegende berechtigte Interessen, gesetzliche Pflichten, Nachweispflichten oder die Integrität eines finalisierten Reports entgegenstehen.",
    ],
  },
  {
    title: "Betrugsprävention, Missbrauchserkennung und rechtliche Durchsetzung",
    paragraphs: [
      "LUVIPRO kann Daten verarbeiten, um Manipulationen, missbräuchliche Nutzung, gefälschte Reports, unzutreffende Prüfungen, technische Eingriffe, unberechtigte Zugriffe oder sonstige Sicherheitsvorfälle zu erkennen und zu verhindern.",
      "Dazu können insbesondere Prüf- und Reportdaten, Bild- und UV-Prüfnachweise, VIN- und QR-Zuordnungen, Partner- und Prüfer-IDs, Zeitstempel, technische Logdaten, IP-Adressen, Geräte- und Sitzungsinformationen sowie Audit-Logs verarbeitet werden.",
      "Bei begründetem Verdacht auf Manipulation oder missbräuchliche Nutzung kann LUVIPRO betroffene Partnerkonten sperren, Reports als ungültig markieren, weitere Prüfungen einschränken und interne Prüfmaßnahmen durchführen.",
      "Soweit ein Verdacht auf strafbares Verhalten, Betrug, Urkundenfälschung, gewerbsmäßige Täuschung oder sonstige rechtswidrige Handlungen besteht, können Daten im rechtlich zulässigen Umfang zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen sowie zur Zusammenarbeit mit zuständigen Behörden verwendet werden.",
    ],
  },
  {
    title: "Hosting und technische Bereitstellung",
    paragraphs: [
      "Die Website und technische Dienste können über externe Hosting- und Infrastruktur-Anbieter betrieben werden, beispielsweise Vercel oder vergleichbare Anbieter.",
      "Beim Aufruf der Website können technische Zugriffsdaten verarbeitet werden, insbesondere IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seiten, Browsertyp und Browserversion, Betriebssystem, Referrer-URL, technische Statuscodes und übertragene Datenmenge.",
      "Diese Verarbeitung dient der sicheren, stabilen und performanten Bereitstellung der Website, der Fehleranalyse, der Missbrauchsprävention und der IT-Sicherheit.",
      "[Hosting- und Auftragsverarbeitungsdetails prüfen und ergänzen]",
    ],
  },
  {
    title: "Kontaktaufnahme",
    paragraphs: [
      "Wenn Nutzer LUVIPRO per Formular, E-Mail, Telefon oder über andere Kommunikationswege kontaktieren, werden die übermittelten Angaben verarbeitet, um die Anfrage zu bearbeiten.",
      "Dies kann insbesondere Name, E-Mail-Adresse, Telefonnummer, Unternehmensname, Nachrichtentext und technische Metadaten der Anfrage umfassen.",
      "Projektverantwortlicher / Ansprechpartner: Diaa Alameen. Standort: Hannover, Deutschland. Telefon: +49 177 7969259.",
      "Für allgemeine Informationen kann die Kontaktaufnahme über info@luvipro.de erfolgen. Für Kundenservice, Beschwerden und Datenschutzanfragen kann die Kontaktaufnahme über customerservice@luvipro.de erfolgen.",
    ],
  },
  {
    title: "Zwecke der Verarbeitung",
    list: [
      "Bereitstellung der Website und App",
      "Erstellung und Verwaltung digitaler Fahrzeugreports",
      "VIN-Suche und VIN-Abgleich",
      "QR-Sticker-Verknüpfung",
      "Fahrzeugschein-OCR und Dokumentenabgleich",
      "Partnerwerkstatt-Suche",
      "Marktplatz-Funktionen",
      "Termin- und Prüfungsvermittlung",
      "Zahlungsabwicklung über externe Anbieter",
      "Qualitätssicherung, Betrugsprävention und Missbrauchserkennung",
      "technische Sicherheit, Kundenservice und Kommunikation",
      "Rechtsdurchsetzung, Verteidigung gegen Ansprüche und Erfüllung gesetzlicher Pflichten",
    ],
  },
  {
    title: "Rechtsgrundlagen der Verarbeitung",
    list: [
      "Art. 6 Abs. 1 lit. b DSGVO, soweit die Verarbeitung zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen erforderlich ist.",
      "Art. 6 Abs. 1 lit. a DSGVO, soweit eine Einwilligung eingeholt wird, insbesondere bei bestimmten Standortfunktionen oder optionalen App-Berechtigungen.",
      "Art. 6 Abs. 1 lit. f DSGVO, soweit die Verarbeitung zur Wahrung berechtigter Interessen erforderlich ist, insbesondere zur IT-Sicherheit, Betrugsprävention, Qualitätssicherung, Nachweisführung und Integrität digitaler Reports.",
      "Art. 6 Abs. 1 lit. c DSGVO, soweit gesetzliche Pflichten bestehen.",
    ],
  },
  {
    title: "Speicherdauer",
    paragraphs: [
      "Personenbezogene Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke erforderlich ist.",
      "Für technische Zugriffsdaten gelten kürzere Speicherfristen, soweit keine Sicherheitsvorfälle oder Rechtsstreitigkeiten entgegenstehen.",
      "Finalisierte Fahrzeugreports, technische Prüfnachweise, Audit-Logs und QR-Verknüpfungen können länger gespeichert werden, soweit dies zur Integrität der Fahrzeughistorie, zur Betrugsprävention, zur Qualitätssicherung, zur Nachweisführung oder zur Wahrung berechtigter Interessen erforderlich ist.",
      "Dokumentenbilder, insbesondere Fahrzeugschein-Uploads, sollen nach erfolgreicher OCR-Prüfung und VIN-Abgleichung gelöscht oder auf datensparsame Prüfinformationen reduziert werden, soweit keine entgegenstehenden Gründe bestehen.",
      "Konkrete Speicherfristen werden im produktiven Betrieb dokumentiert und regelmäßig überprüft.",
    ],
  },
  {
    title: "Empfänger von Daten",
    paragraphs: [
      "Daten können, soweit erforderlich, an Hosting- und Infrastruktur-Anbieter, Zahlungsdienstleister, technische Dienstleister, Partnerwerkstätten, Kommunikationsdienstleister, Rechtsberater, Steuerberater, Behörden oder zuständige Stellen bei Sicherheits-, Betrugs- oder Rechtsfällen übermittelt werden.",
      "Eine Weitergabe erfolgt nur, wenn hierfür eine rechtliche Grundlage besteht oder der Nutzer eingewilligt hat.",
    ],
  },
  {
    title: "Drittlandübermittlungen",
    paragraphs: [
      "Soweit Dienstleister außerhalb der Europäischen Union oder des Europäischen Wirtschaftsraums eingesetzt werden, erfolgt eine Übermittlung personenbezogener Daten nur, wenn die gesetzlichen Voraussetzungen erfüllt sind.",
      "Dies kann insbesondere auf Grundlage eines Angemessenheitsbeschlusses, geeigneter Garantien oder Standardvertragsklauseln erfolgen.",
      "[Konkrete Dienstleister und Drittlandübermittlungen prüfen und ergänzen]",
    ],
  },
  {
    title: "Rechte der betroffenen Personen",
    paragraphs: [
      "Betroffene Personen haben nach Maßgabe der DSGVO insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit, Widerspruch, Widerruf einer Einwilligung mit Wirkung für die Zukunft sowie Beschwerde bei einer Datenschutzaufsichtsbehörde.",
      "Bei finalisierten Fahrzeugreports kann die Berichtigung oder Löschung technischer Prüfdaten eingeschränkt sein, wenn die Unveränderbarkeit des Reports, die Betrugsprävention, Nachweispflichten oder überwiegende berechtigte Interessen entgegenstehen. In solchen Fällen kann LUVIPRO stattdessen eine Ergänzung, Sperrung, Einschränkung oder Kennzeichnung prüfen.",
    ],
  },
  {
    title: "Beschwerderecht bei der Aufsichtsbehörde",
    paragraphs: [
      "Betroffene Personen haben das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.",
      "Sofern die Zuständigkeit gegeben ist, kann eine Beschwerde insbesondere bei der Landesbeauftragten für den Datenschutz Niedersachsen eingereicht werden.",
      "Landesbeauftragte für den Datenschutz Niedersachsen: [Adresse und Kontaktinformationen prüfen und ergänzen]",
    ],
  },
  {
    title: "Sicherheit der Verarbeitung",
    paragraphs: [
      "LUVIPRO setzt technische und organisatorische Maßnahmen ein, um personenbezogene Daten gegen Verlust, Manipulation, unberechtigten Zugriff, unbefugte Weitergabe und sonstige Risiken zu schützen.",
      "Dazu können insbesondere verschlüsselte Übertragung, verschlüsselte Speicherung, Zugriffsbeschränkungen, Rollen- und Rechtekonzepte, Audit-Logs, Schutz vor nachträglicher Manipulation, technische Prüfmechanismen und regelmäßige Sicherheitsüberprüfungen gehören.",
    ],
  },
  {
    title: "Keine automatisierte Einzelfallentscheidung",
    paragraphs: [
      "Soweit nicht ausdrücklich anders angegeben, findet keine ausschließlich automatisierte Entscheidung im Sinne von Art. 22 DSGVO statt, die gegenüber Nutzern rechtliche Wirkung entfaltet oder sie in ähnlicher Weise erheblich beeinträchtigt.",
      "Automatisierte Prüfungen, OCR-Abgleiche oder Plausibilitätsprüfungen dienen der technischen Unterstützung, Datenkonsistenz und Betrugsprävention.",
    ],
  },
  {
    title: "Änderungen dieser Datenschutzerklärung",
    paragraphs: [
      "LUVIPRO kann diese Datenschutzerklärung anpassen, wenn sich technische Funktionen, gesetzliche Anforderungen, Datenverarbeitungen oder Dienste ändern.",
      "Die jeweils aktuelle Version ist jederzeit auf der Website abrufbar.",
    ],
  },
  {
    title: "Kontakt für Datenschutzanfragen",
    paragraphs: [
      "Anfragen zum Datenschutz können gerichtet werden an: customerservice@luvipro.de",
      "Für allgemeine Informationen kann LUVIPRO unter folgender Adresse kontaktiert werden: info@luvipro.de",
      "Projektverantwortlicher / Ansprechpartner: Diaa Alameen. Standort: Hannover, Deutschland. Telefon: +49 177 7969259.",
      "Bitte geben Sie bei Anfragen möglichst an, auf welche Verarbeitung oder welchen Dienst sich Ihre Anfrage bezieht, damit wir diese effizient bearbeiten können.",
    ],
  },
];

export const agbIntro = [
  "Stand: [Datum einfügen]",
  "Diese Allgemeinen Geschäftsbedingungen regeln die Nutzung der LUVIPRO Website, der LUVIPRO App, der digitalen Fahrzeugreports, der QR-basierten Verifizierung, der Partnerwerkstatt-Funktionen, des Marktplatzes sowie weiterer digitaler Dienste von LUVIPRO.",
  "Hinweis: Diese AGB sind ein Entwurf und müssen vor produktiver Nutzung rechtlich geprüft und an das konkrete Geschäftsmodell, die Verträge, Zahlungsprozesse und Verbraucherinformationen angepasst werden.",
];

export const agbSections: LegalSection[] = [
  {
    title: "Anbieter",
    paragraphs: [
      "Anbieter der LUVIPRO Dienste ist:",
      "[Unternehmensname einfügen]\n[Rechtsform einfügen]\nStandort: Hannover, Deutschland\n[vollständige Anschrift einfügen]",
      "Projektverantwortlicher / Ansprechpartner: Diaa Alameen",
      "Telefon: +49 177 7969259",
      "Allgemeine Informationen: info@luvipro.de",
      "Kundenservice, Beschwerden und Support: customerservice@luvipro.de",
    ],
  },
  {
    title: "Geltungsbereich",
    paragraphs: [
      "Diese AGB gelten für alle Nutzer der LUVIPRO Dienste, insbesondere für Besucher der Website, App-Nutzer, Fahrzeughalter, Verkäufer, Käufer, Partnerwerkstätten, Prüfer, Marktplatz-Nutzer sowie Empfänger oder Käufer digitaler Fahrzeugreports.",
      "Für Partnerwerkstätten können ergänzende Partnerverträge, Leistungsbeschreibungen, technische Richtlinien und Preislisten gelten. Im Falle von Widersprüchen gehen ausdrücklich vereinbarte Partnerverträge diesen allgemeinen Bedingungen vor.",
    ],
  },
  {
    title: "Beschreibung der LUVIPRO Dienste",
    paragraphs: [
      "LUVIPRO ist ein Automobil-Verifizierungs-Ökosystem für den Gebrauchtwagenmarkt.",
      "Die Dienste können insbesondere professionelle UV-Inspektionsgeräte, QR-Sticker, QR-verknüpfte Fahrzeugreports, VIN-Suche, Fahrzeugschein-OCR, VIN-Abgleich, digitale PDF-Reports, Partnerwerkstatt-Suche, Termin- und Prüfungsvermittlung, Marktplatz-Funktionen für geprüfte Fahrzeuge sowie App-basierte Fahrzeugverifizierung umfassen.",
      "LUVIPRO entwickelt die Plattform laufend weiter. Einzelne Funktionen können sich ändern, erweitert, eingeschränkt oder vorübergehend deaktiviert werden.",
    ],
  },
  {
    title: "Keine Garantie für den Fahrzeugzustand",
    paragraphs: [
      "LUVIPRO stellt technische Werkzeuge, digitale Prüfprozesse, Dokumentationsmöglichkeiten und Reportfunktionen bereit.",
      "LUVIPRO garantiert nicht, dass ein Fahrzeug vollständig mangelfrei, unfallfrei, manipulationsfrei oder rechtlich unbelastet ist. Ein LUVIPRO Report ersetzt keine vollständige technische Begutachtung durch einen Sachverständigen, keine Hauptuntersuchung, keine rechtliche Beratung und keine eigenständige Kaufprüfung.",
      "Die Reports dienen der Erhöhung von Transparenz, Nachvollziehbarkeit und Datenintegrität im Gebrauchtwagenmarkt.",
    ],
  },
  {
    title: "Nutzung der Website und App",
    paragraphs: ["Nutzer verpflichten sich, die LUVIPRO Dienste nur rechtmäßig und bestimmungsgemäß zu nutzen. Untersagt ist insbesondere:"],
    list: [
      "falsche oder manipulierte Fahrzeugdaten einzugeben",
      "fremde VINs missbräuchlich zu verwenden",
      "gefälschte Dokumente hochzuladen",
      "technische Schutzmaßnahmen zu umgehen",
      "Reports zu verändern, zu fälschen oder missbräuchlich weiterzugeben",
      "QR-Sticker zu kopieren, zu manipulieren oder auf ein anderes Fahrzeug zu übertragen",
      "die Plattform für betrügerische Handlungen zu verwenden",
    ],
  },
  {
    title: "Fahrzeugdaten, VIN und Dokumente",
    paragraphs: [
      "Nutzer und Partner sind verpflichtet, nur korrekte, vollständige und wahrheitsgemäße Fahrzeugdaten bereitzustellen.",
      "Wenn ein Fahrzeugschein oder ein anderes offizielles Dokument hochgeladen wird, darf dies nur durch eine berechtigte Person erfolgen. Der Nutzer ist dafür verantwortlich, dass die hochgeladenen Angaben richtig und zur Nutzung im Rahmen der LUVIPRO Dienste freigegeben sind.",
    ],
  },
  {
    title: "Partnerwerkstätten und Prüfpflichten",
    paragraphs: [
      "Partnerwerkstätten verpflichten sich, Prüfungen sorgfältig, sachgerecht und nach den von LUVIPRO bereitgestellten technischen Richtlinien durchzuführen.",
      "Partnerwerkstätten und Prüfer dürfen insbesondere keine falschen Prüfergebnisse eingeben, keine nicht durchgeführten Prüfungen bestätigen, keine manipulierten Fotos oder Prüfdaten hochladen, keine QR-Sticker ohne tatsächliche Prüfung aktivieren, keine Reports für andere Fahrzeuge verwenden und keine Prüfergebnisse gegen Zahlung, Vorteil oder Absprache verfälschen.",
      "Die Partnerwerkstatt ist für die sorgfältige Durchführung der tatsächlichen Fahrzeugprüfung und die Richtigkeit der von ihr eingegebenen Prüfdaten verantwortlich.",
    ],
  },
  {
    title: "QR-Sticker und digitale Reports",
    paragraphs: [
      "QR-Sticker dienen der Verknüpfung eines Fahrzeugs mit einem digitalen LUVIPRO Report.",
      "QR-Sticker dürfen nur auf das geprüfte Fahrzeug angebracht oder diesem zugeordnet werden. Eine Übertragung auf ein anderes Fahrzeug ist untersagt.",
      "Digitale Reports können technische Prüfdaten, Bildnachweise, VIN-Informationen, Zeitstempel, QR-Verknüpfungen und weitere strukturierte Fahrzeugdaten enthalten.",
    ],
  },
  {
    title: "Unveränderbarkeit finalisierter Reports",
    paragraphs: [
      "Sobald ein Report finalisiert und gesperrt wurde, kann er aus Gründen der Nachvollziehbarkeit, Integrität und Betrugsprävention grundsätzlich nicht frei verändert oder gelöscht werden.",
      "Korrekturen können nur nach einem dokumentierten Prüfprozess erfolgen, sofern LUVIPRO dies technisch und rechtlich ermöglicht. LUVIPRO kann Korrekturen, Ergänzungen, Sperrvermerke oder Ungültigkeitskennzeichnungen vornehmen, wenn dies zur Wahrung der Datenintegrität erforderlich ist.",
    ],
  },
  {
    title: "Anti-Betrugs-Klausel und Manipulationsverbot",
    paragraphs: [
      "Jede Manipulation, Fälschung, bewusste Falscheingabe, unzutreffende Prüfbestätigung, technische Umgehung oder missbräuchliche Nutzung der LUVIPRO Dienste ist streng untersagt.",
      "Dies gilt insbesondere für gefälschte oder manipulierte Fahrzeugreports, vorsätzlich falsche Prüfdaten, manipulierte Bildnachweise, falsche VIN-Zuordnungen, unberechtigte QR-Sticker-Aktivierungen, Übertragung eines QR-Stickers auf ein anderes Fahrzeug, bewusste Falschangaben im Marktplatz, kollusives Zusammenwirken und Nutzung der Plattform zur Täuschung von Käufern oder Dritten.",
      "Bei begründetem Verdacht oder Nachweis einer Manipulation kann LUVIPRO den betroffenen Zugang sperren, Reports als ungültig markieren, Prüfungen oder Angebote stoppen, interne Prüfungen einleiten, rechtliche Schritte prüfen und zuständige Behörden oder Geschädigte informieren, soweit dies rechtlich zulässig oder erforderlich ist.",
    ],
  },
  {
    title: "Haftung bei Manipulation und falschen Prüfdaten",
    paragraphs: [
      "Partnerwerkstätten, Prüfer und Nutzer haften für vorsätzlich oder fahrlässig falsch eingegebene, manipulierte oder unvollständige Daten nach den gesetzlichen Vorschriften.",
      "Soweit Schäden dadurch entstehen, dass eine Partnerwerkstatt oder ein Prüfer falsche Prüfdaten eingibt, Prüfungen nicht ordnungsgemäß durchführt, Reports manipuliert oder unzutreffende Angaben bestätigt, liegt die Verantwortung grundsätzlich bei der handelnden Partnerwerkstatt, dem Prüfer oder der beteiligten Person.",
      "LUVIPRO übernimmt keine Verantwortung für vorsätzlich oder pflichtwidrig falsche Eingaben, manipulierte Prüfdaten oder betrügerische Handlungen Dritter, soweit LUVIPRO diese nicht selbst zu vertreten hat.",
      "Bei Verdacht auf Betrug, Urkundenfälschung, Computerbetrug oder sonstige strafbare Handlungen behält sich LUVIPRO vor, die Angelegenheit rechtlich prüfen zu lassen und im gesetzlich zulässigen Umfang mit Behörden zusammenzuarbeiten. Dies kann insbesondere Sachverhalte betreffen, die unter anderem nach § 263 StGB als Betrug bewertet werden könnten. Die endgültige rechtliche Bewertung obliegt den zuständigen Behörden und Gerichten.",
    ],
  },
  {
    title: "Marktplatz",
    paragraphs: [
      "Der LUVIPRO Marktplatz dient der Präsentation von Fahrzeugen mit strukturierten Fahrzeugdaten, QR-Verknüpfung und, soweit vorhanden, digitalen Reports.",
      "Verkäufer sind für die Richtigkeit ihrer Angaben verantwortlich. LUVIPRO kann Angebote ablehnen, sperren, entfernen oder prüfen, wenn Anhaltspunkte für falsche Angaben, fehlende Berechtigung, manipulierte Daten oder sonstige Verstöße bestehen.",
      "LUVIPRO ist nicht Partei eines Kaufvertrags zwischen Käufer und Verkäufer, sofern nicht ausdrücklich anders angegeben.",
    ],
  },
  {
    title: "VIN-Suche und Werkstattvermittlung",
    paragraphs: [
      "Die VIN-Suche kann anzeigen, ob zu einer VIN ein LUVIPRO Report oder eine Fahrzeugverknüpfung vorhanden ist.",
      "Wenn kein Report vorhanden ist, kann LUVIPRO dem Nutzer eine Partnerwerkstatt in der Nähe anzeigen oder eine Prüfoption vorschlagen.",
      "Eine Werkstattvermittlung stellt keine Garantie für Verfügbarkeit, Terminbestätigung, Prüfqualität oder einen bestimmten Fahrzeugzustand dar.",
    ],
  },
  {
    title: "Preise, Zahlungen und Gebühren",
    paragraphs: [
      "Für bestimmte Funktionen können Gebühren anfallen, insbesondere für Fahrzeugprüfungen, PDF-Reports, Marktplatz-Inserate, QR-Sticker, Partner-Bundles, vermittelte Prüfungen und weitere digitale Dienste.",
      "Konkrete Preise werden im jeweiligen Angebot, in der App, im Bezahlprozess oder in einer separaten Preisliste angezeigt.",
      "Zahlungen können über externe Zahlungsdienstleister erfolgen. LUVIPRO speichert keine vollständigen Kreditkartendaten oder vollständigen Bankdaten auf eigenen Servern.",
    ],
  },
  {
    title: "Verfügbarkeit",
    paragraphs: [
      "LUVIPRO bemüht sich um eine stabile Verfügbarkeit der Website, App und digitalen Dienste. Eine ununterbrochene Verfügbarkeit kann jedoch nicht garantiert werden.",
      "Wartung, technische Störungen, Sicherheitsmaßnahmen, externe Dienstleister oder höhere Gewalt können zu Einschränkungen führen.",
    ],
  },
  {
    title: "Geistiges Eigentum",
    paragraphs: [
      "Alle Inhalte, Marken, Designs, Texte, Grafiken, Reports, technischen Konzepte, Softwarebestandteile und Datenstrukturen der LUVIPRO Dienste sind rechtlich geschützt, soweit sie nicht ausdrücklich anders gekennzeichnet sind.",
      "Eine Nutzung außerhalb der vorgesehenen Plattformfunktionen ist ohne vorherige Zustimmung nicht gestattet.",
    ],
  },
  {
    title: "Datenschutz",
    paragraphs: ["Informationen zur Verarbeitung personenbezogener Daten finden sich in der Datenschutzerklärung unter: /datenschutz"],
  },
  {
    title: "Kündigung und Sperrung",
    paragraphs: [
      "LUVIPRO kann Nutzerkonten, Partnerzugänge oder Marktplatz-Angebote sperren oder kündigen, wenn ein Verstoß gegen diese AGB, Partnerverträge, technische Richtlinien, gesetzliche Vorschriften oder berechtigte Sicherheitsinteressen vorliegt.",
      "Bei schwerwiegenden Verstößen, insbesondere Manipulation, Betrug, falschen Prüfdaten oder Missbrauch von QR-Stickern, kann eine sofortige Sperrung erfolgen.",
    ],
  },
  {
    title: "Haftungsbeschränkung",
    paragraphs: [
      "LUVIPRO haftet nach den gesetzlichen Vorschriften bei Vorsatz und grober Fahrlässigkeit.",
      "Bei einfacher Fahrlässigkeit haftet LUVIPRO nur bei Verletzung wesentlicher Vertragspflichten und nur begrenzt auf den vertragstypischen, vorhersehbaren Schaden, soweit gesetzlich zulässig.",
      "Die Haftung für Schäden aus Verletzung von Leben, Körper oder Gesundheit bleibt unberührt.",
    ],
  },
  {
    title: "Änderungen der AGB",
    paragraphs: [
      "LUVIPRO kann diese AGB ändern, wenn technische, rechtliche oder wirtschaftliche Entwicklungen dies erforderlich machen.",
      "Die jeweils aktuelle Fassung wird auf der Website bereitgestellt. Bei registrierten Nutzern oder Partnern können Änderungen zusätzlich über geeignete Kommunikationswege mitgeteilt werden.",
    ],
  },
  {
    title: "Anwendbares Recht",
    paragraphs: ["Es gilt das Recht der Bundesrepublik Deutschland, soweit keine zwingenden Verbraucherschutzvorschriften entgegenstehen."],
  },
  {
    title: "Kontakt",
    paragraphs: [
      "Projektverantwortlicher / Ansprechpartner: Diaa Alameen",
      "Telefon: +49 177 7969259",
      "Für allgemeine Informationen: info@luvipro.de",
      "Für Kundenservice, Beschwerden und Support: customerservice@luvipro.de",
    ],
  },
  {
    title: "Schlussbestimmungen",
    paragraphs: ["Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt."],
  },
];

export const impressumIntro = [
  "Stand: [Datum einfügen]",
  "Hinweis: Dieses Impressum ist ein Platzhalter. Die vollständigen Anbieterangaben werden vor dem offiziellen geschäftlichen Betrieb und nach Abschluss der Unternehmensregistrierung ergänzt. Diese Seite muss vor produktiver Nutzung rechtlich geprüft und vervollständigt werden.",
];

export const impressumSections: LegalSection[] = [
  {
    title: "Angaben gemäß § 5 DDG",
    paragraphs: [
      "[Unternehmensname einfügen]",
      "[Rechtsform einfügen]",
      "Standort: Hannover, Deutschland",
      "[vollständige ladungsfähige Anschrift einfügen]",
    ],
  },
  {
    title: "Projektverantwortlicher / Ansprechpartner",
    paragraphs: ["Diaa Alameen"],
  },
  {
    title: "Kontakt",
    paragraphs: [
      "Telefon: +49 177 7969259",
      "Allgemeine Informationen: info@luvipro.de",
      "Kundenservice, Beschwerden und Datenschutzanfragen: customerservice@luvipro.de",
    ],
  },
  {
    title: "Umsatzsteuer-ID",
    paragraphs: ["[USt-IdNr. einfügen, falls vorhanden]"],
  },
  {
    title: "Registereintrag",
    paragraphs: ["[Registergericht und Registernummer einfügen, falls vorhanden]"],
  },
  {
    title: "Verantwortlich für den Inhalt",
    paragraphs: ["Diaa Alameen", "[vollständige Anschrift einfügen]"],
  },
  {
    title: "Rechtlicher Hinweis",
    paragraphs: [
      "LUVIPRO befindet sich in der Aufbauphase. Nach Abschluss der Unternehmensregistrierung werden die vollständigen Anbieterangaben, die Rechtsform und die vertretungsberechtigte Person ergänzt.",
    ],
  },
  {
    title: "Haftung für Inhalte",
    paragraphs: [
      "Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden, soweit gesetzlich zulässig.",
    ],
  },
  {
    title: "Haftung für Links",
    paragraphs: [
      "Diese Website kann Links zu externen Websites Dritter enthalten. Auf deren Inhalte haben wir keinen Einfluss. Für die Inhalte verlinkter Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.",
    ],
  },
];
