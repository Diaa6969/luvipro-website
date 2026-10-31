-- ONE code architecture, extending existing discount codes and bank orders.
-- Prices match the existing website catalogue. No payment provider is activated.
BEGIN;
ALTER TABLE public.luvipro_discount_codes ALTER COLUMN affiliate_id DROP NOT NULL;
ALTER TABLE public.luvipro_discount_codes
 ADD COLUMN IF NOT EXISTS code_type text NOT NULL DEFAULT 'device' CHECK(code_type IN ('device','inspection','both')),
 ADD COLUMN IF NOT EXISTS rule_revision integer NOT NULL DEFAULT 1 CHECK(rule_revision>0);

CREATE TABLE public.luvipro_promo_catalog (
 product_kind text PRIMARY KEY CHECK(product_kind IN ('device','inspection_standard','inspection_premium')),
 unit_net_cents bigint NOT NULL CHECK(unit_net_cents>0 AND unit_net_cents<=1000000000),
 vat_bps integer NOT NULL CHECK(vat_bps BETWEEN 0 AND 10000),
 shipping_net_cents bigint NOT NULL DEFAULT 0 CHECK(shipping_net_cents>=0),
 active boolean NOT NULL DEFAULT true
);
INSERT INTO public.luvipro_promo_catalog VALUES
 ('device',300000,1900,2999,true),('inspection_standard',5041,1900,0,true),('inspection_premium',10083,1900,0,true);
ALTER TABLE public.luvipro_promo_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_promo_catalog FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.luvipro_promo_catalog TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.luvipro_promo_catalog TO service_role;
CREATE POLICY promo_catalog_authenticated_read ON public.luvipro_promo_catalog FOR SELECT TO authenticated USING(active);

CREATE TABLE public.luvipro_promo_rules (
 code_id uuid NOT NULL REFERENCES public.luvipro_discount_codes(id) ON DELETE RESTRICT,
 product_kind text NOT NULL REFERENCES public.luvipro_promo_catalog(product_kind),
 discount_kind text NOT NULL CHECK(discount_kind IN ('percent','fixed_net')),
 discount_bps integer NOT NULL DEFAULT 0 CHECK(discount_bps BETWEEN 0 AND 10000),
 fixed_net_cents bigint NOT NULL DEFAULT 0 CHECK(fixed_net_cents BETWEEN 0 AND 1000000000),
 maximum_discount_net_cents bigint CHECK(maximum_discount_net_cents>=0),
 minimum_order_net_cents bigint NOT NULL DEFAULT 0 CHECK(minimum_order_net_cents>=0),
 commission_bps integer CHECK(commission_bps BETWEEN 0 AND 10000),
 settlement_delay_days integer CHECK(settlement_delay_days BETWEEN 0 AND 3660),
 usage_per_customer integer CHECK(usage_per_customer>0),
 usage_per_partner integer CHECK(usage_per_partner>0),
 new_partner_only boolean NOT NULL DEFAULT false,
 enabled boolean NOT NULL DEFAULT true,
 PRIMARY KEY(code_id,product_kind),
 CHECK(coalesce(commission_bps,0)=0 OR settlement_delay_days IS NOT NULL)
);
ALTER TABLE public.luvipro_promo_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_promo_rules FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.luvipro_promo_rules TO service_role;

CREATE TABLE public.luvipro_promo_partner_eligibility (
 partner_uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
 new_partner_eligible boolean NOT NULL,
 evidence_reference text NOT NULL CHECK(char_length(btrim(evidence_reference)) BETWEEN 4 AND 200),
 verified_by uuid NOT NULL REFERENCES auth.users(id),verified_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.luvipro_promo_partner_eligibility ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_promo_partner_eligibility FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.luvipro_promo_partner_eligibility TO service_role;

CREATE TABLE public.luvipro_promo_quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),customer_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
 code_id uuid REFERENCES public.luvipro_discount_codes(id) ON DELETE RESTRICT,
 product_kind text NOT NULL REFERENCES public.luvipro_promo_catalog(product_kind),
 quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 10),partner_uid uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes'
);
CREATE INDEX promo_quotes_customer_time ON public.luvipro_promo_quotes(customer_uid,created_at DESC);
ALTER TABLE public.luvipro_promo_quotes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_promo_quotes FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.luvipro_promo_quotes TO service_role;

-- References the existing order system; no second orders/accounting database.
ALTER TABLE public.luvipro_bank_orders
 ADD COLUMN IF NOT EXISTS customer_uid uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN IF NOT EXISTS product_kind text NOT NULL DEFAULT 'device' CHECK(product_kind IN ('device','inspection_standard','inspection_premium')),
 ADD COLUMN IF NOT EXISTS partner_uid uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN IF NOT EXISTS promo_snapshot jsonb,
 ADD COLUMN IF NOT EXISTS promo_quote_id uuid UNIQUE REFERENCES public.luvipro_promo_quotes(id),
 ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'pending' CHECK(fulfillment_status IN ('pending','fulfilled','cancelled')),
 ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
 ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
 ADD COLUMN IF NOT EXISTS return_deadline_at timestamptz;
CREATE INDEX IF NOT EXISTS bank_orders_customer_uid_idx ON public.luvipro_bank_orders(customer_uid);
ALTER TABLE public.luvipro_billing_invoices DROP CONSTRAINT luvipro_billing_invoices_kind_check;
ALTER TABLE public.luvipro_billing_invoices ADD CONSTRAINT luvipro_billing_invoices_kind_check
 CHECK(kind IN ('device','inspection_standard','inspection_premium'));

