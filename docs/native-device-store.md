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


## 2026-10-20 — approved follow-up: automatic enquiries, header and inspection prices

- Replaced the old one-line warning about sensitive information in the pre-order form with the user's approved business customer/privacy wording. The future checkout mode has truthful order/payment processing wording.
- Removed the `mailto:` fallback from the pre-order submit handler. The form now requires a configured server-side Resend integration and returns a genuine success reference **only after Resend's API accepts the email**. When not configured, its submit button is disabled with an explicit notice and contact address. Actual delivery still requires a verified sender and real keys, which were not available in this GitHub session; no sender was enabled.
- The existing `/api/store/preorder` endpoint already delivers directly to the configured `STORE_ORDER_EMAIL` (default proposed address `customerservice@luvipro.de`), and is still gated by `STORE_PREORDERS_ENABLED`, `RESEND_API_KEY`, `STORE_FROM_EMAIL` and `STORE_ORDER_EMAIL`. The server-side backend remains non-operational until the user configures those protected environment variables.
- Desktop header: **Gerät** points to `/products`; **Preise** points to `/products#preise`. Mobile menus follow the same pattern. Existing home anchors were made absolute so they still work when visiting product/order pages.
- Implemented Standard inspection **59.99 EUR** (UV-assisted paint inspection, exterior visual check, interior check and structured findings) and Premium inspection **119.99 EUR** (Standard plus fault-code reading, paint thickness measurements and extended documentation). Rates and features are centrally stored in `src/lib/inspection-pricing.ts`; they appear on the German homepage and the integrated product page, alongside the LU3656060 **3,000 EUR net B2B** device price.
- The English and Arabic homepage price cards/nav labels now mention both inspection packages accurately; price links go to the German product price section (localized product page not yet built).
- The normal/premium inspection services are shown as **planned, not currently bookable**, and do not charge money.
- This remains a feature branch. Do not merge into `main` or activate payment and email secrets without further user review.

### Validation checklist

1. Confirm build with GitHub Actions or `npm run build`.
2. Verify homepage German/English/Arabic headers and mobile menu routes: `/products`, `/products#preise`.
3. Verify both inspection prices and scopes, including Premium being additive to Standard.
4. Verify the enquiry form does not launch a local mail app, does not show a fake success with missing Resend config, and still previews quantity totals accurately.
5. With a **test** verified sender and pre-order flag enabled in a separate approved test environment, submit a synthetic non-binding enquiry and confirm email delivery to the specified mailbox and reference display.
