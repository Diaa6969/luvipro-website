-- Operational safeguards for the existing Marketplace core; no business records rewritten.
BEGIN;
ALTER TABLE public.luvipro_marketplace_listings ADD COLUMN draft_vin text CHECK(draft_vin IS NULL OR draft_vin~'^[A-Z0-9]{1,17}$');
CREATE TABLE public.luvipro_marketplace_upload_intents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),request_id uuid NOT NULL,actor_uid uuid NOT NULL REFERENCES auth.users(id),
 listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),object_path text NOT NULL UNIQUE,
 mime_type text NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),bytes integer NOT NULL CHECK(bytes BETWEEN 16 AND 10485760),
 sha256 text NOT NULL CHECK(sha256~'^[0-9a-f]{64}$'),category text NOT NULL,
 status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','committed')),photo_id uuid REFERENCES public.luvipro_marketplace_photos(id),
 created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '10 minutes',
 UNIQUE(actor_uid,request_id)
);
ALTER TABLE public.luvipro_marketplace_upload_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_upload_intents FROM PUBLIC,anon,authenticated;
CREATE INDEX ON public.luvipro_marketplace_upload_intents(actor_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_upload_intents(listing_id,status,expires_at);
CREATE INDEX ON public.luvipro_marketplace_messages(inquiry_id,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_messages(sender_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_inquiries(buyer_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_inquiries(seller_uid,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_audit(listing_id,created_at DESC);
CREATE TABLE public.luvipro_marketplace_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid NOT NULL REFERENCES public.luvipro_marketplace_listings(id),
 reporter_uid uuid NOT NULL REFERENCES auth.users(id),reason text NOT NULL CHECK(length(reason) BETWEEN 12 AND 2000),
 status text NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','closed')),
 decision text,reviewed_by uuid REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(),reviewed_at timestamptz
);
ALTER TABLE public.luvipro_marketplace_cases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_cases FROM PUBLIC,anon,authenticated;
CREATE INDEX ON public.luvipro_marketplace_cases(status,created_at DESC);
CREATE INDEX ON public.luvipro_marketplace_cases(reporter_uid,created_at DESC);

CREATE FUNCTION public.luvipro_marketplace_actor_v1(p_uid uuid DEFAULT auth.uid()) RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$BEGIN
 IF p_uid IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=p_uid AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND coalesce(banned_until,'-infinity'::timestamptz)<=now()) THEN RAISE EXCEPTION 'Active confirmed account required' USING ERRCODE='42501';END IF;
 RETURN p_uid;END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_actor_v1(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.luvipro_marketplace_upload_reserve_v1(p_actor uuid,p_listing uuid,p_request uuid,p_mime text,p_bytes integer,p_sha256 text,p_category text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1(p_actor);l public.luvipro_marketplace_listings%ROWTYPE;i public.luvipro_marketplace_upload_intents%ROWTYPE;path text;n integer;BEGIN
 IF p_request IS NULL OR p_mime<>ALL(ARRAY['image/jpeg','image/png','image/webp']) OR p_bytes NOT BETWEEN 16 AND 10485760 OR p_sha256!~'^[0-9a-f]{64}$' OR p_category<>ALL(ARRAY['front','rear','left','right','interior','dashboard','odometer','engine','wheels','damage','other']) THEN RAISE EXCEPTION 'Invalid upload';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,9204));
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND seller_uid=actor FOR UPDATE;
 IF NOT FOUND OR l.status IN ('sold','archived') THEN RAISE EXCEPTION 'Editable own listing required' USING ERRCODE='42501';END IF;
 SELECT * INTO i FROM public.luvipro_marketplace_upload_intents WHERE actor_uid=actor AND request_id=p_request FOR UPDATE;
 IF FOUND THEN
 IF i.listing_id<>p_listing OR i.mime_type<>p_mime OR i.bytes<>p_bytes OR i.sha256<>p_sha256 OR i.category<>p_category THEN RAISE EXCEPTION 'Upload retry does not match original request';END IF;
 IF i.status='committed' THEN
 IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE id=i.photo_id AND removed_at IS NULL) THEN RAISE EXCEPTION 'Photo already removed';END IF;
 RETURN jsonb_build_object('completed',true,'photo_id',i.photo_id);END IF;
 IF i.expires_at>now() THEN
 RETURN jsonb_build_object('completed',false,'path',i.object_path,'uploaded',EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='luvipro-marketplace-media' AND o.name=i.object_path AND (o.metadata->>'size')::bigint=p_bytes AND o.metadata->>'mimetype'=p_mime));END IF;
 END IF;
 SELECT (SELECT count(*) FROM public.luvipro_marketplace_photos WHERE listing_id=p_listing AND removed_at IS NULL)+(SELECT count(*) FROM public.luvipro_marketplace_upload_intents WHERE listing_id=p_listing AND status='reserved' AND expires_at>now()) INTO n;
 IF n>=24 THEN RAISE EXCEPTION 'Maximum 24 active or pending photos';END IF;
 IF (SELECT count(*) FROM public.luvipro_marketplace_upload_intents WHERE actor_uid=actor AND created_at>now()-interval '10 minutes')>=32 OR (SELECT count(*) FROM public.luvipro_marketplace_upload_intents WHERE actor_uid=actor AND created_at>now()-interval '1 hour')>=64 THEN RAISE EXCEPTION 'Upload rate limit';END IF;
 IF i.id IS NOT NULL THEN
 UPDATE public.luvipro_marketplace_upload_intents SET expires_at=now()+interval '10 minutes' WHERE id=i.id RETURNING * INTO i;
 ELSE
 path:=actor::text||'/'||p_listing::text||'/'||gen_random_uuid()::text||CASE p_mime WHEN 'image/jpeg' THEN '.jpg' WHEN 'image/png' THEN '.png' ELSE '.webp' END;
 INSERT INTO public.luvipro_marketplace_upload_intents(request_id,actor_uid,listing_id,object_path,mime_type,bytes,sha256,category) VALUES(p_request,actor,p_listing,path,p_mime,p_bytes,p_sha256,p_category) RETURNING * INTO i;
 END IF;
 RETURN jsonb_build_object('completed',false,'path',i.object_path,'uploaded',EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='luvipro-marketplace-media' AND o.name=i.object_path AND (o.metadata->>'size')::bigint=p_bytes AND o.metadata->>'mimetype'=p_mime));END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_upload_reserve_v1(uuid,uuid,uuid,text,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_upload_reserve_v1(uuid,uuid,uuid,text,integer,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_photo_commit_v1(p_actor uuid,p_listing uuid,p_path text,p_mime text,p_bytes integer,p_category text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1(p_actor);l public.luvipro_marketplace_listings%ROWTYPE;i public.luvipro_marketplace_upload_intents%ROWTYPE;result uuid;n integer;BEGIN
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND seller_uid=actor FOR UPDATE;
 IF NOT FOUND OR l.status IN ('sold','archived') THEN RAISE EXCEPTION 'Editable own listing required' USING ERRCODE='42501';END IF;
 SELECT * INTO i FROM public.luvipro_marketplace_upload_intents WHERE actor_uid=actor AND listing_id=p_listing AND object_path=p_path FOR UPDATE;
 IF NOT FOUND OR i.mime_type<>p_mime OR i.bytes<>p_bytes OR i.category<>p_category THEN RAISE EXCEPTION 'Matching upload reservation required';END IF;
 IF i.status='committed' THEN RETURN i.photo_id;END IF;
 IF i.expires_at<=now() THEN RAISE EXCEPTION 'Upload reservation expired; retry safely with same upload id';END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='luvipro-marketplace-media' AND o.name=p_path AND (o.metadata->>'size')::bigint=p_bytes AND o.metadata->>'mimetype'=p_mime) THEN RAISE EXCEPTION 'Completed matching private Storage upload required';END IF;
 SELECT count(*) INTO n FROM public.luvipro_marketplace_photos WHERE listing_id=p_listing AND removed_at IS NULL;
 IF n>=24 THEN RAISE EXCEPTION 'Maximum 24 photos';END IF;
 INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES(p_listing,p_path,p_category,n,p_mime,p_bytes) RETURNING id INTO result;
 UPDATE public.luvipro_marketplace_upload_intents SET status='committed',photo_id=result WHERE id=i.id;
 UPDATE public.luvipro_marketplace_listings SET status='draft',revision=revision+1,updated_at=now() WHERE id=p_listing;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(p_listing,actor,'photo_uploaded',jsonb_build_object('photo_id',result,'upload_id',i.request_id));RETURN result;END$$;

CREATE FUNCTION public.luvipro_marketplace_case_v1(p_listing uuid,p_reason text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();result uuid;BEGIN
 IF length(btrim(p_reason)) NOT BETWEEN 12 AND 2000 OR public.luvipro_marketplace_card_v1(p_listing) IS NULL THEN RAISE EXCEPTION 'Published listing and meaningful report required';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text,9205));
 IF (SELECT count(*) FROM public.luvipro_marketplace_cases WHERE reporter_uid=actor AND created_at>now()-interval '1 day')>=5 THEN RAISE EXCEPTION 'Report rate limit';END IF;
 IF EXISTS(SELECT 1 FROM public.luvipro_marketplace_cases WHERE reporter_uid=actor AND listing_id=p_listing AND status='open') THEN RAISE EXCEPTION 'Open report already exists';END IF;
 INSERT INTO public.luvipro_marketplace_cases(listing_id,reporter_uid,reason) VALUES(p_listing,actor,btrim(p_reason)) RETURNING id INTO result;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(p_listing,actor,'abuse_reported',jsonb_build_object('case_id',result));RETURN result;END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_case_v1(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_case_v1(uuid,text) TO authenticated;

CREATE FUNCTION public.luvipro_marketplace_admin_v1(p_section text DEFAULT 'listings',p_id uuid DEFAULT NULL,p_search text DEFAULT '',p_status text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();items jsonb;total bigint;BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF p_offset IS NULL OR p_offset NOT BETWEEN 0 AND 100000 OR length(p_search)>120 THEN RAISE EXCEPTION 'Invalid page';END IF;
 IF p_section='listings' THEN
 SELECT count(*) INTO total FROM public.luvipro_marketplace_listings WHERE (p_status='' OR status=p_status) AND (p_id IS NULL OR id=p_id) AND (p_search='' OR search_document @@ websearch_to_tsquery('german',p_search) OR id::text=p_search);
 SELECT coalesce(jsonb_agg(to_jsonb(x)-'search_document'),'[]') INTO items FROM(SELECT * FROM public.luvipro_marketplace_listings WHERE (p_status='' OR status=p_status) AND (p_id IS NULL OR id=p_id) AND (p_search='' OR search_document @@ websearch_to_tsquery('german',p_search) OR id::text=p_search) ORDER BY updated_at DESC,id LIMIT 30 OFFSET p_offset)x;
 ELSIF p_section='audit' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT * FROM public.luvipro_marketplace_audit WHERE p_id IS NULL OR listing_id=p_id ORDER BY created_at DESC,id DESC LIMIT 50 OFFSET p_offset)x;
 ELSIF p_section='cases' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT * FROM public.luvipro_marketplace_cases WHERE (p_id IS NULL OR listing_id=p_id) AND (p_status='' OR status=p_status) ORDER BY created_at DESC,id LIMIT 30 OFFSET p_offset)x;
 ELSIF p_section='mandates' THEN
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT * FROM public.luvipro_marketplace_authorities WHERE p_id IS NULL OR seller_uid=p_id ORDER BY reviewed_at DESC,id LIMIT 30 OFFSET p_offset)x;
 ELSIF p_section='report_lookup' THEN
 IF length(p_search)<>17 THEN RAISE EXCEPTION 'Exact VIN required for Admin review';END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT i.id inspection_id,i.user_id inspector_uid,i.status,i.report_status,i.locked_at,i.brand,i.modell,i.year,i.mileage,i.vin,v.id vehicle_id,v.user_id vehicle_owner_uid FROM public.inspections i LEFT JOIN public.vehicles v ON upper(v.vin)=upper(i.vin) WHERE upper(i.vin)=upper(p_search) ORDER BY i.created_at DESC LIMIT 50)x;
 ELSIF p_section='statistics' THEN
 SELECT jsonb_build_array(jsonb_build_object('statuses',(SELECT coalesce(jsonb_object_agg(status,n),'{}') FROM(SELECT status,count(*) n FROM public.luvipro_marketplace_listings GROUP BY status)x),'open_cases',(SELECT count(*) FROM public.luvipro_marketplace_cases WHERE status='open'),'pending_uploads',(SELECT count(*) FROM public.luvipro_marketplace_upload_intents WHERE status='reserved' AND expires_at>now()))) INTO items;
 ELSE RAISE EXCEPTION 'Unknown Admin section';END IF;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',coalesce(total>p_offset+30,false));END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_admin_v1(text,uuid,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_admin_v1(text,uuid,text,text,integer) TO authenticated;