CREATE TABLE public.luvipro_promo_redemptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),quote_id uuid NOT NULL UNIQUE REFERENCES public.luvipro_promo_quotes(id),
 order_id uuid NOT NULL UNIQUE REFERENCES public.luvipro_bank_orders(id),
 code_id uuid NOT NULL REFERENCES public.luvipro_discount_codes(id),
 customer_uid uuid NOT NULL REFERENCES auth.users(id),partner_uid uuid REFERENCES auth.users(id),
 snapshot jsonb NOT NULL,status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','completed','cancelled','refunded')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX promo_redemptions_code_customer ON public.luvipro_promo_redemptions(code_id,customer_uid);
CREATE INDEX promo_redemptions_code_partner ON public.luvipro_promo_redemptions(code_id,partner_uid);
ALTER TABLE public.luvipro_promo_redemptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_promo_redemptions FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.luvipro_promo_redemptions TO service_role;

CREATE OR REPLACE FUNCTION public.luvipro_discount_code_change_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF new.affiliate_id IS DISTINCT FROM old.affiliate_id THEN RAISE EXCEPTION 'Affiliate attribution cannot change'; END IF;
 IF (old.redemption_count>0 OR EXISTS(SELECT 1 FROM public.luvipro_promo_redemptions WHERE code_id=old.id) OR EXISTS(SELECT 1 FROM public.luvipro_affiliate_commissions WHERE code_id=old.id)) AND (new.code IS DISTINCT FROM old.code OR new.valid_from IS DISTINCT FROM old.valid_from) THEN
  RAISE EXCEPTION 'Used code identifier/start cannot change'; END IF;
 new.updated_at:=now();
 IF (to_jsonb(new)-ARRAY['version','updated_at','redemption_count'])=(to_jsonb(old)-ARRAY['version','updated_at','redemption_count']) THEN
  new.version:=old.version;RETURN new;
 END IF;
 new.version:=old.version+1;
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 VALUES('code_updated',new.id,auth.uid(),jsonb_build_object('previous',to_jsonb(old),'new',to_jsonb(new)));
 RETURN new;
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_promo_admin_save_v1(
 p_id uuid,p_expected_version integer,p_code jsonb,p_rules jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.luvipro_discount_codes%ROWTYPE; a public.luvipro_affiliate_applications%ROWTYPE;
 affiliate uuid; scope text; ref text; item jsonb; result uuid; product text; required_count integer;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 affiliate:=nullif(p_code->>'affiliate_id','')::uuid;scope:=p_code->>'code_type';ref:=btrim(coalesce(p_code->>'terms_reference',''));
 IF scope IS NULL OR scope NOT IN ('device','inspection','both') OR p_code->'evidence_checked' IS DISTINCT FROM 'true'::jsonb
 OR char_length(ref) NOT BETWEEN 4 AND 200 OR upper(btrim(coalesce(p_code->>'code',''))) !~ '^[A-Z0-9][A-Z0-9_-]{3,31}$'
 OR jsonb_typeof(p_rules) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Reviewed code terms and valid rules required'; END IF;
 IF affiliate IS NOT NULL THEN
  SELECT * INTO a FROM public.luvipro_affiliate_applications WHERE id=affiliate;
  IF NOT FOUND OR a.status<>'approved' OR a.registration_verified_at IS NULL
   OR a.individual_agreement_accepted_at IS NULL THEN RAISE EXCEPTION 'Verified approved Affiliate required'; END IF;
 END IF;
 IF p_id IS NOT NULL THEN
  SELECT * INTO c FROM public.luvipro_discount_codes WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR c.version IS DISTINCT FROM p_expected_version THEN RAISE EXCEPTION 'Code changed; reload' USING ERRCODE='40001'; END IF;
  IF c.affiliate_id IS DISTINCT FROM affiliate THEN RAISE EXCEPTION 'Affiliate identity is immutable'; END IF;
 END IF;
 required_count:=CASE scope WHEN 'both' THEN 3 WHEN 'inspection' THEN 2 ELSE 1 END;
 IF jsonb_array_length(p_rules)<>required_count OR (SELECT count(DISTINCT r->>'product_kind') FROM jsonb_array_elements(p_rules) r)<>required_count THEN
  RAISE EXCEPTION 'Explicit rules for every included product are required'; END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(p_rules) LOOP
  product:=item->>'product_kind';
  IF product IS NULL OR product NOT IN ('device','inspection_standard','inspection_premium')
   OR (scope='device' AND product<>'device') OR (scope='inspection' AND product='device')
   OR (affiliate IS NULL AND coalesce((item->>'commission_bps')::integer,0)>0) THEN
   RAISE EXCEPTION 'Invalid product or general-code commission'; END IF;
 END LOOP;
 IF p_id IS NULL THEN
  INSERT INTO public.luvipro_discount_codes(affiliate_id,code,discount_bps,commission_bps,
   valid_from,valid_until,usage_limit,active,code_terms_evidence_ref,code_terms_confirmed_at,code_type)
  VALUES(affiliate,upper(btrim(p_code->>'code')),0,0,(p_code->>'valid_from')::date,(p_code->>'valid_until')::date,
   nullif(p_code->>'usage_limit','')::integer,coalesce((p_code->>'active')::boolean,false),ref,now(),scope) RETURNING id INTO result;
 ELSE
  result:=p_id;
  UPDATE public.luvipro_discount_codes SET code=upper(btrim(p_code->>'code')),valid_from=(p_code->>'valid_from')::date,
   valid_until=(p_code->>'valid_until')::date,usage_limit=nullif(p_code->>'usage_limit','')::integer,
   active=coalesce((p_code->>'active')::boolean,false),code_type=scope,code_terms_evidence_ref=ref,
   code_terms_confirmed_at=now(),rule_revision=rule_revision+1 WHERE id=result;
 END IF;
 UPDATE public.luvipro_promo_rules SET enabled=false WHERE code_id=result;
 FOR item IN SELECT * FROM jsonb_array_elements(p_rules) LOOP
  INSERT INTO public.luvipro_promo_rules(code_id,product_kind,discount_kind,discount_bps,fixed_net_cents,
   maximum_discount_net_cents,minimum_order_net_cents,commission_bps,settlement_delay_days,
   usage_per_customer,usage_per_partner,new_partner_only)
  VALUES(result,item->>'product_kind',item->>'discount_kind',coalesce((item->>'discount_bps')::integer,0),
   coalesce((item->>'fixed_net_cents')::bigint,0),nullif(item->>'maximum_discount_net_cents','')::bigint,
   coalesce((item->>'minimum_order_net_cents')::bigint,0),nullif(item->>'commission_bps','')::integer,
   nullif(item->>'settlement_delay_days','')::integer,nullif(item->>'usage_per_customer','')::integer,
   nullif(item->>'usage_per_partner','')::integer,coalesce((item->>'new_partner_only')::boolean,false))
  ON CONFLICT(code_id,product_kind) DO UPDATE SET discount_kind=excluded.discount_kind,discount_bps=excluded.discount_bps,
   fixed_net_cents=excluded.fixed_net_cents,maximum_discount_net_cents=excluded.maximum_discount_net_cents,
   minimum_order_net_cents=excluded.minimum_order_net_cents,commission_bps=excluded.commission_bps,
   settlement_delay_days=excluded.settlement_delay_days,usage_per_customer=excluded.usage_per_customer,
   usage_per_partner=excluded.usage_per_partner,new_partner_only=excluded.new_partner_only,enabled=true;
 END LOOP;
 -- Preserve the legacy device columns for existing website displays only.
 UPDATE public.luvipro_discount_codes SET discount_bps=coalesce((SELECT discount_bps FROM public.luvipro_promo_rules WHERE code_id=result AND product_kind='device' AND enabled),0),
  commission_bps=coalesce((SELECT commission_bps FROM public.luvipro_promo_rules WHERE code_id=result AND product_kind='device' AND enabled),0)
 WHERE id=result;
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 VALUES('promo_rules_saved',result,auth.uid(),jsonb_build_object('rules',p_rules,'scope',scope,'terms_reference',ref));
 RETURN result;
END; $$;
REVOKE INSERT,UPDATE,DELETE ON public.luvipro_discount_codes FROM authenticated;

CREATE SCHEMA IF NOT EXISTS luvipro_security;
CREATE OR REPLACE FUNCTION luvipro_security.promo_evaluate_v1(p_actor uuid,p_code text,p_product text,p_quantity integer,p_partner uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SET search_path='' AS $$
DECLARE product public.luvipro_promo_catalog%ROWTYPE;c public.luvipro_discount_codes%ROWTYPE;
 rule public.luvipro_promo_rules%ROWTYPE;before_net bigint;discount bigint:=0;after_net bigint;vat bigint;shipping_vat bigint;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_actor AND email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Confirmed account required' USING ERRCODE='42501'; END IF;
 SELECT * INTO product FROM public.luvipro_promo_catalog WHERE product_kind=p_product AND active;
 IF NOT FOUND OR p_quantity IS NULL OR p_quantity NOT BETWEEN 1 AND 10 OR (p_product<>'device' AND p_quantity<>1) THEN RAISE EXCEPTION 'Invalid product quantity'; END IF;
 before_net:=product.unit_net_cents*p_quantity;
 IF p_partner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.partner_verifications WHERE user_id=p_partner AND status='approved') THEN RAISE EXCEPTION 'Approved fulfillment partner required';END IF;
 IF nullif(btrim(p_code),'') IS NOT NULL THEN
  SELECT * INTO c FROM public.luvipro_discount_codes WHERE code=upper(btrim(p_code));
  IF NOT FOUND OR NOT c.active OR current_date NOT BETWEEN c.valid_from AND c.valid_until
   OR (c.usage_limit IS NOT NULL AND c.redemption_count>=c.usage_limit)
   OR (c.code_type='device' AND p_product<>'device') OR (c.code_type='inspection' AND p_product='device') THEN RAISE EXCEPTION 'Code not available'; END IF;
  IF c.affiliate_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.luvipro_affiliate_applications a
    WHERE a.id=c.affiliate_id AND a.status='approved' AND a.owner_uid IS DISTINCT FROM p_actor) THEN RAISE EXCEPTION 'Code not eligible'; END IF;
  SELECT * INTO rule FROM public.luvipro_promo_rules WHERE code_id=c.id AND product_kind=p_product AND enabled;
  IF NOT FOUND THEN
   -- Existing device-only codes keep their explicitly agreed legacy terms.
   IF p_product<>'device' THEN RAISE EXCEPTION 'Product code terms missing'; END IF;
   rule.discount_kind:='percent';rule.discount_bps:=c.discount_bps;rule.commission_bps:=c.commission_bps;
   rule.minimum_order_net_cents:=0;rule.settlement_delay_days:=15;rule.new_partner_only:=false;
  END IF;
  IF before_net<rule.minimum_order_net_cents THEN RAISE EXCEPTION 'Minimum net goods value before discount not reached'; END IF;
  IF rule.usage_per_customer IS NOT NULL AND (SELECT count(*) FROM public.luvipro_promo_redemptions WHERE code_id=c.id AND customer_uid=p_actor AND status<>'cancelled')>=rule.usage_per_customer THEN RAISE EXCEPTION 'Customer code quota exhausted'; END IF;
  IF rule.usage_per_partner IS NOT NULL AND (p_partner IS NULL OR (SELECT count(*) FROM public.luvipro_promo_redemptions WHERE code_id=c.id AND partner_uid=p_partner AND status<>'cancelled')>=rule.usage_per_partner) THEN RAISE EXCEPTION 'Partner code quota unavailable'; END IF;
  IF p_partner IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.partner_verifications WHERE user_id=p_partner AND status='approved') THEN RAISE EXCEPTION 'Approved fulfillment partner required'; END IF;
  IF rule.new_partner_only AND (NOT EXISTS(SELECT 1 FROM public.luvipro_promo_partner_eligibility WHERE partner_uid=p_actor AND new_partner_eligible)
   OR NOT EXISTS(SELECT 1 FROM public.partner_verifications WHERE user_id=p_actor AND status='approved')
   OR EXISTS(SELECT 1 FROM public.luvipro_bank_orders WHERE customer_uid=p_actor AND payment_status='paid')
   OR EXISTS(SELECT 1 FROM public.luvipro_promo_redemptions WHERE customer_uid=p_actor AND status<>'cancelled' AND (snapshot->>'new_partner_only')::boolean IS TRUE)) THEN
   RAISE EXCEPTION 'Verified new-partner eligibility unavailable'; END IF;
  discount:=CASE rule.discount_kind WHEN 'percent' THEN floor((before_net::numeric*rule.discount_bps+5000)/10000)::bigint ELSE rule.fixed_net_cents END;
  IF rule.maximum_discount_net_cents IS NOT NULL THEN discount:=least(discount,rule.maximum_discount_net_cents); END IF;
  discount:=least(before_net,greatest(0,discount));
 END IF;
 after_net:=before_net-discount;
 IF after_net<=0 THEN RAISE EXCEPTION 'Zero-priced protected services are not enabled; review the discount terms'; END IF;
 vat:=floor((after_net::numeric*product.vat_bps+5000)/10000)::bigint;
 shipping_vat:=floor((product.shipping_net_cents::numeric*product.vat_bps+5000)/10000)::bigint;
 RETURN jsonb_build_object('product_kind',p_product,'quantity',p_quantity,'currency','EUR',
  'unit_net_cents',product.unit_net_cents::text,'goods_net_before_discount_cents',before_net::text,
  'discount_net_cents',discount::text,'goods_net_after_discount_cents',after_net::text,
  'shipping_net_cents',product.shipping_net_cents::text,'net_cents',(after_net+product.shipping_net_cents)::text,
  'vat_cents',(vat+shipping_vat)::text,'gross_cents',(after_net+product.shipping_net_cents+vat+shipping_vat)::text,
  'vat_bps',product.vat_bps,'code_id',c.id,'code',c.code,'code_version',c.version,'affiliate_id',c.affiliate_id,
  'commission_bps',coalesce(rule.commission_bps,0),'settlement_delay_days',rule.settlement_delay_days,
  'new_partner_only',coalesce(rule.new_partner_only,false));
