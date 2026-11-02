-- Additive Marketplace core. No existing inspections, vehicles or entitlements are rewritten.
BEGIN;
CREATE TABLE public.luvipro_marketplace_authorities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_uid uuid NOT NULL REFERENCES auth.users(id),
 vehicle_id uuid NOT NULL REFERENCES public.vehicles(id), inspection_id uuid NOT NULL REFERENCES public.inspections(id),
 evidence_ref text NOT NULL CHECK(length(evidence_ref) BETWEEN 8 AND 300),
 reviewed_by uuid NOT NULL REFERENCES auth.users(id), reviewed_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, revoked_at timestamptz,
 CHECK(expires_at>reviewed_at)
);
CREATE TABLE public.luvipro_marketplace_listings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 vehicle_id uuid REFERENCES public.vehicles(id), inspection_id uuid REFERENCES public.inspections(id),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','published','paused','sold','archived','rejected')),
 revision integer NOT NULL DEFAULT 1, data jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(data)='object' AND octet_length(data::text)<=24000),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
 search_document tsvector GENERATED ALWAYS AS (to_tsvector('german',coalesce(data->>'brand','')||' '||coalesce(data->>'model','')||' '||coalesce(data->>'variant','')||' '||coalesce(data->>'city','')||' '||coalesce(data->>'description',''))) STORED
);
CREATE INDEX ON public.luvipro_marketplace_listings(seller_uid,updated_at DESC);
CREATE INDEX ON public.luvipro_marketplace_listings(status,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_listings USING gin(search_document);
CREATE INDEX ON public.luvipro_marketplace_listings USING gin(data jsonb_path_ops);
CREATE TABLE public.luvipro_marketplace_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),
 object_path text NOT NULL UNIQUE, category text NOT NULL, position integer NOT NULL CHECK(position BETWEEN 0 AND 99),
 mime_type text NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),
 bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 10485760),removed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.luvipro_marketplace_photos(listing_id,position) WHERE removed_at IS NULL;
CREATE TABLE public.luvipro_marketplace_favorites (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,listing_id)
);
CREATE TABLE public.luvipro_marketplace_inquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),
 buyer_uid uuid NOT NULL REFERENCES auth.users(id),seller_uid uuid NOT NULL REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(listing_id,buyer_uid),CHECK(buyer_uid<>seller_uid)
);
CREATE TABLE public.luvipro_marketplace_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),inquiry_id uuid NOT NULL REFERENCES public.luvipro_marketplace_inquiries(id),
 sender_uid uuid NOT NULL REFERENCES auth.users(id),body text NOT NULL CHECK(length(body) BETWEEN 1 AND 3000),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.luvipro_marketplace_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,listing_id uuid,actor_uid uuid,action text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now()
);
DO $$DECLARE t text;BEGIN FOREACH t IN ARRAY ARRAY['authorities','listings','photos','favorites','inquiries','messages','audit'] LOOP
 EXECUTE format('ALTER TABLE public.luvipro_marketplace_%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.luvipro_marketplace_%I FROM PUBLIC,anon,authenticated',t);
END LOOP;END$$;

CREATE FUNCTION public.luvipro_marketplace_eligible_v1(p_listing uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.luvipro_marketplace_listings l JOIN public.inspections i ON i.id=l.inspection_id
 JOIN public.vehicles v ON v.id=l.vehicle_id JOIN auth.users a ON a.id=l.seller_uid
 WHERE l.id=p_listing AND a.email_confirmed_at IS NOT NULL AND a.deleted_at IS NULL
 AND i.status='locked' AND i.locked_at IS NOT NULL AND i.report_status='generated' AND i.report_generated_at IS NOT NULL
 AND upper(regexp_replace(v.vin,'\s','','g'))=upper(regexp_replace(i.vin,'\s','','g')) AND length(v.vin)=17
 AND ((v.user_id=l.seller_uid AND i.user_id=l.seller_uid) OR EXISTS(
 SELECT 1 FROM public.luvipro_marketplace_authorities m WHERE m.seller_uid=l.seller_uid AND m.vehicle_id=v.id AND m.inspection_id=i.id AND m.revoked_at IS NULL AND m.expires_at>now())))
