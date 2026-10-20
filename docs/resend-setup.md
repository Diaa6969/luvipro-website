# LUVIPRO – automatische Produktanfragen via Resend

## Stand
Die Next.js-Seite enthält den vollständigen Formular- und API-Ablauf für unverbindliche Anfragen zum LU3656060. Die API schickt Kundendaten und Gerätebestellung über Resend an `STORE_ORDER_EMAIL` und bestätigt die Anfrage erst, wenn Resend sie angenommen hat. Ohne Resend-Zugangsdaten bleibt diese Funktion **aus Sicherheitsgründen deaktiviert**. Stripe-Zahlungen bleiben davon völlig unabhängig und ebenfalls deaktiviert.

**Es wurde noch keine E-Mail von dieser Implementierung tatsächlich versendet.** Die Produktionsdomain wurde nicht berührt und keine geheimen Schlüssel in GitHub gespeichert.

## Resend einrichten (nur durch Account-Eigentümer)

1. Auf https://resend.com registrieren/anmelden.
2. Im Dashboard unter **Domains** eine Subdomain wie `send.luvipro.de` hinzufügen. Der Dienst zeigt eigene DNS-Records für DKIM/SPF/Verifizierung; exakt diese für die Subdomain im aktuellen DNS-Provider anlegen, ohne bestehende MX/Mail-Records der Domain `luvipro.de` zu löschen oder zu verändern.
3. Nach der Domainverifizierung unter **API Keys** einen Send-Key für diese Anwendung erzeugen.
4. In **Vercel → Projekt luvipro-website → Settings → Environment Variables** folgende Schlüssel **im Preview-Environment** hinterlegen:

    ```env
    RESEND_API_KEY=<Secret from Resend – NEVER paste into chat or Git>
    STORE_FROM_EMAIL=LUVIPRO <anfragen@send.luvipro.de>
    STORE_ORDER_EMAIL=customerservice@luvipro.de
    STORE_PREORDERS_ENABLED=false
    ```

    Den Absender `anfragen@send.luvipro.de` auf die tatsächlich bei Resend verifizierte Domain abstimmen.

5. **Preview redeployen** und zunächst Konfiguration, Datenschutzinformation, Spam-Schutz (z. B. Challenge/rate limit), Geschäftspostfach-Zustellung und Mailfilter prüfen. Bei freigegebenem Test `STORE_PREORDERS_ENABLED=true` **nur für Preview** setzen, erneut deployen.
6. Mit synthetischen Testdaten eine echte Anfrage aus Preview an das eigene Postfach senden. Auf E-Mail-Eingang, Bestellmenge, Preis 3000 EUR netto je Gerät, deutschen Versand 29.99 EUR netto **je Bestellung**, MwSt.-Hinweis, Reply-To und Referenznummer prüfen.
7. Erst nach ausdrücklicher Veröffentlichungserlaubnis eine identische Konfiguration für Production setzen und Production redeployen.

## Wichtige technische Details

- API: `POST /api/store/preorder`, JSON mit Artikel-ID, Menge, B2B-Firmendaten, Einwilligungs-Checkbox. Server validiert Mengen und Artikel-ID selbst.
- Zieladresse wird **ausschließlich serverseitig** aus `STORE_ORDER_EMAIL` gelesen. Der Besucher kann das Ziel nicht verändern.
- Der API-Schlüssel bleibt auf dem Server; **niemals** mit `NEXT_PUBLIC_` exponieren.
- Status `200` bedeutet Annahme durch die API – keine Garantie, dass der Empfänger das Mail tatsächlich zugestellt bekommen hat. Bei Fehlern eine echte Fehlermeldung anzeigen, keinen Erfolg vortäuschen.
- Vor öffentlicher Aktivierung DSGVO-Informationen zum Mailprovider, Löschfristen und robusten Spam-/Rate-Limit-Schutz prüfen.
- Benutzer- oder Zahlungsdaten werden nicht in einer separaten Datenbank gespeichert; automatische Auftragsannahme und Lagerverwaltung existieren nicht.
- Stripe-Verkauf ist eine eigene Funktion, die erst durch `STORE_CHECKOUT_ENABLED=true` plus Stripe-Konfiguration aktiviert wird.

## Versandkosten
Versand innerhalb Deutschlands ist zentral in `src/lib/store.ts` als `DEVICE.shippingNetCentsGermany=2999` definiert. Der Betrag ist **29,99 EUR netto pro Bestellung**, unabhängig von der Anzahl der Geräte (1 bis 10). Stripe Checkout erstellt dazu einen festen Versandposten mit `tax_behavior=exclusive`. Der Kunde sieht alle anwendbaren Steuern vor der Zahlung.

Falls 29,99 EUR **brutto** beabsichtigt war, muss diese Annahme vor Freischaltung geändert und mit Stripe Tax erneut getestet werden.

## Änderungen sicher zurücknehmen
Alles ist ausschließlich auf `feature/international-home-en-ar` committed. `main`/Vercel Production bleiben bis zu gesonderter Freigabe unverändert.