END; $$;
REVOKE ALL ON FUNCTION luvipro_security.promo_evaluate_v1(uuid,text,text,integer,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.luvipro_promo_quote_v1(p_product text,p_quantity integer,p_code text DEFAULT '',p_partner uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE snapshot jsonb; quote uuid; expires timestamptz;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,3141));
 IF (SELECT count(*) FROM public.luvipro_promo_quotes WHERE customer_uid=auth.uid() AND created_at>now()-interval '1 minute')>=20 THEN RAISE EXCEPTION 'Quote rate limit exceeded'; END IF;
 snapshot:=luvipro_security.promo_evaluate_v1(auth.uid(),p_code,p_product,p_quantity,p_partner);
 INSERT INTO public.luvipro_promo_quotes(customer_uid,code_id,product_kind,quantity,partner_uid,snapshot)
 VALUES(auth.uid(),(snapshot->>'code_id')::uuid,p_product,p_quantity,p_partner,snapshot) RETURNING id,expires_at INTO quote,expires;
 -- Never disclose the Affiliate's private compensation/contract terms to buyers.
 RETURN (snapshot-ARRAY['code_id','affiliate_id','commission_bps','settlement_delay_days','new_partner_only','code_version'])||jsonb_build_object('quote_id',quote,'expires_at',expires);
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_promo_order_create_v1(p_actor uuid,p_quote uuid,p_request_key uuid,p_ip_hash text,p_billing jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.luvipro_promo_quotes%ROWTYPE;c public.luvipro_discount_codes%ROWTYPE;fresh jsonb;
 order_record public.luvipro_bank_orders%ROWTYPE;generated uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text,3142));
 SELECT * INTO q FROM public.luvipro_promo_quotes WHERE id=p_quote FOR UPDATE;
 IF NOT FOUND OR q.customer_uid IS DISTINCT FROM p_actor THEN RAISE EXCEPTION 'Own quote required' USING ERRCODE='42501'; END IF;
 SELECT * INTO order_record FROM public.luvipro_bank_orders WHERE request_key=p_request_key;
 IF FOUND THEN
  IF order_record.customer_uid IS DISTINCT FROM p_actor OR order_record.promo_snapshot IS DISTINCT FROM q.snapshot THEN RAISE EXCEPTION 'Order idempotency conflict'; END IF;
  IF ROW(order_record.customer_company,order_record.customer_contact,order_record.customer_address,order_record.customer_postal_code,order_record.customer_city,order_record.customer_phone)
   IS DISTINCT FROM ROW(p_billing->>'company',p_billing->>'contact',p_billing->>'address',p_billing->>'postal_code',p_billing->>'city',coalesce(p_billing->>'phone','')) THEN
   RAISE EXCEPTION 'Idempotency key cannot change billing details'; END IF;
  RETURN jsonb_build_object('order_id',order_record.id,'invoice_number',order_record.invoice_number,'status',order_record.payment_status,'reused',true);
 END IF;
 IF q.expires_at<now() THEN RAISE EXCEPTION 'Quote expired'; END IF;
 IF EXISTS(SELECT 1 FROM public.luvipro_bank_orders WHERE promo_quote_id=q.id) THEN RAISE EXCEPTION 'Quote already used by another request'; END IF;
 IF q.code_id IS NOT NULL THEN SELECT * INTO c FROM public.luvipro_discount_codes WHERE id=q.code_id FOR UPDATE; END IF;
 fresh:=luvipro_security.promo_evaluate_v1(p_actor,q.snapshot->>'code',q.product_kind,q.quantity,q.partner_uid);
 IF fresh IS DISTINCT FROM q.snapshot THEN RAISE EXCEPTION 'Price or code terms changed; obtain a new quote'; END IF;
 IF p_billing->'terms_accepted' IS DISTINCT FROM 'true'::jsonb OR p_billing->'privacy_accepted' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Order consent required'; END IF;
 -- Auth email is authoritative; callers cannot attribute an order to another email.
 SELECT o.order_id INTO generated FROM public.luvipro_bank_order_create(p_request_key,p_billing->>'company',p_billing->>'contact',
  (SELECT email FROM auth.users WHERE id=p_actor),p_billing->>'address',p_billing->>'postal_code',p_billing->>'city',coalesce(p_billing->>'phone',''),q.quantity,p_ip_hash) o;
 UPDATE public.luvipro_bank_orders SET customer_uid=p_actor,product_kind=q.product_kind,partner_uid=q.partner_uid,promo_quote_id=q.id,
  promo_snapshot=q.snapshot,net_cents=(q.snapshot->>'net_cents')::bigint,vat_cents=(q.snapshot->>'vat_cents')::bigint,gross_cents=(q.snapshot->>'gross_cents')::bigint
 WHERE id=generated RETURNING * INTO order_record;
 UPDATE public.luvipro_billing_invoices SET kind=q.product_kind,invoice_snapshot=q.snapshot WHERE id=order_record.invoice_id;
 IF q.code_id IS NOT NULL THEN
  INSERT INTO public.luvipro_promo_redemptions(quote_id,order_id,code_id,customer_uid,partner_uid,snapshot)
  VALUES(q.id,generated,q.code_id,p_actor,q.partner_uid,q.snapshot);
  UPDATE public.luvipro_discount_codes SET redemption_count=redemption_count+1 WHERE id=q.code_id;
 END IF;
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 VALUES('promo_order_reserved',generated,p_actor,jsonb_build_object('quote_id',q.id,'product_kind',q.product_kind));
 RETURN jsonb_build_object('order_id',generated,'invoice_number',order_record.invoice_number,'status','pending','reused',false);
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_promo_snapshot_guard_v1()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF TG_TABLE_NAME='luvipro_promo_quotes' OR
  (to_jsonb(new)-'status') IS DISTINCT FROM (to_jsonb(old)-'status') THEN
  RAISE EXCEPTION 'Attributed quote/order snapshot is immutable'; END IF;
 IF new.status<>old.status AND NOT
  ((old.status='reserved' AND new.status IN ('completed','cancelled')) OR (old.status='completed' AND new.status='refunded')) THEN
  RAISE EXCEPTION 'Invalid redemption transition'; END IF;
 RETURN new;