CREATE FUNCTION public.luvipro_marketplace_case_review_v1(p_case uuid,p_status text,p_decision text,p_thread uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();c public.luvipro_marketplace_cases%ROWTYPE;items jsonb;BEGIN
 IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 IF length(btrim(p_decision)) NOT BETWEEN 12 AND 2000 THEN RAISE EXCEPTION 'Documented purpose and decision required';END IF;
 SELECT * INTO c FROM public.luvipro_marketplace_cases WHERE id=p_case FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Case not found';END IF;
 IF p_status='conversation_index' AND p_thread IS NULL THEN
 IF c.status='closed' THEN RAISE EXCEPTION 'Open case required';END IF;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(c.listing_id,actor,'case_conversation_index_reviewed',jsonb_build_object('case_id',c.id,'purpose',p_decision));
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT id,listing_id,created_at FROM public.luvipro_marketplace_inquiries WHERE listing_id=c.listing_id ORDER BY created_at DESC LIMIT 100)x;
 RETURN jsonb_build_object('items',items);END IF;
 IF p_thread IS NOT NULL THEN
 IF c.status='closed' OR NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_inquiries WHERE id=p_thread AND listing_id=c.listing_id) THEN RAISE EXCEPTION 'Open matching case and specific conversation required';END IF;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(c.listing_id,actor,'case_conversation_reviewed',jsonb_build_object('case_id',c.id,'thread_id',p_thread,'purpose',p_decision));
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT id,sender_uid,body,created_at FROM public.luvipro_marketplace_messages WHERE inquiry_id=p_thread ORDER BY created_at DESC LIMIT 100)x;
 RETURN jsonb_build_object('items',items);END IF;
 IF p_status NOT IN ('reviewed','closed') THEN RAISE EXCEPTION 'Invalid case decision';END IF;
 UPDATE public.luvipro_marketplace_cases SET status=p_status,decision=btrim(p_decision),reviewed_by=actor,reviewed_at=now() WHERE id=c.id;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(c.listing_id,actor,'case_decided',jsonb_build_object('case_id',c.id,'status',p_status,'decision',p_decision));
 RETURN jsonb_build_object('case_id',c.id,'status',p_status);END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_case_review_v1(uuid,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_case_review_v1(uuid,text,text,uuid) TO authenticated;

-- Defense in depth: a trusted service REST write cannot bypass the Admin workflow.
CREATE FUNCTION public.luvipro_marketplace_publication_guard_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE l public.luvipro_marketplace_listings%ROWTYPE;BEGIN
 SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=NEW.id;
 IF NOT FOUND OR l.status<>'published' THEN RETURN NULL;END IF;
 PERFORM public.luvipro_marketplace_actor_v1();
 IF NOT public.is_admin() OR NOT public.luvipro_marketplace_eligible_v1(l.id) OR NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE listing_id=l.id AND removed_at IS NULL) OR NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_audit WHERE listing_id=l.id AND actor_uid=auth.uid() AND action='approve' AND (details->>'revision')::integer=l.revision) THEN RAISE EXCEPTION 'Publication requires valid report, photos and an audited Admin approval for the current revision' USING ERRCODE='42501';END IF;
 RETURN NULL;END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_publication_guard_v1() FROM PUBLIC,anon,authenticated;