$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_eligible_v1(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.luvipro_marketplace_card_v1(p_listing uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('id',l.id,'status',l.status,'published_at',l.published_at,
 'vehicle',l.data-'vin'-'contact_email'-'contact_phone'-'private_address',
 'report',jsonb_build_object('reference',i.id,'inspected_at',i.created_at,'status',i.report_status,'brand',i.brand,'model',i.modell,'year',i.year,'mileage',i.mileage),
 'photos',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'category',p.category,'position',p.position) ORDER BY p.position,p.created_at) FROM public.luvipro_marketplace_photos p WHERE p.listing_id=l.id AND p.removed_at IS NULL),'[]'::jsonb))
 FROM public.luvipro_marketplace_listings l JOIN public.inspections i ON i.id=l.inspection_id
 WHERE l.id=p_listing AND l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)
$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_card_v1(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.luvipro_marketplace_save_v1(p_id uuid,p_revision integer,p_vehicle uuid,p_report uuid,p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();l public.luvipro_marketplace_listings%ROWTYPE;k text;BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Confirmed account required' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>24000 THEN RAISE EXCEPTION 'Invalid listing';END IF;
 FOR k IN SELECT jsonb_object_keys(p_data) LOOP
 IF k<>ALL(ARRAY['brand','model','variant','category','first_registration','year','condition','hsn','tsn','mileage','fuel','transmission','power_kw','displacement','drive','body','doors','seats','exterior_color','interior_color','interior_material','emission','badge','hu_until','origin','battery_kwh','range_km','charging','battery_health','previous_owners','accident_declaration','known_damage','repaired_damage','unrepaired_damage','service_history','service_book','last_maintenance','technical_defects','smoking','replacement_engine','modifications','warranty','equipment','price_cents','negotiable','seller_type','vat_disclosed','postal_code','city','region','contact_method','seller_description','description','commercial_identity','latitude','longitude','seller_rights_declared']) THEN RAISE EXCEPTION 'Unsupported listing field: %',k;END IF;
 END LOOP;
 IF length(coalesce(p_data->>'description',''))>6000 OR length(coalesce(p_data->>'seller_description',''))>1500 THEN RAISE EXCEPTION 'Text too long';END IF;
 IF p_data ? 'price_cents' AND (p_data->>'price_cents')!~'^[0-9]{1,10}$' THEN RAISE EXCEPTION 'Invalid total price';END IF;
 IF p_data ? 'mileage' AND (p_data->>'mileage')!~'^[0-9]{1,7}$' THEN RAISE EXCEPTION 'Invalid mileage';END IF;
 IF p_data ? 'equipment' AND (jsonb_typeof(p_data->'equipment')<>'array' OR jsonb_array_length(p_data->'equipment')>100) THEN RAISE EXCEPTION 'Invalid equipment';END IF;
 IF p_id IS NULL THEN
 IF (SELECT count(*) FROM public.luvipro_marketplace_listings WHERE seller_uid=actor AND status NOT IN ('archived','sold'))>=100 THEN RAISE EXCEPTION 'Listing limit';END IF;
 INSERT INTO public.luvipro_marketplace_listings(seller_uid,data) VALUES(actor,p_data) RETURNING * INTO l;
 ELSE
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_id AND seller_uid=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Own listing required' USING ERRCODE='42501';END IF;
 IF p_revision IS DISTINCT FROM l.revision OR l.status IN ('sold','archived') THEN RAISE EXCEPTION 'Listing changed or closed';END IF;
 END IF;
 UPDATE public.luvipro_marketplace_listings SET vehicle_id=p_vehicle,inspection_id=p_report,data=p_data,status='draft',revision=revision+1,updated_at=now() WHERE id=l.id RETURNING * INTO l;
 IF p_report IS NOT NULL AND NOT public.luvipro_marketplace_eligible_v1(l.id) THEN RAISE EXCEPTION 'Matching locked report and advertising authority required' USING ERRCODE='42501';END IF;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,'draft_saved',jsonb_build_object('revision',l.revision));
 RETURN to_jsonb(l)-'search_document';END$$;

CREATE FUNCTION public.luvipro_marketplace_state_v1(p_id uuid,p_revision integer,p_action text,p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();l public.luvipro_marketplace_listings%ROWTYPE;target text;BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR (l.seller_uid IS DISTINCT FROM actor AND NOT public.is_admin()) THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501';END IF;
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
 IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE listing_id=l.id AND removed_at IS NULL) THEN RAISE EXCEPTION 'At least one listing photo required';END IF;
 END IF;
 UPDATE public.luvipro_marketplace_listings SET status=target,revision=revision+1,updated_at=now(),published_at=CASE WHEN target='published' THEN now() ELSE published_at END WHERE id=l.id RETURNING * INTO l;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,p_action,jsonb_build_object('reason',p_reason,'revision',l.revision));
 RETURN to_jsonb(l)-'search_document';END$$;

