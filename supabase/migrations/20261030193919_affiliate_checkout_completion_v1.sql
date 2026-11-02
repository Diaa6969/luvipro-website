-- Uses the existing quote/order/invoice/commission engine; no payment provider or email call.
BEGIN;
CREATE OR REPLACE FUNCTION public.luvipro_checkout_order_v1(p_quote uuid,p_request uuid,p_billing jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();rate_key text;result jsonb;
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Confirmed account required' USING ERRCODE='42501';END IF;
 IF p_quote IS NULL OR p_request IS NULL OR jsonb_typeof(p_billing)<>'object' OR octet_length(p_billing::text)>8192 THEN RAISE EXCEPTION 'Invalid checkout';END IF;
 IF EXISTS(SELECT 1 FROM public.luvipro_promo_quotes WHERE id=p_quote AND product_kind<>'device' AND partner_uid IS NULL) THEN RAISE EXCEPTION 'Select an approved inspection partner before ordering';END IF;
 IF EXISTS(SELECT 1 FROM public.luvipro_promo_quotes q WHERE q.id=p_quote AND q.product_kind<>'device' AND NOT EXISTS(SELECT 1 FROM public.partner_locations l JOIN public.partner_verifications v ON v.id=l.partner_verification_id WHERE l.partner_user_id=q.partner_uid AND l.is_active AND l.accepts_inspection_requests AND v.status='approved' AND v.show_on_map)) THEN RAISE EXCEPTION 'Inspection partner is not currently available';END IF;
 rate_key:=actor::text||':checkout:'||date_trunc('minute',now())::text;
 IF NOT public.luvipro_affiliate_take_rate(md5(rate_key)||md5('checkout:'||rate_key),20) THEN RAISE EXCEPTION 'Checkout rate limit';END IF;
 result:=public.luvipro_promo_order_create_v1(actor,p_quote,p_request,md5(actor::text)||md5('account:'||actor::text),p_billing);
 RETURN result||jsonb_build_object('payment_initiated',false);
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_checkout_order_v1(uuid,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_checkout_order_v1(uuid,uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.luvipro_checkout_history_v1(p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();items jsonb;total bigint;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid page';END IF;
 SELECT count(*) INTO total FROM public.luvipro_bank_orders WHERE customer_uid=actor;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO items FROM (
  SELECT id,invoice_number,product_kind,quantity,created_at,payment_status,fulfillment_status,refunded_at,
   net_cents::text,vat_cents::text,gross_cents::text,
   promo_snapshot->>'code' AS promo_code,promo_snapshot->>'discount_net_cents' AS discount_net_cents
  FROM public.luvipro_bank_orders WHERE customer_uid=actor ORDER BY created_at DESC,id LIMIT 50 OFFSET p_offset
 )x;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',total>p_offset+50);
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_checkout_history_v1(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_checkout_history_v1(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.luvipro_checkout_cancel_v1(p_order uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();o public.luvipro_bank_orders%ROWTYPE;c uuid;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 300 THEN RAISE EXCEPTION 'Cancellation reason required';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,3142));
 SELECT * INTO o FROM public.luvipro_bank_orders WHERE id=p_order AND customer_uid=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Own order required' USING ERRCODE='42501';END IF;
 IF o.payment_status='cancelled' THEN RETURN;END IF;
 IF o.payment_status<>'pending' OR o.fulfillment_status<>'pending' OR o.refunded_at IS NOT NULL THEN RAISE EXCEPTION 'Only unpaid unfulfilled orders may be cancelled';END IF;
 SELECT code_id INTO c FROM public.luvipro_promo_redemptions WHERE order_id=p_order AND status='reserved';
 IF c IS NOT NULL THEN
  PERFORM 1 FROM public.luvipro_discount_codes WHERE id=c FOR UPDATE;
  UPDATE public.luvipro_promo_redemptions SET status='cancelled' WHERE order_id=p_order AND status='reserved';
  UPDATE public.luvipro_discount_codes SET redemption_count=greatest(0,redemption_count-1) WHERE id=c;
 END IF;
 UPDATE public.luvipro_bank_orders SET payment_status='cancelled',fulfillment_status='cancelled',updated_at=now() WHERE id=p_order;
 INSERT INTO public.luvipro_bank_order_events(order_id,event_kind,actor_id,event_note) VALUES(p_order,'cancelled',actor,btrim(p_reason));
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details) VALUES('customer_cancelled_unpaid_order',p_order,actor,jsonb_build_object('reason',btrim(p_reason)));
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_checkout_cancel_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_checkout_cancel_v1(uuid,text) TO authenticated;

CREATE TABLE public.luvipro_order_refunds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),order_id uuid NOT NULL UNIQUE REFERENCES public.luvipro_bank_orders(id),
 refunded_on date NOT NULL,bank_reference text NOT NULL CHECK(char_length(btrim(bank_reference)) BETWEEN 5 AND 120),
 amount_cents bigint NOT NULL CHECK(amount_cents>0),reason text NOT NULL CHECK(char_length(reason) BETWEEN 5 AND 300),
 recorded_by uuid NOT NULL REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX order_refund_bank_reference_unique ON public.luvipro_order_refunds(lower(btrim(bank_reference)));
ALTER TABLE public.luvipro_order_refunds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_order_refunds FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.luvipro_order_refunds TO service_role;
CREATE OR REPLACE FUNCTION public.luvipro_checkout_refund_v1(p_order uuid,p_date date,p_reference text,p_reason text,p_external_refund_confirmed boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();o public.luvipro_bank_orders%ROWTYPE;
BEGIN
 IF actor IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 SELECT * INTO o FROM public.luvipro_bank_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.payment_status<>'paid' OR o.refunded_at IS NOT NULL OR p_external_refund_confirmed IS NOT TRUE
 OR p_date IS NULL OR p_date>current_date OR p_date<o.paid_at::date
 OR char_length(btrim(coalesce(p_reference,''))) NOT BETWEEN 5 AND 120 OR char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 300
 THEN RAISE EXCEPTION 'Actual external refund evidence required';END IF;
 PERFORM 1 FROM public.luvipro_affiliate_commissions WHERE source_type='bank_transfer' AND source_order_id=p_order::text FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.luvipro_affiliate_commissions WHERE source_type='bank_transfer' AND source_order_id=p_order::text AND (payout_id IS NOT NULL OR status='paid')) THEN
  RAISE EXCEPTION 'Issued or allocated settlement requires reviewed corrective accounting; no automatic reversal';END IF;
 INSERT INTO public.luvipro_order_refunds(order_id,refunded_on,bank_reference,amount_cents,reason,recorded_by)
 VALUES(p_order,p_date,btrim(p_reference),o.gross_cents,btrim(p_reason),actor);
 UPDATE public.luvipro_bank_orders SET refunded_at=p_date::timestamp AT TIME ZONE 'Europe/Berlin',updated_at=now() WHERE id=p_order;
 UPDATE public.luvipro_affiliate_commissions SET status='void',refunded_at=p_date::timestamp AT TIME ZONE 'Europe/Berlin' WHERE source_type='bank_transfer' AND source_order_id=p_order::text;
 UPDATE public.luvipro_promo_redemptions SET status='completed' WHERE order_id=p_order AND status='reserved';
 UPDATE public.luvipro_promo_redemptions SET status='refunded' WHERE order_id=p_order AND status='completed';
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details) VALUES('external_order_refund_recorded',p_order,actor,jsonb_build_object('reference',btrim(p_reference),'date',p_date,'reason',btrim(p_reason),'amount_cents',o.gross_cents));
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_checkout_refund_v1(uuid,date,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_checkout_refund_v1(uuid,date,text,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.luvipro_checkout_partners_v1(p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE items jsonb;total bigint;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF char_length(coalesce(p_search,''))>100 OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid search';END IF;
 SELECT count(DISTINCT l.partner_user_id) INTO total FROM public.partner_locations l JOIN public.partner_verifications v ON v.id=l.partner_verification_id
 WHERE l.is_active AND l.accepts_inspection_requests AND v.status='approved' AND v.show_on_map AND (coalesce(p_search,'')='' OR concat_ws(' ',l.company_name,l.city,l.postal_code) ILIKE '%'||p_search||'%');
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO items FROM (
 SELECT DISTINCT ON(l.partner_user_id) l.id,l.partner_user_id,l.company_name,l.city,l.postal_code FROM public.partner_locations l JOIN public.partner_verifications v ON v.id=l.partner_verification_id
 WHERE l.is_active AND l.accepts_inspection_requests AND v.status='approved' AND v.show_on_map AND (coalesce(p_search,'')='' OR concat_ws(' ',l.company_name,l.city,l.postal_code) ILIKE '%'||p_search||'%')
 ORDER BY l.partner_user_id,l.id LIMIT 50 OFFSET p_offset
 )x;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',total>p_offset+50);
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_checkout_partners_v1(text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_checkout_partners_v1(text,integer) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
