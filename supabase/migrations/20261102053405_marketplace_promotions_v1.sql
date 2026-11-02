-- Inactive commercial infrastructure. No payment, transfer, invoice or entitlement is executed.
BEGIN;
ALTER TABLE public.luvipro_marketplace_settings
 ADD COLUMN promotions_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN promotion_price_basis text NOT NULL DEFAULT 'unapproved' CHECK(promotion_price_basis IN('unapproved','net','gross')),
 ADD COLUMN promotion_vat_bps integer CHECK(promotion_vat_bps BETWEEN 0 AND 3000),
 ADD COLUMN promotion_approval_reference text,
 ADD CONSTRAINT marketplace_promotion_commercial_gate CHECK(NOT promotions_enabled OR (promotion_price_basis IN('net','gross') AND promotion_vat_bps IS NOT NULL AND length(coalesce(promotion_approval_reference,''))>=20));
CREATE TABLE public.luvipro_marketplace_promotions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),seller_uid uuid NOT NULL,listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),request_key uuid NOT NULL,
 product_id text NOT NULL,product_snapshot jsonb NOT NULL,
 price_basis text NOT NULL CHECK(price_basis IN('net','gross')),vat_bps integer NOT NULL CHECK(vat_bps BETWEEN 0 AND 3000),
 net_cents bigint NOT NULL CHECK(net_cents>0),vat_cents bigint NOT NULL CHECK(vat_cents>=0),gross_cents bigint NOT NULL CHECK(gross_cents=net_cents+vat_cents),currency text NOT NULL DEFAULT 'EUR' CHECK(currency='EUR'),
 status text NOT NULL DEFAULT 'pending_payment' CHECK(status IN('pending_payment','active','suspended','cancelled','reversed')),
 revision integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 payment_verified boolean NOT NULL DEFAULT false,paid_at date,paid_by uuid,bank_reference text,starts_at timestamptz,ends_at timestamptz,
 refunded_at date,refund_reference text,
 UNIQUE(seller_uid,request_key),CHECK(status NOT IN('active','suspended','reversed') OR (payment_verified AND paid_at IS NOT NULL AND paid_by IS NOT NULL AND bank_reference IS NOT NULL AND starts_at IS NOT NULL AND ends_at>starts_at))
);
CREATE UNIQUE INDEX marketplace_promotion_payment_ref_unique ON public.luvipro_marketplace_promotions(upper(btrim(bank_reference))) WHERE bank_reference IS NOT NULL;
CREATE UNIQUE INDEX marketplace_promotion_refund_ref_unique ON public.luvipro_marketplace_promotions(upper(btrim(refund_reference))) WHERE refund_reference IS NOT NULL;
CREATE INDEX ON public.luvipro_marketplace_promotions(seller_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_promotions(starts_at,ends_at) WHERE status='active';
CREATE TABLE public.luvipro_marketplace_promotion_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,promotion_id uuid NOT NULL REFERENCES public.luvipro_marketplace_promotions(id),actor_uid uuid NOT NULL,
 action text NOT NULL,details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.luvipro_marketplace_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luvipro_marketplace_promotion_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_promotions,public.luvipro_marketplace_promotion_events FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.luvipro_marketplace_promotion_price_v1(p_price bigint,p_basis text,p_vat integer)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_price BETWEEN 1 AND 500000 AND p_vat BETWEEN 0 AND 3000 AND p_basis IN('gross','net') THEN
 jsonb_build_object('net_cents',amount.net,'vat_cents',amount.gross-amount.net,'gross_cents',amount.gross) ELSE NULL END
 FROM(SELECT CASE WHEN p_basis='gross' THEN round(p_price::numeric*10000/(10000+p_vat))::bigint ELSE p_price END net,
 CASE WHEN p_basis='gross' THEN p_price ELSE p_price+round(p_price::numeric*p_vat/10000)::bigint END gross) amount
$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_promotion_price_v1(bigint,text,integer) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.luvipro_marketplace_promotion_v1(p_action text,p_id uuid DEFAULT NULL,p_listing uuid DEFAULT NULL,p_product text DEFAULT NULL,p_request uuid DEFAULT NULL,p_revision integer DEFAULT NULL,p_note text DEFAULT '',p_payment_date date DEFAULT NULL,p_reference text DEFAULT NULL,p_amount bigint DEFAULT NULL,p_external_confirmed boolean DEFAULT false,p_start timestamptz DEFAULT NULL,p_filters jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();settings public.luvipro_marketplace_settings%ROWTYPE;r public.luvipro_marketplace_promotions%ROWTYPE;
 advert public.luvipro_marketplace_listings%ROWTYPE;product jsonb;items jsonb:='[]';used jsonb:='{}';card jsonb;candidate record;net bigint;vat bigint;price bigint;offset_value integer;
BEGIN
 IF p_action IS NULL OR jsonb_typeof(p_filters)<>'object' OR octet_length(p_filters::text)>4000 OR length(coalesce(p_note,''))>1000 THEN RAISE EXCEPTION 'Invalid bounded request';END IF;
 SELECT * INTO STRICT settings FROM public.luvipro_marketplace_settings WHERE singleton;
 IF p_action='public' THEN
  IF NOT settings.promotions_enabled THEN RETURN jsonb_build_object('items','[]'::jsonb);END IF;
  -- Separate sponsored slots: original publication timestamps and organic sorting are untouched.
  FOR candidate IN
   SELECT chosen.* FROM(SELECT DISTINCT ON(prom.listing_id) prom.id,prom.listing_id,prom.ends_at,product_config.value product
   FROM public.luvipro_marketplace_promotions prom
   JOIN public.luvipro_marketplace_listings l ON l.id=prom.listing_id
   JOIN LATERAL jsonb_array_elements(settings.boost_products) product_config ON product_config.value->>'id'=prom.product_id
   WHERE prom.status='active' AND prom.payment_verified AND prom.paid_at IS NOT NULL AND prom.bank_reference IS NOT NULL
    AND prom.starts_at<=now() AND prom.ends_at>now() AND (product_config.value->>'enabled')::boolean
    AND l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)
   ORDER BY prom.listing_id,(product_config.value->>'priority')::integer DESC,prom.id) chosen
   ORDER BY (chosen.product->>'priority')::integer DESC,md5(chosen.id::text||date_trunc('hour',now())::text) LIMIT 100
  LOOP
   IF p_filters ? 'listing_id' AND (p_filters->>'listing_id')::uuid<>candidate.listing_id THEN CONTINUE;END IF;
   card:=public.luvipro_marketplace_read_v1('search',NULL,p_filters||jsonb_build_object('listing_id',candidate.listing_id),0)->'items'->0;
   IF card IS NOT NULL AND coalesce((used->>(candidate.product->>'id'))::integer,0)<least(12,(candidate.product->>'slots')::integer) THEN
    used:=used||jsonb_build_object(candidate.product->>'id',coalesce((used->>(candidate.product->>'id'))::integer,0)+1);
    items:=items||jsonb_build_array(card||jsonb_build_object('sponsored',true,'promotion_expires_at',candidate.ends_at,'promotion_product',candidate.product->>'name','priority',(candidate.product->>'priority')::integer,'placement',candidate.product->>'placement','rotation',md5(candidate.id::text||date_trunc('hour',now())::text)));
   END IF;
  END LOOP;
  SELECT coalesce(jsonb_agg(value-'rotation'-'priority' ORDER BY (value->>'priority')::integer DESC,value->>'rotation'),'[]') INTO items FROM(SELECT value FROM jsonb_array_elements(items) ORDER BY (value->>'priority')::integer DESC,value->>'rotation' LIMIT 12)x;
  RETURN jsonb_build_object('items',items);
 END IF;
 actor:=public.luvipro_marketplace_actor_v1();
 IF p_action IN('list','admin_list') THEN
  IF p_action='admin_list' THEN
   IF NOT public.is_admin() OR length(btrim(coalesce(p_note,'')))<12 THEN RAISE EXCEPTION 'Documented Admin access required' USING ERRCODE='42501';END IF;
   INSERT INTO public.luvipro_marketplace_audit(actor_uid,action,details) VALUES(actor,'promotion_admin_view',jsonb_build_object('reason',p_note));
  END IF;
  offset_value:=coalesce((p_filters->>'offset')::integer,0);IF offset_value NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Invalid page';END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(
   SELECT prom.*,CASE WHEN prom.status='active' AND prom.ends_at<=now() THEN 'expired' WHEN prom.status='active' AND prom.starts_at>now() THEN 'scheduled' ELSE prom.status END effective_status
   FROM public.luvipro_marketplace_promotions prom WHERE prom.seller_uid=actor OR (p_action='admin_list' AND public.is_admin()) ORDER BY prom.created_at DESC,prom.id LIMIT 100 OFFSET offset_value)x;
  RETURN jsonb_build_object('items',items,'commercial_enabled',settings.promotions_enabled,'price_basis',settings.promotion_price_basis,'summary',
   (SELECT jsonb_build_object('net_received_cents',coalesce(sum(net_cents) FILTER(WHERE payment_verified AND status<>'reversed'),0),'vat_received_cents',coalesce(sum(vat_cents) FILTER(WHERE payment_verified AND status<>'reversed'),0),'gross_received_cents',coalesce(sum(gross_cents) FILTER(WHERE payment_verified AND status<>'reversed'),0)) FROM public.luvipro_marketplace_promotions WHERE seller_uid=actor OR (p_action='admin_list' AND public.is_admin())));
 END IF;
 IF p_action='catalog' THEN
  SELECT * INTO advert FROM public.luvipro_marketplace_listings WHERE id=p_listing AND seller_uid=actor AND status='published' AND public.luvipro_marketplace_eligible_v1(id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Own eligible published listing required';END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',value->>'id','name',value->>'name','price_cents',value->'price_cents','days',value->'days','placement',value->>'placement','available',settings.promotions_enabled AND (value->>'enabled')::boolean)||coalesce(public.luvipro_marketplace_promotion_price_v1((value->>'price_cents')::bigint,settings.promotion_price_basis,settings.promotion_vat_bps),'{"net_cents":null,"vat_cents":null,"gross_cents":null}')),'[]') INTO items FROM jsonb_array_elements(settings.boost_products);
  RETURN jsonb_build_object('items',items,'revision',settings.revision,'commercial_enabled',settings.promotions_enabled,'price_basis',settings.promotion_price_basis,'vat_bps',settings.promotion_vat_bps,'notice','Standardinserate bleiben kostenlos. Vorläufige Preise; echte Verkäufe erfordern kommerzielle und steuerliche Freigabe.');
 END IF;
 IF p_action='create' THEN
  SELECT * INTO STRICT settings FROM public.luvipro_marketplace_settings WHERE singleton FOR SHARE;
  IF NOT settings.promotions_enabled OR settings.promotion_price_basis='unapproved' THEN RAISE EXCEPTION 'Commercial activation pending';END IF;
  IF p_request IS NULL THEN RAISE EXCEPTION 'Idempotency key required';END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':promotion-order',0));
  SELECT * INTO r FROM public.luvipro_marketplace_promotions WHERE seller_uid=actor AND request_key=p_request;
  IF FOUND THEN IF r.listing_id IS DISTINCT FROM p_listing OR r.product_id IS DISTINCT FROM p_product THEN RAISE EXCEPTION 'Request key conflict';END IF;RETURN to_jsonb(r);END IF;
  SELECT * INTO advert FROM public.luvipro_marketplace_listings WHERE id=p_listing AND seller_uid=actor AND status='published' AND public.luvipro_marketplace_eligible_v1(id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Own eligible published listing required';END IF;
  SELECT value INTO product FROM jsonb_array_elements(settings.boost_products) WHERE value->>'id'=p_product AND (value->>'enabled')::boolean;
  IF product IS NULL OR (product->>'days')::integer NOT BETWEEN 1 AND 90 OR (product->>'price_cents')::bigint NOT BETWEEN 1 AND 500000 THEN RAISE EXCEPTION 'Available configured product required';END IF;
  IF (SELECT count(*) FROM public.luvipro_marketplace_promotions WHERE seller_uid=actor AND created_at>now()-interval '1 day')>=10 THEN RAISE EXCEPTION 'Daily order limit';END IF;
  IF EXISTS(SELECT 1 FROM public.luvipro_marketplace_promotions WHERE seller_uid=actor AND listing_id=advert.id AND status='pending_payment') THEN RAISE EXCEPTION 'Pending promotion order already exists';END IF;
  price:=(product->>'price_cents')::bigint;
  product:=product||public.luvipro_marketplace_promotion_price_v1(price,settings.promotion_price_basis,settings.promotion_vat_bps);
  net:=(product->>'net_cents')::bigint;vat:=(product->>'vat_cents')::bigint;
  IF p_revision IS DISTINCT FROM settings.revision OR p_amount IS DISTINCT FROM net+vat THEN RAISE EXCEPTION 'Price/configuration changed; review current server quote before ordering';END IF;
  INSERT INTO public.luvipro_marketplace_promotions(seller_uid,listing_id,request_key,product_id,product_snapshot,price_basis,vat_bps,net_cents,vat_cents,gross_cents)
  VALUES(actor,advert.id,p_request,p_product,product,settings.promotion_price_basis,settings.promotion_vat_bps,net,vat,net+vat) RETURNING * INTO r;
 ELSE
  SELECT * INTO r FROM public.luvipro_marketplace_promotions WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR (r.seller_uid<>actor AND NOT public.is_admin()) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';END IF;
  IF p_action='history' THEN
   SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT action,details,created_at,CASE WHEN public.is_admin() THEN actor_uid ELSE NULL END actor_uid FROM public.luvipro_marketplace_promotion_events WHERE promotion_id=r.id ORDER BY id LIMIT 200)x;RETURN jsonb_build_object('items',items);
  END IF;
  IF p_action='confirm_payment' AND r.payment_verified THEN
   IF public.is_admin() AND r.bank_reference=btrim(p_reference) AND r.gross_cents=p_amount AND r.paid_at=p_payment_date AND p_external_confirmed IS TRUE THEN RETURN to_jsonb(r);END IF;
   RAISE EXCEPTION 'Payment already recorded';
  END IF;
  IF p_revision IS DISTINCT FROM r.revision OR length(btrim(coalesce(p_note,'')))<12 THEN RAISE EXCEPTION 'Current revision and documented reason required';END IF;
  IF p_action='confirm_payment' THEN
   IF NOT public.is_admin() OR NOT settings.promotions_enabled OR p_external_confirmed IS NOT TRUE OR r.status<>'pending_payment' OR p_amount IS DISTINCT FROM r.gross_cents
    OR p_payment_date IS NULL OR p_payment_date>current_date OR p_payment_date<r.created_at::date OR length(btrim(coalesce(p_reference,''))) NOT BETWEEN 8 AND 120 THEN RAISE EXCEPTION 'Actual external payment and commercial approval required' USING ERRCODE='42501';END IF;
   IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_listings l WHERE l.id=r.listing_id AND l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id))
    OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(settings.boost_products) WHERE value->>'id'=r.product_id AND (value->>'enabled')::boolean) THEN RAISE EXCEPTION 'Listing/package no longer eligible';END IF;
   IF p_start IS NOT NULL AND (p_start<now()-interval '5 minutes' OR p_start>now()+interval '90 days') THEN RAISE EXCEPTION 'Valid start required';END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.listing_id::text||':promotion-interval',0));
   IF EXISTS(SELECT 1 FROM public.luvipro_marketplace_promotions existing WHERE existing.listing_id=r.listing_id AND existing.id<>r.id AND existing.payment_verified AND existing.status IN('active','suspended') AND existing.starts_at<coalesce(p_start,now())+make_interval(days=>(r.product_snapshot->>'days')::integer) AND existing.ends_at>coalesce(p_start,now())) THEN RAISE EXCEPTION 'Paid promotion interval overlaps';END IF;
   UPDATE public.luvipro_marketplace_promotions SET status='active',payment_verified=true,paid_at=p_payment_date,paid_by=actor,bank_reference=btrim(p_reference),starts_at=coalesce(p_start,now()),ends_at=coalesce(p_start,now())+make_interval(days=>(r.product_snapshot->>'days')::integer),revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  ELSIF p_action='suspend' AND public.is_admin() AND r.status='active' THEN
   UPDATE public.luvipro_marketplace_promotions SET status='suspended',revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  ELSIF p_action='resume' AND public.is_admin() AND r.status='suspended' AND r.ends_at>now() AND settings.promotions_enabled THEN
   IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_listings l WHERE l.id=r.listing_id AND l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)) THEN RAISE EXCEPTION 'Listing no longer eligible';END IF;
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(settings.boost_products) WHERE value->>'id'=r.product_id AND (value->>'enabled')::boolean) THEN RAISE EXCEPTION 'Package inactive';END IF;
   UPDATE public.luvipro_marketplace_promotions SET status='active',revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  ELSIF p_action='cancel' AND (r.status='pending_payment' AND r.seller_uid=actor OR public.is_admin() AND r.status IN('pending_payment','active','suspended')) THEN
   UPDATE public.luvipro_marketplace_promotions SET status='cancelled',revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  ELSIF p_action='reverse' AND public.is_admin() AND r.payment_verified AND r.status<>'reversed' AND p_external_confirmed IS TRUE AND p_amount=r.gross_cents AND p_payment_date BETWEEN r.paid_at AND current_date AND length(btrim(coalesce(p_reference,''))) BETWEEN 8 AND 120 AND btrim(p_reference)<>r.bank_reference THEN
   UPDATE public.luvipro_marketplace_promotions SET status='reversed',refunded_at=p_payment_date,refund_reference=btrim(p_reference),revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
  ELSE RAISE EXCEPTION 'Action not permitted' USING ERRCODE='42501';END IF;
 END IF;
 INSERT INTO public.luvipro_marketplace_promotion_events(promotion_id,actor_uid,action,details) VALUES(r.id,actor,p_action,jsonb_build_object('reason',p_note,'revision',r.revision,'status',r.status,'payment_verified',r.payment_verified,'gross_cents',r.gross_cents,'paid_at',r.paid_at,'starts_at',r.starts_at,'ends_at',r.ends_at));
 RETURN to_jsonb(r);
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_promotion_v1(text,uuid,uuid,text,uuid,integer,text,date,text,bigint,boolean,timestamptz,jsonb) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_promotion_v1(text,uuid,uuid,text,uuid,integer,text,date,text,bigint,boolean,timestamptz,jsonb) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.luvipro_marketplace_read_v1(p_mode text DEFAULT 'search'::text, p_id uuid DEFAULT NULL::uuid, p_filters jsonb DEFAULT '{}'::jsonb, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid:=auth.uid();items jsonb;total bigint;BEGIN
 IF p_offset NOT BETWEEN 0 AND 100000 OR p_offset IS NULL OR jsonb_typeof(p_filters)<>'object' OR octet_length(p_filters::text)>4000 THEN RAISE EXCEPTION 'Invalid query';END IF;
 IF p_mode='detail' THEN RETURN public.luvipro_marketplace_card_v1(p_id);END IF;
 IF p_mode IN ('mine','review','eligible','vehicles') THEN PERFORM public.luvipro_marketplace_actor_v1();END IF;
 IF p_mode='vehicles' THEN SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT id,vin,brand,model,year,mileage FROM public.vehicles WHERE user_id=actor ORDER BY id LIMIT 50 OFFSET p_offset)x;RETURN jsonb_build_object('items',items);END IF;
 IF p_mode='review' AND NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF p_mode='eligible' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT v.id vehicle_id,i.id inspection_id,i.vin,v.brand,v.model,v.year,v.mileage,i.created_at inspected_at FROM public.vehicles v JOIN public.inspections i ON upper(v.vin)=upper(i.vin) WHERE length(v.vin)=17 AND i.status='locked' AND i.locked_at IS NOT NULL AND i.report_status='generated' AND i.report_generated_at IS NOT NULL AND ((v.user_id=actor AND i.user_id=actor) OR EXISTS(SELECT 1 FROM public.luvipro_marketplace_authorities a WHERE a.seller_uid=actor AND a.vehicle_id=v.id AND a.inspection_id=i.id AND a.revoked_at IS NULL AND a.expires_at>now())) ORDER BY i.created_at DESC LIMIT 50 OFFSET p_offset)x;
 RETURN jsonb_build_object('items',items);END IF;
 IF p_mode IN ('mine','review') THEN
 SELECT coalesce(jsonb_agg((to_jsonb(x)-'search_document')||jsonb_build_object('photos',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'category',p.category,'position',p.position) ORDER BY p.position,p.created_at) FROM public.luvipro_marketplace_photos p WHERE p.listing_id=x.id AND p.removed_at IS NULL),'[]'::jsonb))),'[]') INTO items FROM(SELECT * FROM public.luvipro_marketplace_listings WHERE (p_mode='mine' AND seller_uid=actor OR p_mode='review' AND status='pending_review') AND (p_id IS NULL OR id=p_id) ORDER BY updated_at DESC LIMIT 30 OFFSET p_offset)x;
 RETURN jsonb_build_object('items',items);END IF;
 IF p_mode<>'search' THEN RAISE EXCEPTION 'Unknown view';END IF;
 IF p_filters ? 'radius_km' AND (NOT p_filters ? 'latitude' OR NOT p_filters ? 'longitude' OR (p_filters->>'radius_km')::numeric NOT BETWEEN 1 AND 500 OR (p_filters->>'latitude')::numeric NOT BETWEEN -90 AND 90 OR (p_filters->>'longitude')::numeric NOT BETWEEN -180 AND 180) THEN RAISE EXCEPTION 'Valid temporary search center and radius 1-500 km required';END IF;
 WITH matches AS(SELECT l.id,l.created_at,coalesce(l.published_at,l.created_at) publication_at,(l.data->>'price_cents')::bigint price,(l.data->>'mileage')::integer mileage,l.data->>'first_registration' registration,geo.distance_km
 FROM public.luvipro_marketplace_listings l CROSS JOIN LATERAL(SELECT CASE WHEN p_filters ? 'radius_km' AND l.data ? 'latitude' AND l.data ? 'longitude' THEN 6371.0*acos(least(1.0,greatest(-1.0,sin(radians((p_filters->>'latitude')::double precision))*sin(radians((l.data->>'latitude')::double precision))+cos(radians((p_filters->>'latitude')::double precision))*cos(radians((l.data->>'latitude')::double precision))*cos(radians((l.data->>'longitude')::double precision-(p_filters->>'longitude')::double precision))))) ELSE NULL END distance_km)geo
 WHERE l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)
 AND (NOT p_filters ? 'listing_id' OR l.id=(p_filters->>'listing_id')::uuid)
 AND (NOT p_filters ? 'dealer_id' OR (l.data->>'seller_type'='commercial' AND EXISTS(SELECT 1 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id WHERE loc.id=(p_filters->>'dealer_id')::uuid AND loc.partner_user_id=l.seller_uid AND loc.is_active AND v.status='approved' AND v.show_on_map AND public.luvipro_marketplace_partner_available_v1(loc.partner_user_id))))
 AND (coalesce(p_filters->>'q','')='' OR l.search_document @@ websearch_to_tsquery('german',left(p_filters->>'q',120)))
 AND (coalesce(p_filters->>'brand','')='' OR lower(l.data->>'brand')=lower(p_filters->>'brand'))
 AND (coalesce(p_filters->>'model','')='' OR l.data->>'model' ILIKE '%'||left(p_filters->>'model',100)||'%')
 AND (coalesce(p_filters->>'city','')='' OR l.data->>'city' ILIKE '%'||left(p_filters->>'city',100)||'%')
 AND (coalesce(p_filters->>'region','')='' OR lower(l.data->>'region')=lower(p_filters->>'region'))
 AND (coalesce(p_filters->>'postal_code','')='' OR l.data->>'postal_code' LIKE left(p_filters->>'postal_code',5)||'%')
 AND (coalesce(p_filters->>'fuel','')='' OR l.data->>'fuel'=p_filters->>'fuel')
 AND (coalesce(p_filters->>'transmission','')='' OR l.data->>'transmission'=p_filters->>'transmission')
 AND (coalesce(p_filters->>'body','')='' OR l.data->>'body'=p_filters->>'body')
 AND (coalesce(p_filters->>'condition','')='' OR l.data->>'condition'=p_filters->>'condition')
 AND (coalesce(p_filters->>'seller_type','')='' OR l.data->>'seller_type'=p_filters->>'seller_type')
 AND (NOT(p_filters ? 'min_price') OR (l.data->>'price_cents')::bigint>=(p_filters->>'min_price')::bigint)
 AND (NOT(p_filters ? 'max_price') OR (l.data->>'price_cents')::bigint<=(p_filters->>'max_price')::bigint)
 AND (NOT(p_filters ? 'min_mileage') OR (l.data->>'mileage')::integer>=(p_filters->>'min_mileage')::integer)
 AND (NOT(p_filters ? 'max_mileage') OR (l.data->>'mileage')::integer<=(p_filters->>'max_mileage')::integer)
 AND (NOT(p_filters ? 'min_power') OR (l.data->>'power_kw')::numeric>=(p_filters->>'min_power')::numeric)
 AND (NOT(p_filters ? 'max_power') OR (l.data->>'power_kw')::numeric<=(p_filters->>'max_power')::numeric)
 AND (NOT(p_filters ? 'first_from') OR l.data->>'first_registration'>=p_filters->>'first_from')
 AND (NOT(p_filters ? 'first_to') OR l.data->>'first_registration'<=p_filters->>'first_to')
 AND (NOT(p_filters ? 'hu_until') OR l.data->>'hu_until'>=p_filters->>'hu_until')
 AND (NOT(p_filters ? 'equipment') OR coalesce(l.data->'equipment','[]'::jsonb) @> (p_filters->'equipment'))
 AND (NOT(p_filters ? 'radius_km') OR geo.distance_km<=(p_filters->>'radius_km')::numeric)),
 page AS(SELECT *,row_number() OVER(ORDER BY CASE WHEN p_filters->>'sort'='distance' THEN distance_km END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='price_asc' THEN price END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='price_desc' THEN price END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='mileage_asc' THEN mileage END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='mileage_desc' THEN mileage END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='registration_asc' THEN registration END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='registration_desc' THEN registration END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='oldest' THEN publication_at END ASC NULLS LAST,
 publication_at DESC NULLS LAST,id) sort_position FROM matches ORDER BY CASE WHEN p_filters->>'sort'='distance' THEN distance_km END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='price_asc' THEN price END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='price_desc' THEN price END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='mileage_asc' THEN mileage END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='mileage_desc' THEN mileage END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='registration_asc' THEN registration END ASC NULLS LAST,
 CASE WHEN p_filters->>'sort'='registration_desc' THEN registration END DESC NULLS LAST,
 CASE WHEN p_filters->>'sort'='oldest' THEN publication_at END ASC NULLS LAST,
 publication_at DESC NULLS LAST,id LIMIT 24 OFFSET p_offset)
 SELECT (SELECT count(*) FROM matches),coalesce((SELECT jsonb_agg(public.luvipro_marketplace_card_v1(id)||jsonb_build_object('distance_km',round(distance_km::numeric,1)) ORDER BY sort_position) FROM page),'[]') INTO total,items;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',total>p_offset+24);END$function$
;
COMMIT;