CREATE FUNCTION public.luvipro_marketplace_read_v1(p_mode text DEFAULT 'search',p_id uuid DEFAULT NULL,p_filters jsonb DEFAULT '{}',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();items jsonb;total bigint;BEGIN
 IF p_offset NOT BETWEEN 0 AND 100000 OR p_offset IS NULL OR jsonb_typeof(p_filters)<>'object' OR octet_length(p_filters::text)>4000 THEN RAISE EXCEPTION 'Invalid query';END IF;
 IF p_mode='detail' THEN RETURN public.luvipro_marketplace_card_v1(p_id);END IF;
 IF p_mode IN ('mine','review','eligible') AND actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF p_mode='review' AND NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF p_mode='eligible' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT v.id vehicle_id,i.id inspection_id,v.brand,v.model,v.year,v.mileage,i.created_at inspected_at FROM public.vehicles v JOIN public.inspections i ON upper(v.vin)=upper(i.vin) WHERE length(v.vin)=17 AND i.status='locked' AND i.locked_at IS NOT NULL AND i.report_status='generated' AND i.report_generated_at IS NOT NULL AND ((v.user_id=actor AND i.user_id=actor) OR EXISTS(SELECT 1 FROM public.luvipro_marketplace_authorities a WHERE a.seller_uid=actor AND a.vehicle_id=v.id AND a.inspection_id=i.id AND a.revoked_at IS NULL AND a.expires_at>now())) ORDER BY i.created_at DESC LIMIT 50 OFFSET p_offset)x;
 RETURN jsonb_build_object('items',items);END IF;
 IF p_mode IN ('mine','review') THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)-'search_document'),'[]') INTO items FROM(SELECT * FROM public.luvipro_marketplace_listings WHERE (p_mode='mine' AND seller_uid=actor OR p_mode='review' AND status='pending_review') AND (p_id IS NULL OR id=p_id) ORDER BY updated_at DESC LIMIT 30 OFFSET p_offset)x;
 RETURN jsonb_build_object('items',items);END IF;
 IF p_mode<>'search' THEN RAISE EXCEPTION 'Unknown view';END IF;
 WITH matches AS(SELECT l.id,l.created_at,(l.data->>'price_cents')::bigint price FROM public.luvipro_marketplace_listings l
 WHERE l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)
 AND (coalesce(p_filters->>'q','')='' OR l.search_document @@ websearch_to_tsquery('german',left(p_filters->>'q',120)))
 AND (coalesce(p_filters->>'brand','')='' OR l.data->>'brand'=p_filters->>'brand')
 AND (coalesce(p_filters->>'fuel','')='' OR l.data->>'fuel'=p_filters->>'fuel')
 AND (coalesce(p_filters->>'transmission','')='' OR l.data->>'transmission'=p_filters->>'transmission')
 AND (coalesce(p_filters->>'seller_type','')='' OR l.data->>'seller_type'=p_filters->>'seller_type')
 AND (NOT p_filters ? 'max_price' OR (l.data->>'price_cents')::bigint<=(p_filters->>'max_price')::bigint)
 AND (NOT p_filters ? 'max_mileage' OR (l.data->>'mileage')::integer<=(p_filters->>'max_mileage')::integer)
 AND (NOT (p_filters ? 'equipment') OR coalesce(l.data->'equipment','[]'::jsonb) @> (p_filters->'equipment'))),
 page AS(SELECT * FROM matches ORDER BY CASE WHEN p_filters->>'sort'='price_asc' THEN price END ASC,CASE WHEN p_filters->>'sort'='price_desc' THEN price END DESC,created_at DESC,id LIMIT 24 OFFSET p_offset)
 SELECT (SELECT count(*) FROM matches),coalesce((SELECT jsonb_agg(public.luvipro_marketplace_card_v1(id)) FROM page),'[]') INTO total,items;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',total>p_offset+24);END$$;

