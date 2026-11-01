-- Additive settings and deterministic assistance. No provider call, charge, entitlement grant or report rewrite.
BEGIN;
CREATE TABLE public.luvipro_marketplace_settings(
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 report_price_cents integer NOT NULL DEFAULT 2999 CHECK(report_price_cents BETWEEN 1 AND 1000000),
 purchases_enabled boolean NOT NULL DEFAULT false,
 ai_provider_enabled boolean NOT NULL DEFAULT false,
 assist_daily integer NOT NULL DEFAULT 30 CHECK(assist_daily BETWEEN 1 AND 1000),
 assist_monthly integer NOT NULL DEFAULT 300 CHECK(assist_monthly BETWEEN 1 AND 10000),
 boost_products jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(boost_products)='array' AND jsonb_array_length(boost_products)<=12),
 revision integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid
);
CREATE TABLE public.luvipro_marketplace_assist_usage(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,actor_uid uuid NOT NULL,
 action text NOT NULL CHECK(action IN('search','description')),
 input_length integer NOT NULL CHECK(input_length BETWEEN 0 AND 1000),
 result_mode text NOT NULL DEFAULT 'deterministic' CHECK(result_mode='deterministic'),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.luvipro_marketplace_assist_usage(actor_uid,created_at DESC);
ALTER TABLE public.luvipro_marketplace_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luvipro_marketplace_assist_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_settings,public.luvipro_marketplace_assist_usage FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO public.luvipro_marketplace_settings(boost_products) VALUES(
 '[{"id":"boost","name":"Boost","price_cents":1349,"days":7,"placement":"highlight","priority":1,"slots":4,"enabled":false,"comparison_status":"unverified"},
 {"id":"turbo","name":"Turbo Boost","price_cents":2699,"days":14,"placement":"scheduled","priority":2,"slots":4,"enabled":false,"comparison_status":"unverified"},
 {"id":"premium","name":"Premium Boost","price_cents":3599,"days":28,"placement":"sponsored","priority":3,"slots":4,"enabled":false,"comparison_status":"unverified"}]'::jsonb);

CREATE FUNCTION public.luvipro_marketplace_config_v1(p_payload jsonb DEFAULT NULL,p_revision integer DEFAULT NULL,p_reason text DEFAULT '') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();c public.luvipro_marketplace_settings%ROWTYPE;k text;product jsonb;seen text[]:=ARRAY[]::text[];
BEGIN
 IF actor IS NULL OR NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501';END IF;
 SELECT * INTO STRICT c FROM public.luvipro_marketplace_settings WHERE singleton FOR UPDATE;
 IF p_payload IS NULL THEN RETURN to_jsonb(c)-'updated_by';END IF;
 IF jsonb_typeof(p_payload)<>'object' OR octet_length(p_payload::text)>10000 OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 12 AND 1000 THEN RAISE EXCEPTION 'Documented bounded configuration required';END IF;
 IF p_revision IS DISTINCT FROM c.revision THEN RAISE EXCEPTION 'Revision conflict';END IF;
 FOR k IN SELECT jsonb_object_keys(p_payload) LOOP
  IF k<>ALL(ARRAY['report_price_cents','assist_daily','assist_monthly','boost_products']) THEN RAISE EXCEPTION 'Unsupported setting; payment/provider activation requires separate authorization';END IF;
 END LOOP;
 IF p_payload ? 'boost_products' THEN
  IF jsonb_typeof(p_payload->'boost_products')<>'array' OR jsonb_array_length(p_payload->'boost_products')>12 THEN RAISE EXCEPTION 'Invalid products';END IF;
  FOR product IN SELECT value FROM jsonb_array_elements(p_payload->'boost_products') LOOP
   FOR k IN SELECT jsonb_object_keys(product) LOOP
    IF k<>ALL(ARRAY['id','name','price_cents','days','placement','priority','slots','enabled','comparison_status','benchmark_reference','benchmark_cents']) THEN RAISE EXCEPTION 'Unsupported product field';END IF;
   END LOOP;
   IF jsonb_typeof(product)<>'object' OR coalesce(product->>'id','')!~'^[a-z][a-z0-9_-]{0,39}$' OR product->>'id'=ANY(seen)
    OR length(coalesce(product->>'name','')) NOT BETWEEN 1 AND 80
    OR coalesce((product->>'price_cents')::integer,0) NOT BETWEEN 1 AND 500000
    OR coalesce((product->>'days')::integer,0) NOT BETWEEN 1 AND 90
    OR coalesce(product->>'placement','') NOT IN('highlight','scheduled','sponsored')
    OR coalesce((product->>'priority')::integer,-1) NOT BETWEEN 0 AND 10
    OR coalesce((product->>'slots')::integer,0) NOT BETWEEN 1 AND 100
    OR coalesce(jsonb_typeof(product->'enabled'),'')<>'boolean'
    OR coalesce(product->>'comparison_status','') NOT IN('unverified','verified') THEN RAISE EXCEPTION 'Invalid product';END IF;
   IF product->>'comparison_status'='verified' AND (length(coalesce(product->>'benchmark_reference','')) NOT BETWEEN 20 AND 1000 OR coalesce((product->>'benchmark_cents')::integer,0)<=0) THEN RAISE EXCEPTION 'Comparable benchmark evidence required';END IF;
   seen:=array_append(seen,product->>'id');
  END LOOP;
 END IF;
 UPDATE public.luvipro_marketplace_settings SET report_price_cents=coalesce((p_payload->>'report_price_cents')::integer,c.report_price_cents),assist_daily=coalesce((p_payload->>'assist_daily')::integer,c.assist_daily),assist_monthly=coalesce((p_payload->>'assist_monthly')::integer,c.assist_monthly),boost_products=coalesce(p_payload->'boost_products',c.boost_products),revision=revision+1,updated_at=now(),updated_by=actor WHERE singleton RETURNING * INTO c;
 INSERT INTO public.luvipro_marketplace_audit(actor_uid,action,details) VALUES(actor,'configuration_updated',jsonb_build_object('reason',p_reason,'revision',c.revision,'fields',(SELECT jsonb_agg(key) FROM jsonb_object_keys(p_payload) key)));
 RETURN to_jsonb(c)-'updated_by';
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_config_v1(jsonb,integer,text) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_config_v1(jsonb,integer,text) TO authenticated;

CREATE FUNCTION public.luvipro_marketplace_report_offer_v1(p_listing uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE report uuid;c public.luvipro_marketplace_settings%ROWTYPE;
BEGIN
 SELECT inspection_id INTO report FROM public.luvipro_marketplace_listings WHERE id=p_listing AND status='published' AND public.luvipro_marketplace_eligible_v1(id);
 IF report IS NULL THEN RETURN NULL;END IF;
 SELECT * INTO STRICT c FROM public.luvipro_marketplace_settings WHERE singleton;
 RETURN jsonb_build_object('listing_id',p_listing,'inspection_id',report,'price_cents',c.report_price_cents,'currency','EUR','purchases_enabled',c.purchases_enabled,'has_access',luvipro_security.phase2_can_read(report),'disclosure','LUVIPRO Prüfbericht vorhanden. Inhalte bleiben geschützt.');
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_report_offer_v1(uuid) FROM PUBLIC,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_report_offer_v1(uuid) TO anon,authenticated;

CREATE FUNCTION public.luvipro_marketplace_assist_v1(p_action text,p_input text DEFAULT '',p_listing uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();c public.luvipro_marketplace_settings%ROWTYPE;l public.luvipro_marketplace_listings%ROWTYPE;
 filters jsonb:='{}';source jsonb:='{}';t text:=lower(coalesce(p_input,''));r text[];b text;equipment jsonb:='[]';title text;description text;
BEGIN
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;
 IF p_action NOT IN('search','description') OR p_action IS NULL OR length(coalesce(p_input,''))>1000 OR octet_length(coalesce(p_input,''))>4000 THEN RAISE EXCEPTION 'Invalid bounded request';END IF;
 IF p_action='search' AND length(btrim(t))<3 THEN RAISE EXCEPTION 'Search text required';END IF;
 IF p_action='description' THEN
  SELECT * INTO l FROM public.luvipro_marketplace_listings WHERE id=p_listing AND seller_uid=actor AND status IN('draft','paused','rejected');
  IF NOT FOUND THEN RAISE EXCEPTION 'Editable own listing required' USING ERRCODE='42501';END IF;
  -- Only seller-owned advertising attributes. Never query inspection findings, media or report content.
  SELECT coalesce(jsonb_object_agg(key,value),'{}') INTO source FROM jsonb_each(l.data) WHERE key=ANY(ARRAY['brand','model','variant','year','first_registration','mileage','fuel','transmission','power_kw','equipment','condition','known_damage','service_history']);
 END IF;
 SELECT * INTO STRICT c FROM public.luvipro_marketplace_settings WHERE singleton;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text||':marketplace-assist',0));
 IF (SELECT count(*) FROM public.luvipro_marketplace_assist_usage WHERE actor_uid=actor AND created_at>now()-interval '1 minute')>=5
 OR (SELECT count(*) FROM public.luvipro_marketplace_assist_usage WHERE actor_uid=actor AND created_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')>=c.assist_daily
 OR (SELECT count(*) FROM public.luvipro_marketplace_assist_usage WHERE actor_uid=actor AND created_at>=date_trunc('month',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')>=c.assist_monthly THEN RAISE EXCEPTION 'Usage limit reached' USING ERRCODE='54000';END IF;
 INSERT INTO public.luvipro_marketplace_assist_usage(actor_uid,action,input_length) VALUES(actor,p_action,length(coalesce(p_input,'')));
 IF p_action='description' THEN
  title:=coalesce(nullif(btrim(concat_ws(' ',source->>'brand',source->>'model',source->>'variant')),''),'Fahrzeuginserat');
  description:=title||E'\nVerkäuferangaben – bitte vor Veröffentlichung prüfen.';
  IF nullif(source->>'first_registration','') IS NOT NULL THEN description:=description||E'\nErstzulassung: '||(source->>'first_registration');END IF;
  IF nullif(source->>'mileage','') IS NOT NULL THEN description:=description||E'\nKilometerstand laut Anbieter: '||(source->>'mileage')||' km';END IF;
  IF jsonb_typeof(source->'equipment')='array' AND jsonb_array_length(source->'equipment')>0 THEN description:=description||E'\nAusstattung laut Anbieter: '||(SELECT string_agg(value,', ') FROM jsonb_array_elements_text(source->'equipment'));END IF;
  IF nullif(source->>'known_damage','') IS NOT NULL THEN description:=description||E'\nBekannte Schäden laut Anbieter: '||left(source->>'known_damage',1000);END IF;
  RETURN jsonb_build_object('mode','deterministic','provider_active',false,'requires_review',true,'title',title,'description',description,'source',source,'notice','Regelbasierter Textvorschlag; keine KI-Abfrage und keine Prüfung von Fahrzeugzustand oder Ausstattung.');
 END IF;
 FOREACH b IN ARRAY ARRAY['BMW','Audi','Volkswagen','Mercedes-Benz','Opel','Ford','Toyota','Skoda','Seat','Volvo','Porsche','Renault','Peugeot','Hyundai','Kia','Tesla'] LOOP
  IF position(lower(b) in t)>0 THEN filters:=filters||jsonb_build_object('brand',b);EXIT;END IF;
 END LOOP;
 IF t~'\m(vw)\M' THEN filters:=filters||jsonb_build_object('brand','Volkswagen');END IF;
 IF t~'\m(diesel)\M' AND t!~'(kein|ohne|nicht).{0,12}diesel' THEN filters:=filters||'{"fuel":"Diesel"}';
 ELSIF t~'\m(benzin)\M' THEN filters:=filters||'{"fuel":"Benzin"}';
 ELSIF t~'\m(elektro|elektrisch)\M' THEN filters:=filters||'{"fuel":"Elektro"}';
 ELSIF t~'\m(hybrid)\M' THEN filters:=filters||'{"fuel":"Hybrid"}';END IF;
 IF t~'automatik' AND t!~'(kein|ohne|nicht).{0,12}automatik' THEN filters:=filters||'{"transmission":"Automatik"}';ELSIF t~'schaltgetriebe' THEN filters:=filters||'{"transmission":"Schaltgetriebe"}';END IF;
 r:=regexp_match(t,'(?:unter|max(?:imal)?|bis(?: zu)?)\s+([0-9][0-9. ]*)\s*(?:€|euro|eur)');
 IF r IS NOT NULL THEN filters:=filters||jsonb_build_object('max_price',least(100000000000,regexp_replace(r[1],'[. ]','','g')::bigint*100));END IF;
 r:=regexp_match(t,'(?:weniger als|laufleistung(?: bis)?|kilometerstand(?: bis)?|unter)\s+([0-9][0-9. ]*)\s*(?:km|kilometer)');
 IF r IS NOT NULL THEN filters:=filters||jsonb_build_object('max_mileage',least(10000000,regexp_replace(r[1],'[. ]','','g')::bigint));END IF;
 r:=regexp_match(t,'(?:ab|seit)\s+((?:19|20)[0-9]{2})');IF r IS NOT NULL THEN filters:=filters||jsonb_build_object('first_from',r[1]||'-01');END IF;
 r:=regexp_match(coalesce(p_input,''),'\m(?:in der nähe von|in|bei|nähe von)\s+([[:alpha:]ÄÖÜäöüß-]{2,60})','i');IF r IS NOT NULL THEN filters:=filters||jsonb_build_object('city',r[1]);END IF;
 FOREACH b IN ARRAY ARRAY['Navigation','Sitzheizung','Anhängerkupplung','Klimaanlage','Rückfahrkamera','Panoramadach','Apple CarPlay','Android Auto','Bluetooth'] LOOP
  IF position(lower(b) in t)>0 THEN equipment:=equipment||jsonb_build_array(b);END IF;
 END LOOP;
 IF jsonb_array_length(equipment)>0 THEN filters:=filters||jsonb_build_object('equipment',equipment);END IF;
 RETURN jsonb_build_object('mode','deterministic','provider_active',false,'requires_review',true,'filters',filters,'notice','Regelbasierte Filterhilfe; keine KI-Abfrage. Filter prüfen und fehlende Angaben manuell ergänzen. Allgemeine Eigenschaften wie sparsam oder Familienauto werden nicht erfunden.');
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_assist_v1(text,text,uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_assist_v1(text,text,uuid) TO authenticated;
COMMIT;