END; $$;
CREATE TRIGGER promo_quotes_immutable BEFORE UPDATE ON public.luvipro_promo_quotes FOR EACH ROW EXECUTE FUNCTION public.luvipro_promo_snapshot_guard_v1();
CREATE TRIGGER promo_redemption_snapshot_immutable BEFORE UPDATE ON public.luvipro_promo_redemptions FOR EACH ROW EXECUTE FUNCTION public.luvipro_promo_snapshot_guard_v1();
REVOKE ALL ON FUNCTION public.luvipro_promo_snapshot_guard_v1() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.luvipro_promo_order_snapshot_guard_v1()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF old.promo_snapshot IS NOT NULL AND
  ROW(new.customer_uid,new.product_kind,new.partner_uid,new.promo_snapshot,new.promo_quote_id,new.quantity,new.net_cents,new.vat_cents,new.gross_cents)
  IS DISTINCT FROM ROW(old.customer_uid,old.product_kind,old.partner_uid,old.promo_snapshot,old.promo_quote_id,old.quantity,old.net_cents,old.vat_cents,old.gross_cents) THEN
  RAISE EXCEPTION 'Attributed order identity, amounts and price snapshot are immutable'; END IF;
 IF old.paid_at IS NOT NULL AND ROW(new.paid_at,new.paid_by,new.bank_transaction_reference) IS DISTINCT FROM ROW(old.paid_at,old.paid_by,old.bank_transaction_reference) THEN
  RAISE EXCEPTION 'Verified payment evidence is immutable'; END IF;
 RETURN new;