CREATE FUNCTION public.luvipro_marketplace_favorite_v1(p_id uuid,p_enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF p_enabled THEN IF public.luvipro_marketplace_card_v1(p_id) IS NULL THEN RAISE EXCEPTION 'Listing unavailable';END IF;
 INSERT INTO public.luvipro_marketplace_favorites(user_id,listing_id) VALUES(auth.uid(),p_id) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.luvipro_marketplace_favorites WHERE user_id=auth.uid() AND listing_id=p_id;END IF;END$$;

CREATE FUNCTION public.luvipro_marketplace_message_v1(p_listing uuid,p_body text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();seller uuid;thread uuid;BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Confirmed account required' USING ERRCODE='42501';END IF;
 IF length(btrim(p_body)) NOT BETWEEN 1 AND 3000 THEN RAISE EXCEPTION 'Invalid message';END IF;
 SELECT id INTO thread FROM public.luvipro_marketplace_inquiries WHERE listing_id=p_listing AND seller_uid=actor;
 -- Seller replies use the explicit inquiry function below, never choose an arbitrary buyer.
 IF thread IS NOT NULL THEN RAISE EXCEPTION 'Use inquiry reply';END IF;
 SELECT seller_uid INTO seller FROM public.luvipro_marketplace_listings WHERE id=p_listing AND status='published' AND public.luvipro_marketplace_eligible_v1(id);
 IF seller IS NULL OR seller=actor THEN RAISE EXCEPTION 'Listing unavailable';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,913));
 IF (SELECT count(*) FROM public.luvipro_marketplace_messages WHERE sender_uid=actor AND created_at>now()-interval '1 hour')>=30 THEN RAISE EXCEPTION 'Message rate limit';END IF;
 INSERT INTO public.luvipro_marketplace_inquiries(listing_id,buyer_uid,seller_uid) VALUES(p_listing,actor,seller) ON CONFLICT(listing_id,buyer_uid) DO UPDATE SET listing_id=excluded.listing_id RETURNING id INTO thread;
 INSERT INTO public.luvipro_marketplace_messages(inquiry_id,sender_uid,body) VALUES(thread,actor,btrim(p_body));RETURN thread;END$$;

CREATE FUNCTION public.luvipro_marketplace_inbox_v1(p_thread uuid DEFAULT NULL,p_reply text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();items jsonb;BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF p_thread IS NULL THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT id,listing_id,created_at,CASE WHEN buyer_uid=actor THEN 'buyer' ELSE 'seller' END participant_role FROM public.luvipro_marketplace_inquiries WHERE actor IN (buyer_uid,seller_uid) ORDER BY created_at DESC LIMIT 100)x;
 ELSE
 IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_inquiries WHERE id=p_thread AND actor IN (buyer_uid,seller_uid)) THEN RAISE EXCEPTION 'Conversation access denied' USING ERRCODE='42501';END IF;
 IF p_reply IS NOT NULL THEN
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,913));
 IF length(btrim(p_reply)) NOT BETWEEN 1 AND 3000 OR (SELECT count(*) FROM public.luvipro_marketplace_messages WHERE sender_uid=actor AND created_at>now()-interval '1 hour')>=30 THEN RAISE EXCEPTION 'Message limit';END IF;
 INSERT INTO public.luvipro_marketplace_messages(inquiry_id,sender_uid,body) VALUES(p_thread,actor,btrim(p_reply));END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT id,body,created_at,sender_uid=actor own FROM public.luvipro_marketplace_messages WHERE inquiry_id=p_thread ORDER BY created_at DESC LIMIT 100)x;END IF;
 RETURN jsonb_build_object('items',items);END$$;

