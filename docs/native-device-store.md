# LUVIPRO native device store / product ordering — implementation log

Branch: `feature/international-home-en-ar` (extends earlier untranslated German homepage and translated English/Arabic homepages).
The public `main` branch has not been changed. **No live sales, charges or production deployment were performed.**

## What is implemented

- `/products`: complete premium single-device page for **LU3656060**, `365 nm`, **3,000 EUR net** per device, product description, CSS concept visualization, planned bundle contents, specifications, FAQ and two order paths. Does not assert certification or current availability; product illustration explicitly marked as a concept (not an actual photo).
- `/order?mode=preorder`: B2B company/contact form, optional shipping address, quantity 1–10, total in EUR net, privacy acknowledgement, success/error notice. With no email service configured, **the submit button is disabled** and a visible notice provides the contact address. When configured, the form sends directly to the server and shows a reference number only after the email provider accepts the message. This is an inquiry, not a binding sale.
- `/order?mode=buy`: same form with AGB acknowledgement and clearly **disabled payment** until explicitly configured on the server. No charge can occur without the secrets and the enabling flag.
- `/api/store/preorder`: input checks and email to LUVIPRO via Resend REST once enabled. No database or production Supabase records touched.
- `/api/store/checkout`: Stripe-hosted Checkout prepared for one product only, price fetched and independently validated (active, one-time, EUR 3,000, exclusive tax), 1–10 quantity, invoice request, Germany shipping, Stripe Tax, tax ID collection. Price cannot be overridden by the browser. **Off by default**.
- `/api/store/stripe-webhook`: validates signed Stripe events and offers optional merchant email for confirmed paid checkout sessions. Stripe Dashboard holds the actual transaction records; notification email deduplication uses the provider's ~24h idempotency window. No auto-fulfillment.
- `/order/success`: queries Stripe server-side for the session status; never declares payment success based only on a URL parameter.
- Links in navigation, German and international homepage, footer and old Shopify card now point to native `/products`; legacy routes `/payment-success` and `/r/[token]` are not changed.
- `.env.example` lists safe disabled-by-default configuration flags and secret names.
- `.github/workflows/international-shop-ci.yml`: isolated Actions build check on the feature branch.

## No-launch defaults

With the example/default environment:
- `STORE_PREORDERS_ENABLED=false`: the form is displayed in preview mode but cannot submit; customer can contact us using the displayed mail link.
- `STORE_CHECKOUT_ENABLED=false`: direct card payments are unavailable; `/api/store/checkout` returns 503 before any Stripe call.
- `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, etc. remain **unset**. Never commit keys to Git.
- The purchase UI can be reviewed without triggering real sales.
- The standard German `/agb` and `/datenschutz` texts remain the existing drafts and **must be reviewed against the actual ordering flows** before enabling acceptance of legally binding orders.

## When the user decides to activate preorder submissions

1. Prepare a Resend account and verify an authorized sender domain (coordinate DNS carefully; existing mail records must be preserved).
2. Configure `RESEND_API_KEY`, `STORE_FROM_EMAIL` (verified sender), `STORE_ORDER_EMAIL` on Vercel/locally without putting keys in Git.
3. Test with synthetic form entries, spam/rate-limit defenses (e.g. Turnstile / centrally enforced limits), delivery, error states and the destination mailbox.
4. Only after approval change `STORE_PREORDERS_ENABLED=true`. A non-binding inquiry must not be represented as an accepted purchase order.

## When the user decides to activate direct checkout

1. Establish/verify a Stripe merchant account and customer, tax, VAT ID, shipping, invoice and receipt configuration.
2. Create a Stripe one-time Price of **300000 cents EUR** with **exclusive** taxes for LU3656060; configure a valid Germany shipping Rate and Stripe Tax (must be tested).
3. Configure `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_SHIPPING_RATE_ID`, `STRIPE_WEBHOOK_SECRET` in server-side environment. In Stripe register `https://luvipro.de/api/store/stripe-webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Test full Stripe **test mode** checkout, cancelled checkout, taxes/invoice, valid/invalid payment status, shipping, refund, duplicate webhook and fulfillment workflow. Confirm that merchant order notifications arrive.
5. Ensure merchant legal details, delivery policy, customer correspondence, privacy processing information and product readiness before opening real sales. Supply real approved photos.
6. Only then and with user approval set `STORE_CHECKOUT_ENABLED=true` on the relevant environment. Prefer staging with test keys first.

**Reminder:** This phase gives a finished user-facing layout and payment/inquiry plumbing, but does not by itself give a full custom ERP/inventory/order-management database, nor a live merchant account. The Stripe Dashboard and email inbox are currently the planned operational back office. Operational go-live remains blocked until external services and tests are configured.

## Local test steps (on the already checked-out feature branch)

```cmd
cd /d C:\Users\diaaa\OneDrive\Desktop\luvipro
git status -sb
git fetch origin
git pull --ff-only origin feature/international-home-en-ar
npm run build
npm run dev
```

Inspect:
- `http://localhost:3000/products`: mobile/desktop appearance, price and item list.
- `http://localhost:3000/order?mode=preorder`: quantity/price calculations, updated business/privacy wording and disabled submission until Resend is configured.
- `http://localhost:3000/order?mode=buy`: card payment remains blocked.
- `http://localhost:3000/order/success`: no false success without a valid paid Stripe session.
- Homepage links, menu, language switcher and the original German pages remain working.

To roll back, stay on or switch to the untouched `main` branch; do not merge the feature branch. Existing initial baseline is commit `d999bbb61f1f4f9658c6b2d1ff0ace95b7f82bec`. Detailed commit history on the feature branch preserves per-file changes.
