-- Inspection requests only: no order, payment, appointment availability or report entitlement created.
BEGIN;
CREATE FUNCTION public.luvipro_marketplace_partner_available_v1(p_uid uuid,p_inspection boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.users profile JOIN auth.users account ON account.id=profile.id
 WHERE profile.id=p_uid AND lower(profile.role)='partner' AND lower(profile.status) IN('active','verified','approved')
 AND account.email_confirmed_at IS NOT NULL AND account.deleted_at IS NULL AND (account.banned_until IS NULL OR account.banned_until<=now())
 AND (SELECT lower(latest.status) FROM public.partner_verifications latest WHERE latest.user_id=p_uid ORDER BY latest.created_at DESC,latest.id DESC LIMIT 1) IN('approved','verified','accepted')
 AND EXISTS(SELECT 1 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id WHERE loc.partner_user_id=p_uid AND loc.is_active AND v.status='approved' AND v.show_on_map AND (NOT p_inspection OR loc.accepts_inspection_requests)))
$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_partner_available_v1(uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.luvipro_marketplace_buyer_checks(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_key uuid NOT NULL,buyer_uid uuid NOT NULL,
 seller_uid uuid NOT NULL,listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),
 partner_uid uuid,product text NOT NULL CHECK(product IN('inspection_standard','inspection_premium')),
 status text NOT NULL DEFAULT 'waiting_seller' CHECK(status IN('waiting_seller','waiting_partner','accepted','appointment_proposed','scheduled','completed','rejected','cancelled')),
 seller_accepted boolean NOT NULL DEFAULT false,partner_independence_confirmed boolean NOT NULL DEFAULT false,
 slot timestamptz,buyer_slot_confirmed boolean NOT NULL DEFAULT false,seller_slot_confirmed boolean NOT NULL DEFAULT false,
 note text NOT NULL DEFAULT '' CHECK(length(note)<=1000),revision integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(buyer_uid,request_key),CHECK(buyer_uid<>seller_uid),CHECK(partner_uid IS NULL OR partner_uid<>seller_uid)
);
CREATE INDEX ON public.luvipro_marketplace_buyer_checks(buyer_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_buyer_checks(seller_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_buyer_checks(partner_uid,created_at DESC);
CREATE TABLE public.luvipro_marketplace_buyer_check_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,check_id uuid NOT NULL REFERENCES public.luvipro_marketplace_buyer_checks(id),
 actor_uid uuid NOT NULL,action text NOT NULL,status text NOT NULL,note text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.luvipro_marketplace_buyer_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luvipro_marketplace_buyer_check_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_buyer_checks,public.luvipro_marketplace_buyer_check_events FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.luvipro_marketplace_check_partners_v1(p_listing uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();l public.luvipro_marketplace_listings%ROWTYPE;items jsonb;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND status='published' AND public.luvipro_marketplace_eligible_v1(id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Listing unavailable';END IF;
 -- Reuse the same approved, opted-in Partner network as the existing checkout.
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(
 SELECT DISTINCT ON(loc.partner_user_id) loc.partner_user_id,loc.company_name,loc.city,loc.postal_code
 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id
 JOIN auth.users u ON u.id=loc.partner_user_id
 WHERE public.luvipro_marketplace_partner_available_v1(loc.partner_user_id,true) AND loc.is_active AND loc.accepts_inspection_requests AND v.status='approved' AND v.show_on_map
 AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=now())
 AND loc.partner_user_id<>l.seller_uid AND loc.partner_user_id<>(SELECT user_id FROM public.inspections WHERE id=l.inspection_id)
 ORDER BY loc.partner_user_id,CASE WHEN lower(loc.city)=lower(l.data->>'city') THEN 0 ELSE 1 END,loc.id LIMIT 50)x;
 RETURN jsonb_build_object('items',items,'listing_city',l.data->>'city','notice','Keine Terminverfügbarkeit oder Unabhängigkeit garantiert. Werkstatt muss Interessenfreiheit bestätigen.');
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_check_partners_v1(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_check_partners_v1(uuid) TO authenticated;

CREATE FUNCTION public.luvipro_marketplace_buyer_check_v1(p_action text,p_id uuid DEFAULT NULL,p_listing uuid DEFAULT NULL,p_partner uuid DEFAULT NULL,p_revision integer DEFAULT NULL,p_note text DEFAULT '',p_slot timestamptz DEFAULT NULL,p_confirm boolean DEFAULT false,p_request uuid DEFAULT NULL,p_product text DEFAULT 'inspection_standard')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();r public.luvipro_marketplace_buyer_checks%ROWTYPE;l public.luvipro_marketplace_listings%ROWTYPE;partners jsonb;items jsonb;target text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF length(coalesce(p_note,''))>1000 THEN RAISE EXCEPTION 'Bounded note required';END IF;
 IF p_action='history' THEN
  SELECT * INTO r FROM public.luvipro_marketplace_buyer_checks WHERE id=p_id;
  IF NOT FOUND OR NOT(actor IN(r.buyer_uid,r.seller_uid,coalesce(r.partner_uid,r.seller_uid)) OR public.is_admin()) THEN RAISE EXCEPTION 'Participant required' USING ERRCODE='42501';END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT action,status,note,created_at FROM public.luvipro_marketplace_buyer_check_events WHERE check_id=r.id ORDER BY id LIMIT 100)x;
  RETURN jsonb_build_object('items',items);
 END IF;
 IF p_action='list' THEN
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(
   SELECT c.*,advert.data->>'brand' brand,advert.data->>'model' model,advert.data->>'city' city,
   CASE WHEN c.buyer_uid=actor THEN 'buyer' WHEN c.seller_uid=actor THEN 'seller' WHEN c.partner_uid=actor THEN 'partner' ELSE 'admin' END participant_role
   FROM public.luvipro_marketplace_buyer_checks c JOIN public.luvipro_marketplace_listings advert ON advert.id=c.listing_id
   WHERE actor IN(c.buyer_uid,c.seller_uid,c.partner_uid) OR public.is_admin() ORDER BY c.updated_at DESC,c.id LIMIT 100)x;
  RETURN jsonb_build_object('items',items);
 END IF;
 IF p_action='create' THEN
  IF p_request IS NULL OR p_product NOT IN('inspection_standard','inspection_premium') THEN RAISE EXCEPTION 'Request key and existing product required';END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':buyer-check',0));
  SELECT * INTO r FROM public.luvipro_marketplace_buyer_checks WHERE buyer_uid=actor AND request_key=p_request;
  IF FOUND THEN
   IF r.listing_id IS DISTINCT FROM p_listing OR r.product IS DISTINCT FROM p_product THEN RAISE EXCEPTION 'Request key payload conflict';END IF;
   RETURN to_jsonb(r);
  END IF;
  SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND status='published' AND public.luvipro_marketplace_eligible_v1(id);
  IF NOT FOUND OR l.seller_uid=actor THEN RAISE EXCEPTION 'Published other-seller listing required';END IF;
  IF (SELECT count(*) FROM public.luvipro_marketplace_buyer_checks WHERE buyer_uid=actor AND created_at>now()-interval '1 day')>=10 THEN RAISE EXCEPTION 'Daily request limit reached';END IF;
  IF EXISTS(SELECT 1 FROM public.luvipro_marketplace_buyer_checks WHERE buyer_uid=actor AND listing_id=l.id AND status NOT IN('completed','rejected','cancelled')) THEN RAISE EXCEPTION 'Active request already exists';END IF;
  IF p_partner IS NOT NULL THEN
   IF p_partner=actor THEN RAISE EXCEPTION 'Requesting buyer cannot act as independent workshop';END IF;
   partners:=public.luvipro_marketplace_check_partners_v1(l.id);
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(partners->'items') x WHERE x->>'partner_user_id'=p_partner::text) THEN RAISE EXCEPTION 'Eligible unrelated workshop required';END IF;
  END IF;
  INSERT INTO public.luvipro_marketplace_buyer_checks(request_key,buyer_uid,seller_uid,listing_id,partner_uid,product,note) VALUES(p_request,actor,l.seller_uid,l.id,p_partner,p_product,coalesce(p_note,'')) RETURNING * INTO r;
  -- The buyer explicitly asks for seller cooperation through the existing private inquiry inbox.
  PERFORM public.luvipro_marketplace_message_v1(l.id,'Anfrage zur unabhängigen Nachprüfung. Bitte Käufer-Check in Ihren Anfragen prüfen. Es wurde kein Termin bestätigt und keine Zahlung ausgelöst.');
 ELSE
  SELECT * INTO r FROM public.luvipro_marketplace_buyer_checks WHERE id=p_id FOR UPDATE;
  IF NOT FOUND OR NOT(actor IN(r.buyer_uid,r.seller_uid,coalesce(r.partner_uid,r.seller_uid)) OR public.is_admin()) THEN RAISE EXCEPTION 'Participant required' USING ERRCODE='42501';END IF;
  IF p_revision IS DISTINCT FROM r.revision THEN RAISE EXCEPTION 'Revision conflict';END IF;
  IF r.status IN('completed','rejected','cancelled') THEN RAISE EXCEPTION 'Closed request';END IF;
  IF p_action IN('partner_accept','propose_slot','complete') AND NOT EXISTS(
   SELECT 1 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id
   WHERE loc.partner_user_id=actor AND actor=r.partner_uid AND loc.is_active AND loc.accepts_inspection_requests AND v.status='approved' AND v.show_on_map
  ) THEN RAISE EXCEPTION 'Workshop authorization no longer active' USING ERRCODE='42501';END IF;
  IF p_action IN('partner_accept','propose_slot','complete') AND NOT public.luvipro_marketplace_partner_available_v1(actor,true) THEN RAISE EXCEPTION 'Current approved Partner profile required' USING ERRCODE='42501';END IF;
  target:=r.status;
  IF p_action='cancel' AND (actor=r.buyer_uid OR public.is_admin()) THEN target:='cancelled';
  ELSIF p_action='reject' AND actor IN(r.seller_uid,coalesce(r.partner_uid,r.seller_uid)) THEN target:='rejected';
  ELSIF p_action='seller_accept' AND actor=r.seller_uid AND r.status='waiting_seller' AND p_confirm IS TRUE THEN r.seller_accepted:=true;target:='waiting_partner';
  ELSIF p_action='assign_partner' AND actor=r.buyer_uid AND r.status IN('waiting_seller','waiting_partner') THEN
   partners:=public.luvipro_marketplace_check_partners_v1(r.listing_id);
   IF p_partner IS NULL OR p_partner=r.buyer_uid OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(partners->'items') x WHERE x->>'partner_user_id'=p_partner::text) THEN RAISE EXCEPTION 'Eligible workshop required';END IF;
   r.partner_uid:=p_partner;
  ELSIF p_action='partner_accept' AND actor=r.partner_uid AND r.status='waiting_partner' AND r.seller_accepted AND p_confirm IS TRUE THEN
   partners:=public.luvipro_marketplace_check_partners_v1(r.listing_id);
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(partners->'items') x WHERE x->>'partner_user_id'=actor::text) THEN RAISE EXCEPTION 'Workshop no longer eligible';END IF;
   r.partner_independence_confirmed:=true;target:='accepted';
  ELSIF p_action='propose_slot' AND actor=r.partner_uid AND r.status IN('accepted','appointment_proposed') AND p_slot>now() AND p_slot<now()+interval '1 year' THEN
   r.slot:=p_slot;r.buyer_slot_confirmed:=false;r.seller_slot_confirmed:=false;target:='appointment_proposed';
  ELSIF p_action='confirm_slot' AND p_confirm IS TRUE AND r.status='appointment_proposed' AND r.slot>now() AND actor IN(r.buyer_uid,r.seller_uid) THEN
   IF actor=r.buyer_uid THEN r.buyer_slot_confirmed:=true;ELSE r.seller_slot_confirmed:=true;END IF;
   IF r.buyer_slot_confirmed AND r.seller_slot_confirmed THEN target:='scheduled';END IF;
  ELSIF p_action='complete' AND actor=r.partner_uid AND r.status='scheduled' AND r.slot<=now() AND p_confirm IS TRUE THEN target:='completed';
  ELSE RAISE EXCEPTION 'Action not allowed for participant and status' USING ERRCODE='42501';END IF;
  IF p_action IN('reject','cancel','propose_slot','complete') AND length(btrim(coalesce(p_note,'')))<12 THEN RAISE EXCEPTION 'Documented reason required';END IF;
  UPDATE public.luvipro_marketplace_buyer_checks SET partner_uid=r.partner_uid,status=target,seller_accepted=r.seller_accepted,partner_independence_confirmed=r.partner_independence_confirmed,slot=r.slot,buyer_slot_confirmed=r.buyer_slot_confirmed,seller_slot_confirmed=r.seller_slot_confirmed,note=coalesce(p_note,''),revision=revision+1,updated_at=now() WHERE id=r.id RETURNING * INTO r;
 END IF;
 INSERT INTO public.luvipro_marketplace_buyer_check_events(check_id,actor_uid,action,status,note) VALUES(r.id,actor,p_action,r.status,coalesce(p_note,''));
 RETURN to_jsonb(r);
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_buyer_check_v1(text,uuid,uuid,uuid,integer,text,timestamptz,boolean,uuid,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_buyer_check_v1(text,uuid,uuid,uuid,integer,text,timestamptz,boolean,uuid,text) TO authenticated;
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
CREATE OR REPLACE FUNCTION public.luvipro_marketplace_dealer_v1(p_dealer uuid DEFAULT NULL::uuid, p_listing uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT jsonb_build_object('id',loc.id,'company_name',loc.company_name,'city',loc.city,'postal_code',loc.postal_code,
 'street',loc.street,'house_number',loc.house_number,'country',loc.country)
 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id
 WHERE loc.is_active AND v.status='approved' AND v.show_on_map AND public.luvipro_marketplace_partner_available_v1(loc.partner_user_id)
 AND (p_dealer IS NOT NULL AND loc.id=p_dealer OR p_listing IS NOT NULL AND EXISTS(
 SELECT 1 FROM public.luvipro_marketplace_listings l WHERE l.id=p_listing AND l.seller_uid=loc.partner_user_id AND l.data->>'seller_type'='commercial' AND l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)))
 ORDER BY loc.id LIMIT 1
$function$
;
COMMIT;
