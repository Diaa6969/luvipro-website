# LUVIPRO website — Hostinger SMTP setup (2026-10-20)

## Confirmed mail settings

Hostinger "Connect apps & devices" shows that the existing customer-service mailbox is
`customerservice@luvipro.de`. Outbound email uses `smtp.hostinger.com`,
TCP port `465`, implicit SSL/TLS. This is **sending only**; the website does not
use IMAP/POP, and the existing LUVIPRO Flutter/Supabase app is unchanged.

The Next.js feature branch includes a server-only Nodemailer SMTP sender for device
inquiries and optional Stripe payment notifications:

- `src/lib/hostinger-smtp.ts`: TLS-verified SMTP on `smtp.hostinger.com:465`.
- `src/app/api/store/preorder/route.ts`: automatically mails one inquiry to the
  configured recipient, with product, quantity, fixed German shipping of
  **EUR 29.99 net per order**, sender contact information, and a reference.
  The success state appears only after SMTP accepts the message.
- `src/app/api/store/stripe-webhook/route.ts`: optional payment-alert emails for
  signed paid Stripe sessions. Actual payment remains OFF by default.
- `src/lib/store.ts`: `isPreorderBackendReady` uses Hostinger SMTP settings.

## Vercel setup — preview only at first

1. Open **Vercel → your LUVIPRO project → Settings → Environment Variables**.
2. Under the **Preview** environment add:

   | Key | Value |
   | --- | --- |
   | `SMTP_USER` | `customerservice@luvipro.de` |
   | `SMTP_PASSWORD` | Existing **mailbox password** for this Hostinger email address (secret, never paste in chat or commit to GitHub) |
   | `STORE_ORDER_EMAIL` | `customerservice@luvipro.de` |
   | `STORE_PREORDERS_ENABLED` | `false` initially |

   The SMTP server and port are fixed in the code, verified against the mailbox
   settings. Do not change the Hostinger mailbox password as it might also be
   used by the mobile app. Do not add `NEXT_PUBLIC_` to these secret keys.

3. Deploy/redeploy the **feature branch to Preview only**. Production does not
   change. Verify that the order form is visible and submission is disabled.
4. Before enabling public traffic, put a durable rate limiter and abuse/spam
   protection in front of the `/api/store/preorder` endpoint, and review the
   privacy-policy disclosures for email delivery and retention.
5. For an approved **test** on Preview, change
   `STORE_PREORDERS_ENABLED=true` **for Preview only**, redeploy, send a
   single synthetic request from the form to your own mailbox. Confirm
   sender, recipient, reply-to, reference, price and German shipping.
6. Once tested, seek **separate approval** before shipping to the production
   branch or enabling production SMTP. Stripe must remain independent and
   disabled until later.

### Known limitations

- The SMTP sender is operational *code*, but the live connection has **not**
  been verified without the mailbox credentials. No credentials are stored
  in GitHub or present in this chat.
- SMTP success means Hostinger accepted the message for delivery; it is
  not a guarantee that it arrived in the final inbox. Verify mailbox delivery.
- Mail delivery from a public Vercel endpoint can be abused without durable
  rate limiting and/or a challenge. The code checks origins and a honeypot,
  but these alone are insufficient for a public abuse-proof form.
- These messages do not automatically create a database record. The mailbox
  and Stripe Dashboard (when enabled) remain the operational records.
- The previous Resend integration has been removed from the active application
  code; do **not** configure `RESEND_API_KEY` for the new flow.

### Rollback

All changes are tracked in GitHub on
`feature/international-home-en-ar`. The unchanged `main` branch remains
the published reference until a separate approved merge.
