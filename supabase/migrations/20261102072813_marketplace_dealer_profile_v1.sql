BEGIN;
CREATE TABLE public.luvipro_marketplace_dealer_profiles(
 location_id uuid PRIMARY KEY REFERENCES public.partner_locations(id),owner_uid uuid NOT NULL,
 business_description text NOT NULL DEFAULT '' CHECK(length(business_description)<=1000),website_url text,logo_url text,
 public_consent boolean NOT NULL DEFAULT false,status text NOT NULL DEFAULT 'draft' CHECK(status IN('draft','pending','approved','suspended')),
 revision integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now(),reviewed_by uuid,reviewed_at timestamptz,review_note text
);
ALTER TABLE public.luvipro_marketplace_dealer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_dealer_profiles FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.luvipro_marketplace_dealer_url_v1(p_url text,p_logo boolean DEFAULT false) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT p_url IS NULL OR (length(p_url)<=500 AND p_url~*'^https://[a-z0-9-]+(\.[a-z0-9-]+)+(/[a-z0-9._~!$&()*+,;=:%/@-]*)?$'
 AND p_url!~*'^https://[0-9.]+(/|$)' AND p_url!~*'^https://[^/]+\.(local|internal|localhost|supabase\.co)(/|$)'
 AND (NOT p_logo OR p_url~*'\.(png|jpe?g|webp)$'))