CREATE FUNCTION public.luvipro_marketplace_report_changed_v1() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
 WITH changed AS(UPDATE public.luvipro_marketplace_listings SET status='paused',revision=revision+1,updated_at=now() WHERE inspection_id=NEW.id AND status IN ('published','pending_review') AND NOT public.luvipro_marketplace_eligible_v1(id) RETURNING id)
 INSERT INTO public.luvipro_marketplace_audit(listing_id,action) SELECT id,'report_eligibility_revoked' FROM changed;
 RETURN NEW;END$$;
CREATE TRIGGER luvipro_marketplace_report_changed AFTER UPDATE OF status,report_status,locked_at,report_generated_at,vin,user_id ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.luvipro_marketplace_report_changed_v1();
REVOKE ALL ON FUNCTION public.luvipro_marketplace_report_changed_v1() FROM PUBLIC,anon,authenticated;
DO $$DECLARE r record;BEGIN FOR r IN SELECT oid::regprocedure signature,proname FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('luvipro_marketplace_save_v1','luvipro_marketplace_state_v1','luvipro_marketplace_read_v1','luvipro_marketplace_favorite_v1','luvipro_marketplace_message_v1','luvipro_marketplace_inbox_v1') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',r.signature);
 EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',r.signature);
 IF r.proname='luvipro_marketplace_read_v1' THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon',r.signature);END IF;
