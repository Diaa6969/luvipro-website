-- Preserve original publication timestamps on future republication; deterministic public pagination. No record rewrites.
BEGIN;
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

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_state_v1(p_id uuid, p_revision integer, p_action text, p_reason text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();l public.luvipro_marketplace_listings%ROWTYPE;target text;BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR (l.seller_uid IS DISTINCT FROM actor AND NOT public.is_admin()) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';END IF;
 IF l.seller_uid IS DISTINCT FROM actor AND length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 1000 THEN RAISE EXCEPTION 'Documented Admin moderation reason required';END IF;
 IF p_revision IS DISTINCT FROM l.revision THEN RAISE EXCEPTION 'Revision conflict';END IF;
 IF p_action IN ('approve','reject') THEN
 IF NOT public.is_admin() OR l.status<>'pending_review' OR length(btrim(p_reason)) NOT BETWEEN 8 AND 1000 THEN RAISE EXCEPTION 'Admin review with documented seller-rights check required' USING ERRCODE='42501';END IF;
 target:=CASE WHEN p_action='approve' THEN 'published' ELSE 'rejected' END;
 ELSIF p_action='submit' AND l.status IN ('draft','paused','rejected') THEN target:='pending_review';
 ELSIF p_action='pause' AND l.status IN ('published','pending_review') THEN target:='paused';
 ELSIF p_action='sold' AND l.status IN ('published','paused') THEN target:='sold';
 ELSIF p_action='archive' AND l.status<>'archived' THEN target:='archived';
 ELSE RAISE EXCEPTION 'Invalid transition';END IF;
 IF target IN ('published','pending_review') THEN
 IF NOT public.luvipro_marketplace_eligible_v1(l.id) THEN RAISE EXCEPTION 'Valid authorized locked report required';END IF;
 IF coalesce(l.data->>'brand','')='' OR coalesce(l.data->>'model','')='' OR coalesce(l.data->>'city','')='' OR coalesce(l.data->>'postal_code','')!~'^[0-9]{5}$' OR coalesce((l.data->>'price_cents')::bigint,0)<=0 OR coalesce(l.data->>'seller_type','') NOT IN ('private','commercial') OR coalesce(l.data->>'seller_rights_declared','')<>'true' THEN RAISE EXCEPTION 'Required vehicle, price, location and seller declaration missing';END IF;
 IF l.data->>'seller_type'='commercial' AND length(coalesce(l.data->>'commercial_identity',''))<20 THEN RAISE EXCEPTION 'Commercial identity required';END IF;
 IF coalesce(l.data->>'first_registration','')='' OR coalesce(l.data->>'fuel','')='' OR coalesce(l.data->>'transmission','')='' OR coalesce(l.data->>'mileage','')='' THEN RAISE EXCEPTION 'First registration, mileage, fuel and transmission required';END IF;
 IF EXISTS(SELECT 1 FROM public.inspections WHERE id=l.inspection_id AND mileage>(l.data->>'mileage')::integer) THEN RAISE EXCEPTION 'Listing mileage cannot be below linked inspection';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE listing_id=l.id AND removed_at IS NULL) THEN RAISE EXCEPTION 'At least one listing photo required';END IF;
 END IF;
 UPDATE public.luvipro_marketplace_listings SET status=target,revision=revision+1,updated_at=now(),published_at=CASE WHEN target='published' THEN coalesce(published_at,now()) ELSE published_at END WHERE id=l.id RETURNING * INTO l;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,p_action,jsonb_build_object('reason',p_reason,'revision',l.revision));
 RETURN to_jsonb(l)-'search_document';END$function$
;

COMMIT;