$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_dealer_url_v1(text,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.luvipro_marketplace_dealer_profile_v1(p_action text,p_location uuid DEFAULT NULL,p_data jsonb DEFAULT NULL,p_revision integer DEFAULT NULL,p_note text DEFAULT '',p_confirm boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();r public.luvipro_marketplace_dealer_profiles%ROWTYPE;place public.partner_locations%ROWTYPE;items jsonb;k text;bio text;site text;logo text;
BEGIN
 IF p_action='mine' THEN
 SELECT coalesce(jsonb_agg(jsonb_build_object('location_id',loc.id,'company_name',loc.company_name,'business_description',coalesce(p.business_description,''),'website_url',p.website_url,'logo_url',p.logo_url,'public_consent',coalesce(p.public_consent,false),'status',coalesce(p.status,'draft'),'revision',coalesce(p.revision,0))),'[]') INTO items
 FROM public.partner_locations loc LEFT JOIN public.luvipro_marketplace_dealer_profiles p ON p.location_id=loc.id AND p.owner_uid=actor
 WHERE loc.partner_user_id=actor AND public.luvipro_marketplace_dealer_v1(loc.id) IS NOT NULL;
 RETURN jsonb_build_object('items',items);
 END IF;
 IF p_action='admin_list' THEN
 IF NOT public.is_admin() OR length(btrim(coalesce(p_note,''))) NOT BETWEEN 12 AND 1000 THEN RAISE EXCEPTION 'Documented Admin review required' USING ERRCODE='42501';END IF;
 INSERT INTO public.luvipro_marketplace_audit(actor_uid,action,details) VALUES(actor,'dealer_profile_review_access',jsonb_build_object('reason',p_note));
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT p.*,loc.company_name FROM public.luvipro_marketplace_dealer_profiles p JOIN public.partner_locations loc ON loc.id=p.location_id WHERE p.status IN('pending','approved','suspended') ORDER BY p.updated_at,p.location_id LIMIT 100)x;
 RETURN jsonb_build_object('items',items);
 END IF;
 SELECT * INTO place FROM public.partner_locations WHERE id=p_location FOR UPDATE;
 IF NOT FOUND OR public.luvipro_marketplace_dealer_v1(place.id) IS NULL THEN RAISE EXCEPTION 'Current approved public Partner location required' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM public.luvipro_marketplace_dealer_profiles WHERE location_id=place.id FOR UPDATE;
 IF coalesce(r.revision,0) IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'Revision conflict';END IF;
 IF p_action IN('save','submit') THEN
 IF place.partner_user_id IS DISTINCT FROM actor THEN RAISE EXCEPTION 'Own business location required' USING ERRCODE='42501';END IF;
 IF p_data IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>6000 THEN RAISE EXCEPTION 'Bounded public fields required';END IF;
 FOR k IN SELECT jsonb_object_keys(p_data) LOOP IF k<>ALL(ARRAY['business_description','website_url','logo_url','public_consent']) THEN RAISE EXCEPTION 'Unsupported public field';END IF;END LOOP;
 bio:=btrim(coalesce(p_data->>'business_description',''));site:=nullif(btrim(p_data->>'website_url'),'');logo:=nullif(btrim(p_data->>'logo_url'),'');
 IF length(bio)>1000 OR NOT public.luvipro_marketplace_dealer_url_v1(site) OR NOT public.luvipro_marketplace_dealer_url_v1(logo,true) OR jsonb_typeof(p_data->'public_consent') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Public description, HTTPS website and public raster-logo URL required; signed/private URLs forbidden';END IF;
 IF p_action='submit' AND (NOT(p_data->>'public_consent')::boolean OR (bio='' AND site IS NULL AND logo IS NULL)) THEN RAISE EXCEPTION 'Explicit publication consent and content required';END IF;
 INSERT INTO public.luvipro_marketplace_dealer_profiles(location_id,owner_uid,business_description,website_url,logo_url,public_consent,status)
 VALUES(place.id,actor,bio,site,logo,(p_data->>'public_consent')::boolean,CASE WHEN p_action='submit' THEN 'pending' ELSE 'draft' END)
 ON CONFLICT(location_id) DO UPDATE SET owner_uid=excluded.owner_uid,business_description=excluded.business_description,website_url=excluded.website_url,logo_url=excluded.logo_url,public_consent=excluded.public_consent,status=excluded.status,revision=public.luvipro_marketplace_dealer_profiles.revision+1,updated_at=now(),reviewed_by=NULL,reviewed_at=NULL,review_note=NULL RETURNING * INTO r;
 ELSIF p_action IN('approve','suspend') THEN
 IF NOT public.is_admin() OR p_confirm IS DISTINCT FROM true OR length(btrim(coalesce(p_note,''))) NOT BETWEEN 12 AND 1000 OR r.location_id IS NULL THEN RAISE EXCEPTION 'Explicit documented Admin confirmation required' USING ERRCODE='42501';END IF;
 IF p_action='approve' AND (r.status<>'pending' OR NOT r.public_consent OR r.owner_uid<>place.partner_user_id) THEN RAISE EXCEPTION 'Current submitted consent required';END IF;
 UPDATE public.luvipro_marketplace_dealer_profiles SET status=CASE WHEN p_action='approve' THEN 'approved' ELSE 'suspended' END,revision=revision+1,updated_at=now(),reviewed_by=actor,reviewed_at=now(),review_note=p_note WHERE location_id=place.id RETURNING * INTO r;
 ELSE RAISE EXCEPTION 'Unknown profile action';END IF;
 INSERT INTO public.luvipro_marketplace_audit(actor_uid,action,details) VALUES(actor,'dealer_profile_'||p_action,jsonb_build_object('location_id',place.id,'revision',r.revision,'reason',CASE WHEN public.is_admin() THEN p_note ELSE NULL END));
 RETURN to_jsonb(r)-'owner_uid'-'reviewed_by'-'review_note';
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_dealer_profile_v1(text,uuid,jsonb,integer,text,boolean) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_dealer_profile_v1(text,uuid,jsonb,integer,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.luvipro_marketplace_dealer_v1(p_dealer uuid DEFAULT NULL,p_listing uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('id',loc.id,'company_name',loc.company_name,'city',loc.city,'postal_code',loc.postal_code,'street',loc.street,'house_number',loc.house_number,'country',loc.country,
 'business_description',p.business_description,'website_url',p.website_url,'logo_url',p.logo_url)
 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id
 LEFT JOIN public.luvipro_marketplace_dealer_profiles p ON p.location_id=loc.id AND p.owner_uid=loc.partner_user_id AND p.status='approved' AND p.public_consent
 WHERE loc.is_active AND v.status='approved' AND v.show_on_map AND public.luvipro_marketplace_partner_available_v1(loc.partner_user_id)
 AND (p_dealer IS NOT NULL AND loc.id=p_dealer OR p_listing IS NOT NULL AND EXISTS(SELECT 1 FROM public.luvipro_marketplace_listings l WHERE l.id=p_listing AND l.seller_uid=loc.partner_user_id AND l.data->>'seller_type'='commercial' AND l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id))) ORDER BY loc.id LIMIT 1
$$;
COMMIT;