CREATE CONSTRAINT TRIGGER luvipro_marketplace_publication_guard AFTER INSERT OR UPDATE ON public.luvipro_marketplace_listings DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.luvipro_marketplace_publication_guard_v1();
CREATE FUNCTION public.luvipro_marketplace_login_detached_v1() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
 IF NEW.seller_uid IS NULL AND OLD.seller_uid IS NOT NULL THEN
 NEW.status:='archived';NEW.revision:=OLD.revision+1;NEW.updated_at:=now();
 INSERT INTO public.luvipro_marketplace_audit(listing_id,action) VALUES(OLD.id,'login_detached_listing_archived');END IF;
 RETURN NEW;END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_login_detached_v1() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER luvipro_marketplace_login_detached BEFORE UPDATE OF seller_uid ON public.luvipro_marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.luvipro_marketplace_login_detached_v1();
CREATE INDEX ON public.luvipro_marketplace_listings(lower(data->>'brand')) WHERE status='published';
CREATE INDEX ON public.luvipro_marketplace_listings(((data->>'price_cents')::bigint)) WHERE status='published';
CREATE INDEX ON public.luvipro_marketplace_listings(((data->>'mileage')::integer)) WHERE status='published';
CREATE INDEX ON public.luvipro_marketplace_listings((data->>'first_registration')) WHERE status='published';