END LOOP;END$$;
CREATE FUNCTION public.luvipro_marketplace_authority_v1(p_seller uuid,p_vehicle uuid,p_report uuid,p_evidence text,p_expires timestamptz,p_revoke uuid DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE result uuid;BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF length(btrim(p_evidence)) NOT BETWEEN 8 AND 300 THEN RAISE EXCEPTION 'Reviewed mandate evidence required';END IF;
 IF p_revoke IS NOT NULL THEN
 UPDATE public.luvipro_marketplace_authorities SET revoked_at=now() WHERE id=p_revoke RETURNING id INTO result;
 ELSE
 IF p_expires NOT BETWEEN now()+interval '1 day' AND now()+interval '1 year' OR p_expires IS NULL THEN RAISE EXCEPTION 'Limited mandate validity required';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.vehicles v JOIN public.inspections i ON upper(v.vin)=upper(i.vin) WHERE v.id=p_vehicle AND i.id=p_report AND length(v.vin)=17 AND i.status='locked' AND i.report_status='generated') THEN RAISE EXCEPTION 'Matching valid report required';END IF;
 INSERT INTO public.luvipro_marketplace_authorities(seller_uid,vehicle_id,inspection_id,evidence_ref,reviewed_by,expires_at) VALUES(p_seller,p_vehicle,p_report,btrim(p_evidence),auth.uid(),p_expires) RETURNING id INTO result;END IF;
 IF result IS NULL THEN RAISE EXCEPTION 'Mandate not found';END IF;
 INSERT INTO public.luvipro_marketplace_audit(actor_uid,action,details) VALUES(auth.uid(),CASE WHEN p_revoke IS NULL THEN 'mandate_verified' ELSE 'mandate_revoked' END,jsonb_build_object('authority_id',result,'evidence_ref',p_evidence));
 RETURN result;END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_authority_v1(uuid,uuid,uuid,text,timestamptz,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_authority_v1(uuid,uuid,uuid,text,timestamptz,uuid) TO authenticated;

-- Only trusted upload servers may finalize verified image bytes. Browser never gets service key.
CREATE FUNCTION public.luvipro_marketplace_photo_commit_v1(p_actor uuid,p_listing uuid,p_path text,p_mime text,p_bytes integer,p_category text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE l public.luvipro_marketplace_listings%ROWTYPE;result uuid;n integer;BEGIN
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND seller_uid=p_actor FOR UPDATE;
 IF NOT FOUND OR l.status IN ('sold','archived') THEN RAISE EXCEPTION 'Editable own listing required' USING ERRCODE='42501';END IF;
 IF p_path NOT LIKE p_actor::text||'/'||p_listing::text||'/%' OR p_category<>ALL(ARRAY['front','rear','left','right','interior','dashboard','odometer','engine','wheels','damage','other']) THEN RAISE EXCEPTION 'Invalid photo path/category';END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='luvipro-marketplace-media' AND name=p_path) THEN RAISE EXCEPTION 'Completed private Storage upload required';END IF;
 SELECT count(*) INTO n FROM public.luvipro_marketplace_photos WHERE listing_id=p_listing AND removed_at IS NULL;
 IF n>=24 THEN RAISE EXCEPTION 'Maximum 24 photos';END IF;
 INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES(p_listing,p_path,p_category,n,p_mime,p_bytes) RETURNING id INTO result;
 UPDATE public.luvipro_marketplace_listings SET status='draft',revision=revision+1,updated_at=now() WHERE id=p_listing;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(p_listing,p_actor,'photo_uploaded',jsonb_build_object('photo_id',result));RETURN result;END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_photo_commit_v1(uuid,uuid,text,text,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_photo_commit_v1(uuid,uuid,text,text,integer,text) TO service_role;

CREATE FUNCTION public.luvipro_marketplace_photos_v1(p_listing uuid,p_order uuid[] DEFAULT NULL,p_remove uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE l public.luvipro_marketplace_listings%ROWTYPE;items jsonb;BEGIN
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND (seller_uid=auth.uid() OR public.is_admin()) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Own listing or Admin required' USING ERRCODE='42501';END IF;
 IF (p_order IS NOT NULL OR p_remove IS NOT NULL) AND (l.seller_uid IS DISTINCT FROM auth.uid() OR l.status IN ('sold','archived')) THEN RAISE EXCEPTION 'Editable own listing required';END IF;
 IF p_order IS NOT NULL THEN
 IF cardinality(p_order)<>(SELECT count(*) FROM public.luvipro_marketplace_photos WHERE listing_id=p_listing AND removed_at IS NULL) OR cardinality(p_order)<>(SELECT count(DISTINCT x) FROM unnest(p_order)x) OR EXISTS(SELECT 1 FROM unnest(p_order)x WHERE NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE id=x AND listing_id=p_listing AND removed_at IS NULL)) THEN RAISE EXCEPTION 'Complete own photo order required';END IF;
 UPDATE public.luvipro_marketplace_photos p SET position=x.n-1 FROM unnest(p_order) WITH ORDINALITY x(id,n) WHERE p.id=x.id AND p.listing_id=p_listing;END IF;
 IF p_remove IS NOT NULL THEN UPDATE public.luvipro_marketplace_photos SET removed_at=now() WHERE id=p_remove AND listing_id=p_listing AND removed_at IS NULL;IF NOT FOUND THEN RAISE EXCEPTION 'Photo not found';END IF;END IF;
 IF p_order IS NOT NULL OR p_remove IS NOT NULL THEN
 UPDATE public.luvipro_marketplace_listings SET status='draft',revision=revision+1,updated_at=now() WHERE id=p_listing;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action) VALUES(p_listing,auth.uid(),'photos_changed');END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'category',category,'position',position) ORDER BY position,created_at),'[]') INTO items FROM public.luvipro_marketplace_photos WHERE listing_id=p_listing AND removed_at IS NULL;
 RETURN jsonb_build_object('items',items);END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_photos_v1(uuid,uuid[],uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_photos_v1(uuid,uuid[],uuid) TO authenticated;

CREATE FUNCTION public.luvipro_marketplace_photo_access_v1(p_photo uuid,p_actor uuid DEFAULT NULL) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p.object_path FROM public.luvipro_marketplace_photos p JOIN public.luvipro_marketplace_listings l ON l.id=p.listing_id
 WHERE p.id=p_photo AND p.removed_at IS NULL AND ((l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)) OR l.seller_uid=p_actor OR EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND lower(role)='admin'))
$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_photo_access_v1(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_photo_access_v1(uuid,uuid) TO service_role;
CREATE FUNCTION public.luvipro_marketplace_favorites_v1(p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE items jsonb;BEGIN
 IF auth.uid() IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Authenticated page required';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('listing_id',x.listing_id,'listing',public.luvipro_marketplace_card_v1(x.listing_id))),'[]') INTO items FROM(SELECT listing_id FROM public.luvipro_marketplace_favorites WHERE user_id=auth.uid() ORDER BY created_at DESC LIMIT 24 OFFSET p_offset)x;
 RETURN jsonb_build_object('items',items);END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_favorites_v1(integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_favorites_v1(integer) TO authenticated;
COMMIT;
