-- PROPOSED SCHEMA ONLY - DO NOT RUN IN LIVE SUPABASE WITHOUT APPROVAL.
-- No existing table or policy is modified. Execute only after DB backup and
-- approval of the seller/invoicing strategy. This migration is intentionally not
-- automatically deployed by Next.js/Vercel/GitHub Actions.
--
-- Application secret SUPABASE_SERVICE_ROLE_KEY must never be browser-exposed.
-- No policies for anon/authenticated users: access only via service_role.
CREATE SEQUENCE IF NOT EXISTS public.luvipro_invoice_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.luvipro_billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE CHECK (length(source_key) BETWEEN 8 AND 200),
  invoice_number text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('device')),
  invoice_snapshot jsonb,
  pdf_base64 text,
  delivery_state text NOT NULL DEFAULT 'reserved'
    CHECK (delivery_state IN ('reserved','prepared','sending','sent','failed')),
  delivery_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.luvipro_billing_invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_billing_invoices FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.luvipro_billing_invoices TO service_role;
REVOKE ALL ON SEQUENCE public.luvipro_invoice_seq FROM PUBLIC, anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.luvipro_invoice_seq TO service_role;

CREATE OR REPLACE FUNCTION public.luvipro_invoice_reserve(p_source_key text)
RETURNS TABLE (invoice_id uuid, invoice_no text, state text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id uuid;
  v_number text;
  v_state text;
  v_seq bigint;
BEGIN
  IF p_source_key IS NULL OR length(p_source_key) NOT BETWEEN 8 AND 200
     OR p_source_key !~ '^stripe:cs_(test|live)_' THEN
    RAISE EXCEPTION 'Invalid source key';
  END IF;

  -- Serialized only per exact Stripe session; prevents double issuing under
  -- concurrent webhook delivery. The unique source_key is the final guard.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_source_key, 981273));
  SELECT b.id, b.invoice_number, b.delivery_state INTO v_id, v_number, v_state
    FROM public.luvipro_billing_invoices b WHERE b.source_key = p_source_key;
  IF v_id IS NULL THEN
    v_seq := nextval('public.luvipro_invoice_seq');
    v_number := 'LUV-' || to_char(now() AT TIME ZONE 'Europe/Berlin','YYYY')
             || '-' || lpad(v_seq::text, 7, '0');
    INSERT INTO public.luvipro_billing_invoices(source_key, invoice_number, kind)
      VALUES (p_source_key, v_number, 'device') RETURNING id INTO v_id;
    v_state := 'reserved';
  END IF;
  RETURN QUERY SELECT v_id, v_number, v_state;
END;
$$;

REVOKE ALL ON FUNCTION public.luvipro_invoice_reserve(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_invoice_reserve(text) TO service_role;

-- Additional application requirements before production issuance:
-- * Test with synthetic records on a local database only.
-- * Review with tax adviser, valid legal seller registration/Steuernummer.
-- * Implement archival backups and deletion/retention processes.
-- * Wire to verified payment source, NOT unauthenticated browser requests.
-- * Add webhook idempotency integration test and handling for stuck 'sending'.
-- * Add EN16931 compatible e-invoicing format for applicable future B2B rules.