-- GENERATED_GUARDED_CORE_REPLACEMENTS
CREATE OR REPLACE FUNCTION public.luvipro_marketplace_eligible_v1(p_listing uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.luvipro_marketplace_listings l JOIN public.inspections i ON i.id=l.inspection_id
 JOIN public.vehicles v ON v.id=l.vehicle_id JOIN auth.users a ON a.id=l.seller_uid
 WHERE l.id=p_listing AND a.email_confirmed_at IS NOT NULL AND a.deleted_at IS NULL AND coalesce(a.banned_until,'-infinity'::timestamptz)<=now()
 AND i.status='locked' AND i.locked_at IS NOT NULL AND i.report_status='generated' AND i.report_generated_at IS NOT NULL
 AND upper(regexp_replace(v.vin,'\s','','g'))=upper(regexp_replace(i.vin,'\s','','g')) AND length(v.vin)=17
 AND ((v.user_id=l.seller_uid AND i.user_id=l.seller_uid) OR EXISTS(
 SELECT 1 FROM public.luvipro_marketplace_authorities m WHERE m.seller_uid=l.seller_uid AND m.vehicle_id=v.id AND m.inspection_id=i.id AND m.revoked_at IS NULL AND m.expires_at>now())))
$$;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_save_v1(p_id uuid,p_revision integer,p_vehicle uuid,p_report uuid,p_data jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();l public.luvipro_marketplace_listings%ROWTYPE;k text;requested_vin text;BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=actor AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL) THEN RAISE EXCEPTION 'Confirmed account required' USING ERRCODE='42501';END IF;
 IF jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>24000 THEN RAISE EXCEPTION 'Invalid listing';END IF;
 requested_vin:=nullif(upper(regexp_replace(coalesce(p_data->>'vin',''),'\s','','g')),'');
 IF requested_vin IS NOT NULL AND requested_vin!~'^[A-Z0-9]{1,17}$' THEN RAISE EXCEPTION 'Invalid draft VIN';END IF;
 p_data:=p_data-'vin';
 SELECT coalesce(jsonb_object_agg(key,CASE WHEN jsonb_typeof(value)='string' THEN to_jsonb(btrim(value#>>'{}')) ELSE value END),'{}') INTO p_data FROM jsonb_each(p_data) WHERE value<>'null'::jsonb AND NOT (jsonb_typeof(value)='string' AND btrim(value#>>'{}')='');
 FOR k IN SELECT jsonb_object_keys(p_data) LOOP
 IF k<>ALL(ARRAY['brand','model','variant','category','first_registration','year','condition','hsn','tsn','mileage','fuel','transmission','power_kw','displacement','drive','body','doors','seats','exterior_color','interior_color','interior_material','emission','badge','hu_until','origin','battery_kwh','range_km','charging','battery_health','previous_owners','accident_declaration','known_damage','repaired_damage','unrepaired_damage','service_history','service_book','last_maintenance','technical_defects','smoking','replacement_engine','modifications','warranty','equipment','price_cents','negotiable','seller_type','vat_disclosed','postal_code','city','region','contact_method','seller_description','description','commercial_identity','latitude','longitude','seller_rights_declared']) THEN RAISE EXCEPTION 'Unsupported listing field: %',k;END IF;
 END LOOP;
 IF p_vehicle IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=p_vehicle AND (v.user_id=actor OR EXISTS(SELECT 1 FROM public.luvipro_marketplace_authorities a WHERE a.seller_uid=actor AND a.vehicle_id=v.id AND a.inspection_id=p_report AND a.revoked_at IS NULL AND a.expires_at>now()))) THEN RAISE EXCEPTION 'Own vehicle or reviewed mandate required' USING ERRCODE='42501';END IF;
 FOR k IN SELECT unnest(ARRAY['power_kw','displacement','doors','seats','year','previous_owners','battery_kwh','range_km']) LOOP
 IF p_data ? k AND p_data->>k IS NOT NULL AND (p_data->>k !~'^[0-9]{1,7}([.][0-9]{1,2})?$' OR (k=ANY(ARRAY['doors','seats','year','previous_owners','displacement','range_km']) AND p_data->>k !~'^[0-9]{1,7}$')) THEN RAISE EXCEPTION 'Invalid numeric vehicle field: %',k;END IF;END LOOP;
 IF p_data ? 'first_registration' AND coalesce(p_data->>'first_registration','')<>'' AND (p_data->>'first_registration' !~'^(19|20)[0-9]{2}-(0[1-9]|1[0-2])$' OR p_data->>'first_registration'>to_char(now(),'YYYY-MM')) THEN RAISE EXCEPTION 'Invalid first registration';END IF;
 IF (p_data ? 'latitude')<>(p_data ? 'longitude') THEN RAISE EXCEPTION 'Approximate city coordinates must be paired';END IF;
 IF p_data ? 'latitude' THEN
 IF p_data->>'latitude' !~'^-?[0-9]{1,3}([.][0-9]{1,8})?$' OR p_data->>'longitude' !~'^-?[0-9]{1,3}([.][0-9]{1,8})?$' OR (p_data->>'latitude')::numeric NOT BETWEEN -90 AND 90 OR (p_data->>'longitude')::numeric NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'Invalid city location';END IF;
 p_data:=p_data||jsonb_build_object('latitude',round((p_data->>'latitude')::numeric,2),'longitude',round((p_data->>'longitude')::numeric,2));END IF;
 IF p_data ? 'equipment' AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'equipment') e WHERE jsonb_typeof(e)<>'string' OR length(e#>>'{}')>80) THEN RAISE EXCEPTION 'Equipment must contain short labels';END IF;
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
 UPDATE public.luvipro_marketplace_listings SET draft_vin=requested_vin WHERE id=l.id RETURNING * INTO l;
 IF p_report IS NOT NULL THEN UPDATE public.luvipro_marketplace_listings x SET draft_vin=upper(regexp_replace(i.vin,'\s','','g')),data=x.data||jsonb_strip_nulls(jsonb_build_object('brand',nullif(btrim(i.brand),''),'model',nullif(btrim(i.modell),''),'year',i.year)) FROM public.inspections i WHERE x.id=l.id AND i.id=p_report RETURNING x.* INTO l;END IF;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,'draft_saved',jsonb_build_object('revision',l.revision));
 RETURN to_jsonb(l)-'search_document';END$$;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_state_v1(p_id uuid,p_revision integer,p_action text,p_reason text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 UPDATE public.luvipro_marketplace_listings SET status=target,revision=revision+1,updated_at=now(),published_at=CASE WHEN target='published' THEN now() ELSE published_at END WHERE id=l.id RETURNING * INTO l;
 INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,p_action,jsonb_build_object('reason',p_reason,'revision',l.revision));
 RETURN to_jsonb(l)-'search_document';END$$;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_message_v1(p_listing uuid,p_body text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();seller uuid;thread uuid;BEGIN
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

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_inbox_v1(p_thread uuid DEFAULT NULL,p_reply text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();items jsonb;BEGIN
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

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_favorite_v1(p_id uuid,p_enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$BEGIN
 PERFORM public.luvipro_marketplace_actor_v1();
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF p_enabled THEN IF public.luvipro_marketplace_card_v1(p_id) IS NULL THEN RAISE EXCEPTION 'Listing unavailable';END IF;
 INSERT INTO public.luvipro_marketplace_favorites(user_id,listing_id) VALUES(auth.uid(),p_id) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.luvipro_marketplace_favorites WHERE user_id=auth.uid() AND listing_id=p_id;END IF;END$$;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_favorites_v1(p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE items jsonb;BEGIN
 PERFORM public.luvipro_marketplace_actor_v1();
 IF auth.uid() IS NULL OR p_offset NOT BETWEEN 0 AND 100000 THEN RAISE EXCEPTION 'Authenticated page required';END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('listing_id',x.listing_id,'listing',public.luvipro_marketplace_card_v1(x.listing_id))),'[]') INTO items FROM(SELECT listing_id FROM public.luvipro_marketplace_favorites WHERE user_id=auth.uid() ORDER BY created_at DESC LIMIT 24 OFFSET p_offset)x;
 RETURN jsonb_build_object('items',items);END$$;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_photos_v1(p_listing uuid,p_order uuid[] DEFAULT NULL,p_remove uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE l public.luvipro_marketplace_listings%ROWTYPE;items jsonb;BEGIN
 PERFORM public.luvipro_marketplace_actor_v1();
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

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_authority_v1(p_seller uuid,p_vehicle uuid,p_report uuid,p_evidence text,p_expires timestamptz,p_revoke uuid DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$DECLARE result uuid;BEGIN
 PERFORM public.luvipro_marketplace_actor_v1();
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

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_read_v1(p_mode text DEFAULT 'search',p_id uuid DEFAULT NULL,p_filters jsonb DEFAULT '{}',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 WITH matches AS(SELECT l.id,l.created_at,(l.data->>'price_cents')::bigint price,(l.data->>'mileage')::integer mileage,l.data->>'first_registration' registration,geo.distance_km
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
 page AS(SELECT * FROM matches ORDER BY CASE WHEN p_filters->>'sort'='distance' THEN distance_km END ASC NULLS LAST,CASE WHEN p_filters->>'sort'='price_asc' THEN price END ASC,CASE WHEN p_filters->>'sort'='price_desc' THEN price END DESC,CASE WHEN p_filters->>'sort'='mileage_asc' THEN mileage END ASC,CASE WHEN p_filters->>'sort'='registration_desc' THEN registration END DESC NULLS LAST,created_at DESC,id LIMIT 24 OFFSET p_offset)
 SELECT (SELECT count(*) FROM matches),coalesce((SELECT jsonb_agg(public.luvipro_marketplace_card_v1(id)||jsonb_build_object('distance_km',round(distance_km::numeric,1))) FROM page),'[]') INTO total,items;
 RETURN jsonb_build_object('items',items,'total',total,'has_more',total>p_offset+24);END$$;

CREATE OR REPLACE FUNCTION public.luvipro_marketplace_photo_access_v1(p_photo uuid,p_actor uuid DEFAULT NULL) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p.object_path FROM public.luvipro_marketplace_photos p JOIN public.luvipro_marketplace_listings l ON l.id=p.listing_id
 WHERE p.id=p_photo AND p.removed_at IS NULL AND ((l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)) OR (EXISTS(SELECT 1 FROM auth.users a WHERE a.id=p_actor AND a.email_confirmed_at IS NOT NULL AND a.deleted_at IS NULL AND coalesce(a.banned_until,'-infinity'::timestamptz)<=now()) AND (l.seller_uid=p_actor OR EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND lower(role)='admin'))))
$$;

ALTER TABLE public.luvipro_marketplace_authorities ALTER COLUMN seller_uid DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_authorities_seller_uid_fkey, ADD CONSTRAINT luvipro_marketplace_authorities_seller_uid_fkey FOREIGN KEY (seller_uid) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_authorities ALTER COLUMN reviewed_by DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_authorities_reviewed_by_fkey, ADD CONSTRAINT luvipro_marketplace_authorities_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_inquiries ALTER COLUMN buyer_uid DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_inquiries_buyer_uid_fkey, ADD CONSTRAINT luvipro_marketplace_inquiries_buyer_uid_fkey FOREIGN KEY (buyer_uid) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_inquiries ALTER COLUMN seller_uid DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_inquiries_seller_uid_fkey, ADD CONSTRAINT luvipro_marketplace_inquiries_seller_uid_fkey FOREIGN KEY (seller_uid) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_messages ALTER COLUMN sender_uid DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_messages_sender_uid_fkey, ADD CONSTRAINT luvipro_marketplace_messages_sender_uid_fkey FOREIGN KEY (sender_uid) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_upload_intents ALTER COLUMN actor_uid DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_upload_intents_actor_uid_fkey, ADD CONSTRAINT luvipro_marketplace_upload_intents_actor_uid_fkey FOREIGN KEY (actor_uid) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_cases ALTER COLUMN reporter_uid DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_cases_reporter_uid_fkey, ADD CONSTRAINT luvipro_marketplace_cases_reporter_uid_fkey FOREIGN KEY (reporter_uid) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.luvipro_marketplace_cases ALTER COLUMN reviewed_by DROP NOT NULL, DROP CONSTRAINT luvipro_marketplace_cases_reviewed_by_fkey, ADD CONSTRAINT luvipro_marketplace_cases_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
COMMIT;
