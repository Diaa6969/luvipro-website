-- REVIEW-ONLY / NOT EXECUTED ON PRODUCTION.
-- Prerequisite: invoicing-schema.sql and bookkeeping-extension.sql, reviewed.
-- The single existing invoice sequence produces reserved unique Rechnungsnummern.
-- Before goods delivery, customer receives a VORKASSE ZAHLUNGSINFORMATION,
-- *not* a legal final tax invoice; when delivery occurs, issue final invoice
-- with this same reserved invoice number.
-- All access service_role only; public users and authenticated customers get no access.

CREATE TABLE IF NOT EXISTS public.luvipro_bank_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_key uuid NOT NULL UNIQUE,
  request_ip_hash text NOT NULL CHECK (request_ip_hash ~ '^[0-9a-f]{64}$'),
  invoice_id uuid NOT NULL UNIQUE REFERENCES public.luvipro_billing_invoices(id),
  invoice_number text NOT NULL UNIQUE,
  customer_company text NOT NULL CHECK (length(customer_company) BETWEEN 1 AND 120),
  customer_contact text NOT NULL CHECK (length(customer_contact) BETWEEN 1 AND 120),
  customer_email text NOT NULL CHECK (length(customer_email) BETWEEN 4 AND 160),
  customer_address text NOT NULL CHECK (length(customer_address) BETWEEN 1 AND 180),
  customer_postal_code text NOT NULL CHECK (length(customer_postal_code) BETWEEN 1 AND 12),
  customer_city text NOT NULL CHECK (length(customer_city) BETWEEN 1 AND 120),
  customer_phone text NOT NULL DEFAULT '',
  quantity smallint NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  net_cents bigint NOT NULL CHECK (net_cents > 0),
  vat_cents bigint NOT NULL CHECK (vat_cents >= 0),
  gross_cents bigint NOT NULL CHECK (gross_cents = net_cents + vat_cents),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','cancelled')),
  payment_mail_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_mail_status IN ('pending','sending','sent','failed')),
  payment_mail_sent_at timestamptz,
  paid_at timestamptz,
  paid_by uuid,
  bank_transaction_reference text,
  reminder_count integer NOT NULL DEFAULT 0 CHECK (reminder_count >= 0),
  reminder_claimed_at timestamptz,
  last_reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS luvipro_bank_orders_status_date_idx
  ON public.luvipro_bank_orders (payment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.luvipro_bank_order_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.luvipro_bank_orders(id),
  event_kind text NOT NULL CHECK (event_kind IN
    ('created','payment_mail_claimed','payment_mail_sent','payment_mail_failed',
     'paid_confirmed','reminder_claimed','reminder_sent','reminder_failed','cancelled')),
  actor_id uuid,
  event_note text,
  event_time timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS luvipro_bank_events_order_idx
  ON public.luvipro_bank_order_events (order_id, event_time DESC);

ALTER TABLE public.luvipro_bank_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luvipro_bank_order_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_bank_orders FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.luvipro_bank_order_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.luvipro_bank_orders TO service_role;
GRANT SELECT, INSERT ON public.luvipro_bank_order_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.luvipro_bank_order_events_id_seq TO service_role;

-- Only an authenticated SERVER using service_role can create orders.
-- Database computes amounts independently of browser-provided numbers.
CREATE OR REPLACE FUNCTION public.luvipro_bank_order_create(
  p_request_key uuid,
  p_company text, p_contact text, p_email text, p_address text,
  p_postal_code text, p_city text, p_phone text, p_quantity integer,
  p_ip_hash text
) RETURNS TABLE(order_id uuid, invoice_no text, payment_state text, mail_state text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_order public.luvipro_bank_orders%ROWTYPE;
  v_invoice_id uuid;
  v_number text;
  v_seq bigint;
  v_net bigint;
  v_vat bigint;
BEGIN
  IF p_request_key IS NULL OR p_ip_hash !~ '^[0-9a-f]{64}$'
      OR p_quantity NOT BETWEEN 1 AND 10
      OR trim(p_company) = '' OR length(p_company)>120
      OR trim(p_contact) = '' OR length(p_contact)>120
      OR p_email NOT LIKE '%@%.%' OR length(p_email)>160
      OR trim(p_address) = '' OR length(p_address)>180 OR
      trim(p_postal_code) = '' OR length(p_postal_code)>12 OR
      trim(p_city) = '' OR length(p_city)>120 OR length(coalesce(p_phone,''))>60 THEN
    RAISE EXCEPTION 'Invalid bank order';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(lower(p_email), 17030));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 17032));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request_key::text, 17031));
  SELECT * INTO v_order FROM public.luvipro_bank_orders b WHERE b.request_key = p_request_key;
  IF FOUND THEN
    -- Prevent reusing a client idempotency key for another order.
    IF v_order.customer_email <> p_email OR v_order.quantity <> p_quantity
      OR v_order.customer_company <> p_company THEN
      RAISE EXCEPTION 'Idempotency key conflict';
    END IF;
    RETURN QUERY SELECT v_order.id,v_order.invoice_number,v_order.payment_status,v_order.payment_mail_status;
    RETURN;
  END IF;
  -- Rate limits are enforced transactionally and supplement edge WAF.
  IF (SELECT count(*) FROM public.luvipro_bank_orders b
      WHERE lower(b.customer_email)=lower(p_email) AND b.created_at>now()-interval '24 hours') >= 3
    OR (SELECT count(*) FROM public.luvipro_bank_orders b
      WHERE b.request_ip_hash=p_ip_hash AND b.created_at>now()-interval '24 hours') >= 10 THEN
      RAISE EXCEPTION 'Bank request daily rate limit reached';
  END IF;
  v_net := p_quantity::bigint * 300000 + 2999;
  v_vat := round((p_quantity::numeric * 300000 * 19) / 100)::bigint
         + round((2999::numeric * 19) / 100)::bigint;
  v_seq := nextval('public.luvipro_invoice_seq');
  v_number := 'LUV-' || to_char(now() AT TIME ZONE 'Europe/Berlin','YYYY')
                  || '-' || lpad(v_seq::text, 7, '0');
  INSERT INTO public.luvipro_billing_invoices(source_key,invoice_number,kind)
  VALUES ('bank:'||p_request_key::text, v_number, 'device')
  RETURNING id INTO v_invoice_id;
  INSERT INTO public.luvipro_bank_orders(
    request_key,request_ip_hash,invoice_id,invoice_number,customer_company,customer_contact,
    customer_email,customer_address,customer_postal_code,customer_city,customer_phone,
    quantity,net_cents,vat_cents,gross_cents)
  VALUES (p_request_key,p_ip_hash,v_invoice_id,v_number,p_company,p_contact,p_email,p_address,
          p_postal_code,p_city,coalesce(p_phone,''),p_quantity,v_net,v_vat,v_net+v_vat)
  RETURNING * INTO v_order;
  INSERT INTO public.luvipro_bank_order_events(order_id,event_kind)
    VALUES (v_order.id,'created');
  RETURN QUERY SELECT v_order.id,v_order.invoice_number,v_order.payment_status,v_order.payment_mail_status;