END; $$;
CREATE TRIGGER promo_order_snapshot_immutable BEFORE UPDATE ON public.luvipro_bank_orders FOR EACH ROW EXECUTE FUNCTION public.luvipro_promo_order_snapshot_guard_v1();
REVOKE ALL ON FUNCTION public.luvipro_promo_order_snapshot_guard_v1() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.luvipro_promo_admin_save_v1(uuid,integer,jsonb,jsonb),public.luvipro_promo_quote_v1(text,integer,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_admin_save_v1(uuid,integer,jsonb,jsonb),public.luvipro_promo_quote_v1(text,integer,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.luvipro_promo_order_create_v1(uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_order_create_v1(uuid,uuid,uuid,text,jsonb) TO service_role;


CREATE OR REPLACE FUNCTION public.luvipro_bank_order_mark_paid(p_order_id uuid,p_actor_id uuid,p_bank_reference text,p_paid_at timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.luvipro_bank_orders%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor_id AND lower(role::text)='admin')
 OR p_bank_reference IS NULL OR char_length(btrim(p_bank_reference)) NOT BETWEEN 5 AND 120
 OR p_paid_at IS NULL OR p_paid_at>now() OR p_paid_at<now()-interval '3 years' THEN RAISE EXCEPTION 'Verified Admin payment evidence required';END IF;
 SELECT * INTO o FROM public.luvipro_bank_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND OR o.payment_status<>'pending' THEN RETURN false;END IF;
 UPDATE public.luvipro_bank_orders SET payment_status='paid',paid_at=p_paid_at,paid_by=p_actor_id,bank_transaction_reference=btrim(p_bank_reference),updated_at=now() WHERE id=p_order_id;
 INSERT INTO public.luvipro_bank_order_events(order_id,event_kind,actor_id,event_note) VALUES(p_order_id,'paid_confirmed',p_actor_id,'Manually matched verified bank statement');
 RETURN true;
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_bank_order_mark_paid(uuid,uuid,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_bank_order_mark_paid(uuid,uuid,text,timestamptz) TO service_role;

CREATE UNIQUE INDEX bank_order_reference_normalized ON public.luvipro_bank_orders(lower(btrim(bank_transaction_reference))) WHERE bank_transaction_reference IS NOT NULL;
CREATE OR REPLACE FUNCTION public.luvipro_promo_partner_eligibility_v1(p_partner uuid,p_eligible boolean,p_evidence text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF p_eligible IS NULL OR char_length(btrim(coalesce(p_evidence,''))) NOT BETWEEN 4 AND 200
 OR NOT EXISTS(SELECT 1 FROM public.partner_verifications WHERE user_id=p_partner AND status='approved') THEN RAISE EXCEPTION 'Reviewed approved partner required';END IF;
 INSERT INTO public.luvipro_promo_partner_eligibility(partner_uid,new_partner_eligible,evidence_reference,verified_by)
 VALUES(p_partner,p_eligible,btrim(p_evidence),auth.uid()) ON CONFLICT(partner_uid) DO UPDATE SET new_partner_eligible=excluded.new_partner_eligible,evidence_reference=excluded.evidence_reference,verified_by=excluded.verified_by,verified_at=now();
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details) VALUES('new_partner_eligibility_reviewed',p_partner,auth.uid(),jsonb_build_object('eligible',p_eligible,'evidence',p_evidence));
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_promo_partner_eligibility_v1(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_partner_eligibility_v1(uuid,boolean,text) TO authenticated;

-- Fulfillment is separate from payment. Does not initiate or confirm a transfer.
CREATE OR REPLACE FUNCTION public.luvipro_promo_fulfill_v1(p_order uuid,p_fulfilled_at timestamptz,p_return_deadline timestamptz,p_evidence text,p_checked boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.luvipro_bank_orders%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 SELECT * INTO o FROM public.luvipro_bank_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.payment_status<>'paid' OR o.fulfillment_status<>'pending' OR o.refunded_at IS NOT NULL
 OR p_checked IS NOT TRUE OR p_fulfilled_at IS NULL OR p_fulfilled_at>now() OR p_fulfilled_at<o.paid_at
 OR p_return_deadline IS NULL OR p_return_deadline<p_fulfilled_at+interval '15 days'
 OR char_length(btrim(coalesce(p_evidence,''))) NOT BETWEEN 4 AND 200 THEN RAISE EXCEPTION 'Verified payment, fulfillment and applicable return deadline required';END IF;
 UPDATE public.luvipro_bank_orders SET fulfillment_status='fulfilled',fulfilled_at=p_fulfilled_at,return_deadline_at=p_return_deadline,updated_at=now() WHERE id=p_order;
 UPDATE public.luvipro_promo_redemptions SET status='completed' WHERE order_id=p_order AND status='reserved';
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details) VALUES('order_fulfillment_verified',p_order,auth.uid(),jsonb_build_object('evidence',p_evidence,'fulfilled_at',p_fulfilled_at,'return_deadline',p_return_deadline));
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_promo_fulfill_v1(uuid,timestamptz,timestamptz,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_fulfill_v1(uuid,timestamptz,timestamptz,text,boolean) TO authenticated;

-- A mutable current code can never rewrite commission terms of an earlier sale.
CREATE OR REPLACE FUNCTION public.luvipro_affiliate_commission_snapshot_v1()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE c public.luvipro_discount_codes%ROWTYPE;o public.luvipro_bank_orders%ROWTYPE;rate integer;
BEGIN
 IF TG_OP='INSERT' THEN
  SELECT * INTO c FROM public.luvipro_discount_codes WHERE id=new.code_id;
  IF NOT FOUND OR c.affiliate_id IS DISTINCT FROM new.affiliate_id THEN RAISE EXCEPTION 'Invalid attributed code';END IF;
  rate:=c.commission_bps;
  IF new.source_type='bank_transfer' THEN
   SELECT * INTO o FROM public.luvipro_bank_orders WHERE id::text=new.source_order_id;
   IF NOT FOUND OR o.promo_snapshot IS NULL OR o.promo_snapshot->>'affiliate_id' IS DISTINCT FROM new.affiliate_id::text
    OR o.promo_snapshot->>'code_id' IS DISTINCT FROM new.code_id::text OR o.payment_status<>'paid'
    OR o.fulfillment_status<>'fulfilled' OR o.refunded_at IS NOT NULL THEN RAISE EXCEPTION 'Verified attributed fulfilled bank order required';END IF;
   rate:=(o.promo_snapshot->>'commission_bps')::integer;
   new.net_after_discount_cents:=(o.promo_snapshot->>'goods_net_after_discount_cents')::bigint;
   new.verified_paid_at:=o.paid_at;new.delivered_at:=o.fulfilled_at;
   new.return_deadline_at:=greatest(o.return_deadline_at,o.fulfilled_at+make_interval(days=>greatest(15,(o.promo_snapshot->>'settlement_delay_days')::integer)));
  END IF;
  new.commission_rate_bps:=rate;
  new.commission_cents:=floor((new.net_after_discount_cents::numeric*rate+5000)/10000)::bigint;
 ELSIF TG_OP='DELETE' THEN
  RAISE EXCEPTION 'Financial commission history cannot be deleted';
 ELSIF (old.status='paid' AND to_jsonb(new) IS DISTINCT FROM to_jsonb(old)) OR
  ROW(new.affiliate_id,new.code_id,new.source_type,new.source_order_id,new.net_after_discount_cents,new.commission_cents,new.commission_rate_bps,new.verified_paid_at,new.delivered_at,new.return_deadline_at)
  IS DISTINCT FROM ROW(old.affiliate_id,old.code_id,old.source_type,old.source_order_id,old.net_after_discount_cents,old.commission_cents,old.commission_rate_bps,old.verified_paid_at,old.delivered_at,old.return_deadline_at) THEN
  RAISE EXCEPTION 'Attributed commission snapshot is immutable';
 END IF;
 RETURN new;
END;$$;

CREATE OR REPLACE FUNCTION public.luvipro_promo_accrue_v1(p_order uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.luvipro_bank_orders%ROWTYPE;result uuid;deadline timestamptz;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 SELECT * INTO o FROM public.luvipro_bank_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.promo_snapshot IS NULL OR o.payment_status<>'paid' OR o.fulfillment_status<>'fulfilled'
 OR o.refunded_at IS NOT NULL OR nullif(o.promo_snapshot->>'affiliate_id','') IS NULL OR coalesce((o.promo_snapshot->>'commission_bps')::integer,0)<=0 THEN RAISE EXCEPTION 'Verified commission-bearing order required';END IF;
 deadline:=greatest(o.return_deadline_at,o.fulfilled_at+make_interval(days=>greatest(15,(o.promo_snapshot->>'settlement_delay_days')::integer)));
 IF deadline IS NULL OR now()<deadline THEN RAISE EXCEPTION 'Return/contract period has not elapsed';END IF;
 SELECT id INTO result FROM public.luvipro_affiliate_commissions WHERE source_type='bank_transfer' AND source_order_id=o.id::text;
 IF FOUND THEN RETURN result;END IF;
 INSERT INTO public.luvipro_affiliate_commissions(code_id,affiliate_id,source_type,source_order_id,net_after_discount_cents,commission_cents,verified_paid_at,delivered_at,return_deadline_at,status)
 VALUES((o.promo_snapshot->>'code_id')::uuid,(o.promo_snapshot->>'affiliate_id')::uuid,'bank_transfer',o.id::text,(o.promo_snapshot->>'goods_net_after_discount_cents')::bigint,0,o.paid_at,o.fulfilled_at,deadline,'eligible') RETURNING id INTO result;
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details) VALUES('verified_order_commission_accrued',result,auth.uid(),jsonb_build_object('order_id',o.id));
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_promo_accrue_v1(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_accrue_v1(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.luvipro_promo_codes_v1(p_offset integer DEFAULT 0,p_admin boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE owner uuid;result jsonb;total bigint;
BEGIN
 IF auth.uid() IS NULL OR p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 OR p_admin IS NULL THEN RAISE EXCEPTION 'Valid authenticated request required' USING ERRCODE='42501';END IF;
 IF p_admin AND public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 SELECT id INTO owner FROM public.luvipro_affiliate_applications WHERE owner_uid=auth.uid();
 SELECT count(*) INTO total FROM public.luvipro_discount_codes WHERE p_admin OR affiliate_id=owner;
 SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM (
  SELECT c.id,c.affiliate_id,c.code,c.code_type,c.version,c.active,c.valid_from,c.valid_until,c.usage_limit,c.redemption_count,c.code_terms_evidence_ref,a.company_name,
   coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.product_kind) FROM public.luvipro_promo_rules r WHERE r.code_id=c.id AND r.enabled),'[]') rules
  FROM public.luvipro_discount_codes c LEFT JOIN public.luvipro_affiliate_applications a ON a.id=c.affiliate_id
  WHERE p_admin OR c.affiliate_id=owner ORDER BY c.created_at DESC,c.id LIMIT 100 OFFSET p_offset
 ) q;
 RETURN jsonb_build_object('items',result,'total',total,'has_more',total>p_offset+100);
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_promo_codes_v1(integer,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_codes_v1(integer,boolean) TO authenticated;


CREATE OR REPLACE FUNCTION public.luvipro_promo_orders_admin_v1(p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE total bigint;items jsonb;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid page';END IF;
 SELECT count(*) INTO total FROM public.luvipro_bank_orders;
 SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO items FROM (
  SELECT id,invoice_number,customer_uid,customer_company,customer_contact,product_kind,quantity,payment_status,paid_at,fulfillment_status,fulfilled_at,return_deadline_at,refunded_at,net_cents::text,vat_cents::text,gross_cents::text,promo_snapshot->>'code' promo_code,
   (SELECT c.status FROM public.luvipro_affiliate_commissions c WHERE c.source_type='bank_transfer' AND c.source_order_id=o.id::text) commission_status
  FROM public.luvipro_bank_orders o ORDER BY created_at DESC,id LIMIT 100 OFFSET p_offset
 ) q;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',total>p_offset+100);
END;$$;
CREATE OR REPLACE FUNCTION public.luvipro_promo_confirm_customer_payment_v1(p_order uuid,p_date date,p_reference text,p_external_payment_received boolean,p_evidence_checked boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF p_external_payment_received IS NOT TRUE OR p_evidence_checked IS NOT TRUE OR p_date IS NULL OR p_date>current_date THEN RAISE EXCEPTION 'External payment and evidence confirmation required';END IF;
 IF NOT public.luvipro_bank_order_mark_paid(p_order,auth.uid(),p_reference,p_date::timestamp AT TIME ZONE 'Europe/Berlin') THEN RAISE EXCEPTION 'Order not pending; no duplicate confirmation';END IF;
END;$$;
CREATE OR REPLACE FUNCTION public.luvipro_promo_cancel_unpaid_v1(p_order uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE o public.luvipro_bank_orders%ROWTYPE;c uuid;actor uuid;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 300 THEN RAISE EXCEPTION 'Documented cancellation reason required';END IF;
 SELECT customer_uid INTO actor FROM public.luvipro_bank_orders WHERE id=p_order;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,3142));
 SELECT * INTO o FROM public.luvipro_bank_orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND OR o.payment_status<>'pending' OR o.fulfillment_status<>'pending' THEN RAISE EXCEPTION 'Only unpaid unfulfilled order can be cancelled';END IF;
 SELECT code_id INTO c FROM public.luvipro_promo_redemptions WHERE order_id=p_order AND status='reserved';
 IF c IS NOT NULL THEN
  PERFORM 1 FROM public.luvipro_discount_codes WHERE id=c FOR UPDATE;
  UPDATE public.luvipro_promo_redemptions SET status='cancelled' WHERE order_id=p_order AND status='reserved';
  UPDATE public.luvipro_discount_codes SET redemption_count=greatest(0,redemption_count-1) WHERE id=c;
 END IF;
 UPDATE public.luvipro_bank_orders SET payment_status='cancelled',fulfillment_status='cancelled',updated_at=now() WHERE id=p_order;
 INSERT INTO public.luvipro_bank_order_events(order_id,event_kind,actor_id,event_note) VALUES(p_order,'cancelled',auth.uid(),btrim(p_reason));
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details) VALUES('unpaid_order_cancelled',p_order,auth.uid(),jsonb_build_object('reason',p_reason,'code_id',c));
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_promo_orders_admin_v1(integer),public.luvipro_promo_confirm_customer_payment_v1(uuid,date,text,boolean,boolean),public.luvipro_promo_cancel_unpaid_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_orders_admin_v1(integer),public.luvipro_promo_confirm_customer_payment_v1(uuid,date,text,boolean,boolean),public.luvipro_promo_cancel_unpaid_v1(uuid,text) TO authenticated;


CREATE OR REPLACE FUNCTION public.luvipro_promo_admin_dispatch_v1(p_actor uuid,p_action text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE previous text:=current_setting('request.jwt.claim.sub',true);result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND lower(role::text)='admin') THEN RAISE EXCEPTION 'Verified Admin actor required' USING ERRCODE='42501';END IF;
 PERFORM set_config('request.jwt.claim.sub',p_actor::text,true);
 IF p_action='save_code' THEN
  result:=to_jsonb(public.luvipro_promo_admin_save_v1(nullif(p_payload->>'id','')::uuid,nullif(p_payload->>'version','')::integer,p_payload->'code',p_payload->'rules'));
 ELSE RAISE EXCEPTION 'Unsupported trusted Promo action';END IF;
 PERFORM set_config('request.jwt.claim.sub',coalesce(previous,''),true);
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION public.luvipro_promo_admin_dispatch_v1(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_admin_dispatch_v1(uuid,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_promo_admin_save_v1(uuid,integer,jsonb,jsonb) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
