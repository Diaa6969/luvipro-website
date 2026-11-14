# Finance Center – Entwicklungsstand

Die vorhandene Finanzoberfläche verwendet weiterhin ihre Administratorprüfung. Die neue Journal-API verwendet dieselbe Prüfung. Nur der Server darf die Buchungsfunktion aufrufen. Die aktuell unterstützte CSV-Vorschau prüft EUR-Transaktionen und erkennt doppelte IDs innerhalb einer Datei.

## Prüfung und Freigabe

- Lokal: node scripts/test-finance-journal.mjs, node scripts/test-finance-bank-preview.mjs, node scripts/test-finance-invoice-xml.mjs und npm run type-check.
- Journal-SQL zuerst in einer isolierten Datenbank mit den Supabase-Rollen prüfen. Danach mit einem Testkonto die Admin-API, Mandantentrennung und genehmigte Kontenzuordnung prüfen.
- Vor einer späteren Produktionsfreigabe Backup und Wiederherstellung verifizieren. Bei Problemen nach Aktivierung zuerst FINANCE_JOURNAL_POSTING_ENABLED deaktivieren und Daten sichern. Bereits erfasste Buchungen über Storno korrigieren.
- XML-Archivskript und Journal-SQL wurden für die Freigabe vorbereitet. Produktivdaten und echte Rechnungsstellung erfordern gesonderte Freigabe.

## Nächste Schritte

1. Banktransaktionen je Konto dauerhaft mit eindeutiger Quell-ID speichern. Abgleich und Teilzahlungen atomar mit Journalbuchungen verbinden.
2. Kontenrahmen, Perioden und Prüfstatus hinzufügen. Danach Eingangs- und Ausgangsbelege in Buchungsvorschläge überführen und aus gebuchten Daten Auswertungen erstellen.
3. Belegentwürfe, Batch-Erfassung, sichere Versionen und Prüfschritte für PDF, OCR und eingebettetes CII ergänzen.
4. Strukturierte Ausgangsrechnungen mit unabhängiger EN-16931-Prüfung ergänzen. Originalprojekt in FlutterFlow und DATEV-Import separat verifizieren.