END;
$$;
REVOKE ALL ON FUNCTION public.luvipro_bank_order_create(uuid,text,text,text,text,text,text,text,integer,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_bank_order_create(uuid,text,text,text,text,text,text,text,integer,text)
  TO service_role;

-- Atomic status transition for human-verified bank payment: requires an actual
-- matching bank statement entry recorded by the admin; never confirm by browser request alone.
CREATE OR REPLACE FUNCTION public.luvipro_bank_order_mark_paid(
  p_order_id uuid,p_actor_id uuid,p_bank_reference text,p_paid_at timestamptz
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
 IF p_actor_id IS NULL OR length(trim(p_bank_reference)) NOT BETWEEN 5 AND 120
   OR p_paid_at IS NULL OR p_paid_at > now() + interval '5 minutes'
   OR p_paid_at < now() - interval '3 years' THEN
   RAISE EXCEPTION 'Payment evidence required';
 END IF;
 UPDATE public.luvipro_bank_orders
 SET payment_status='paid',paid_at=p_paid_at,paid_by=p_actor_id,
     bank_transaction_reference=p_bank_reference,updated_at=now()
 WHERE id=p_order_id AND payment_status='pending'
 RETURNING id INTO v_id;
 IF v_id IS NULL THEN RETURN false; END IF;
 INSERT INTO public.luvipro_bank_order_events(order_id,event_kind,actor_id,event_note)
 VALUES(v_id,'paid_confirmed',p_actor_id,'Manually matched verified bank statement');
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.luvipro_bank_order_mark_paid(uuid,uuid,text,timestamptz)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_bank_order_mark_paid(uuid,uuid,text,timestamptz)
  TO service_role;

-- Once-per-day reminder claim, only for still-unpaid orders.
CREATE OR REPLACE FUNCTION public.luvipro_bank_order_claim_reminder(
  p_order_id uuid,p_actor_id uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
 IF p_actor_id IS NULL THEN RAISE EXCEPTION 'Actor required'; END IF;
 UPDATE public.luvipro_bank_orders SET reminder_claimed_at=now(),updated_at=now()
 WHERE id=p_order_id AND payment_status='pending' AND payment_mail_status='sent'
   AND (reminder_claimed_at IS NULL OR reminder_claimed_at < now()-interval '24 hours')
 RETURNING id INTO v_id;
 IF v_id IS NULL THEN RETURN false; END IF;
 INSERT INTO public.luvipro_bank_order_events(order_id,event_kind,actor_id)
 VALUES(v_id,'reminder_claimed',p_actor_id);
 RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.luvipro_bank_order_claim_reminder(uuid,uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_bank_order_claim_reminder(uuid,uuid)
  TO service_role;

-- No realtime/table policies to authenticated/anon. Admin app must use a
-- dedicated Edge Function verifying auth.uid + app_metadata/admin allowlist,
-- then internal website API protected by a server-held integration token.
-- No plaintext bank access token and no service role key in Flutter.
