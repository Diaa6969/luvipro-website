"""Build reviewed replacements from the immutable core, keeping original signatures/ACLs."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
core=(root/'supabase/migrations/20261030205002_marketplace_core_v1.sql').read_text(encoding='utf-8')
path=root/'supabase/migrations/20261031192504_marketplace_upload_and_admin_operations_v1.sql'
current=path.read_text(encoding='utf-8')
marker='-- GENERATED_GUARDED_CORE_REPLACEMENTS'
base=current.split(marker)[0].rstrip()
if base.endswith('COMMIT;'):base=base[:-7].rstrip()
parts=[]
def function(name):
 start=core.index('CREATE FUNCTION public.'+name+'(')
 end=core.index('$$;',start)+3
 return core[start:end].replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION',1)
def change(s,a,b):
 assert a in s,a
 return s.replace(a,b,1)
eligible=function('luvipro_marketplace_eligible_v1')
eligible=change(eligible,'AND a.deleted_at IS NULL',"AND a.deleted_at IS NULL AND coalesce(a.banned_until,'-infinity'::timestamptz)<=now()")
parts.append(eligible)
for name in ['luvipro_marketplace_save_v1','luvipro_marketplace_state_v1','luvipro_marketplace_message_v1','luvipro_marketplace_inbox_v1']:
 s=function(name)
 s=change(s,'actor uuid:=auth.uid()','actor uuid:=public.luvipro_marketplace_actor_v1()')
 if name=='luvipro_marketplace_save_v1':
  s=change(s,';k text;BEGIN',';k text;requested_vin text;BEGIN')
  s=change(s," FOR k IN SELECT jsonb_object_keys(p_data) LOOP", " requested_vin:=nullif(upper(regexp_replace(coalesce(p_data->>'vin',''),'\\s','','g')),'');\n IF requested_vin IS NOT NULL AND requested_vin!~'^[A-Z0-9]{1,17}$' THEN RAISE EXCEPTION 'Invalid draft VIN';END IF;\n p_data:=p_data-'vin';\n FOR k IN SELECT jsonb_object_keys(p_data) LOOP")
  anchor=" IF length(coalesce(p_data->>'description',''))>6000"
  validation=""" IF p_vehicle IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.vehicles v WHERE v.id=p_vehicle AND (v.user_id=actor OR EXISTS(SELECT 1 FROM public.luvipro_marketplace_authorities a WHERE a.seller_uid=actor AND a.vehicle_id=v.id AND a.inspection_id=p_report AND a.revoked_at IS NULL AND a.expires_at>now()))) THEN RAISE EXCEPTION 'Own vehicle or reviewed mandate required' USING ERRCODE='42501';END IF;
 FOR k IN SELECT unnest(ARRAY['power_kw','displacement','doors','seats','year','previous_owners','battery_kwh','range_km']) LOOP
 IF p_data ? k AND p_data->>k IS NOT NULL AND (p_data->>k !~'^[0-9]{1,7}([.][0-9]{1,2})?$' OR (k=ANY(ARRAY['doors','seats','year','previous_owners','displacement','range_km']) AND p_data->>k !~'^[0-9]{1,7}$')) THEN RAISE EXCEPTION 'Invalid numeric vehicle field: %',k;END IF;END LOOP;
 IF p_data ? 'first_registration' AND coalesce(p_data->>'first_registration','')<>'' AND (p_data->>'first_registration' !~'^(19|20)[0-9]{2}-(0[1-9]|1[0-2])$' OR p_data->>'first_registration'>to_char(now(),'YYYY-MM')) THEN RAISE EXCEPTION 'Invalid first registration';END IF;
 IF (p_data ? 'latitude')<>(p_data ? 'longitude') THEN RAISE EXCEPTION 'Approximate city coordinates must be paired';END IF;
 IF p_data ? 'latitude' THEN
 IF p_data->>'latitude' !~'^-?[0-9]{1,3}([.][0-9]{1,8})?$' OR p_data->>'longitude' !~'^-?[0-9]{1,3}([.][0-9]{1,8})?$' OR (p_data->>'latitude')::numeric NOT BETWEEN -90 AND 90 OR (p_data->>'longitude')::numeric NOT BETWEEN -180 AND 180 THEN RAISE EXCEPTION 'Invalid city location';END IF;
 p_data:=p_data||jsonb_build_object('latitude',round((p_data->>'latitude')::numeric,2),'longitude',round((p_data->>'longitude')::numeric,2));END IF;
 IF p_data ? 'equipment' AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_data->'equipment') e WHERE jsonb_typeof(e)<>'string' OR length(e#>>'{}')>80) THEN RAISE EXCEPTION 'Equipment must contain short labels';END IF;
"""
  s=change(s," FOR k IN SELECT jsonb_object_keys(p_data) LOOP", " SELECT coalesce(jsonb_object_agg(key,CASE WHEN jsonb_typeof(value)='string' THEN to_jsonb(btrim(value#>>'{}')) ELSE value END),'{}') INTO p_data FROM jsonb_each(p_data) WHERE value<>'null'::jsonb AND NOT (jsonb_typeof(value)='string' AND btrim(value#>>'{}')='');\n FOR k IN SELECT jsonb_object_keys(p_data) LOOP")
  s=change(s,anchor,validation+anchor)
  s=change(s," INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,'draft_saved'", " UPDATE public.luvipro_marketplace_listings SET draft_vin=requested_vin WHERE id=l.id RETURNING * INTO l;\n IF p_report IS NOT NULL THEN UPDATE public.luvipro_marketplace_listings x SET draft_vin=upper(regexp_replace(i.vin,'\\s','','g')),data=x.data||jsonb_strip_nulls(jsonb_build_object('brand',nullif(btrim(i.brand),''),'model',nullif(btrim(i.modell),''),'year',i.year)) FROM public.inspections i WHERE x.id=l.id AND i.id=p_report RETURNING x.* INTO l;END IF;\n INSERT INTO public.luvipro_marketplace_audit(listing_id,actor_uid,action,details) VALUES(l.id,actor,'draft_saved'")
 if name=='luvipro_marketplace_state_v1':
  s=change(s," IF p_revision IS DISTINCT FROM l.revision THEN", " IF l.seller_uid IS DISTINCT FROM actor AND length(btrim(coalesce(p_reason,''))) NOT BETWEEN 8 AND 1000 THEN RAISE EXCEPTION 'Documented Admin moderation reason required';END IF;\n IF p_revision IS DISTINCT FROM l.revision THEN")
  s=change(s," IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE listing_id=l.id", " IF coalesce(l.data->>'first_registration','')='' OR coalesce(l.data->>'fuel','')='' OR coalesce(l.data->>'transmission','')='' OR coalesce(l.data->>'mileage','')='' THEN RAISE EXCEPTION 'First registration, mileage, fuel and transmission required';END IF;\n IF EXISTS(SELECT 1 FROM public.inspections WHERE id=l.inspection_id AND mileage>(l.data->>'mileage')::integer) THEN RAISE EXCEPTION 'Listing mileage cannot be below linked inspection';END IF;\n IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_photos WHERE listing_id=l.id")
 parts.append(s)
for name in ['luvipro_marketplace_favorite_v1','luvipro_marketplace_favorites_v1','luvipro_marketplace_photos_v1','luvipro_marketplace_authority_v1']:
 s=function(name)
 s=change(s,'AS $$BEGIN','AS $$BEGIN\n PERFORM public.luvipro_marketplace_actor_v1();') if 'AS $$BEGIN' in s else change(s,';BEGIN',';BEGIN\n PERFORM public.luvipro_marketplace_actor_v1();')
 parts.append(s)
read=function('luvipro_marketplace_read_v1')
read=change(read," IF p_mode IN ('mine','review','eligible') AND actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501';END IF;", " IF p_mode IN ('mine','review','eligible','vehicles') THEN PERFORM public.luvipro_marketplace_actor_v1();END IF;\n IF p_mode='vehicles' THEN SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(SELECT id,vin,brand,model,year,mileage FROM public.vehicles WHERE user_id=actor ORDER BY id LIMIT 50 OFFSET p_offset)x;RETURN jsonb_build_object('items',items);END IF;")
read=change(read,'SELECT v.id vehicle_id,i.id inspection_id,v.brand','SELECT v.id vehicle_id,i.id inspection_id,i.vin,v.brand')
read=change(read,"jsonb_agg(to_jsonb(x)-'search_document')", "jsonb_agg((to_jsonb(x)-'search_document')||jsonb_build_object('photos',coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'category',p.category,'position',p.position) ORDER BY p.position,p.created_at) FROM public.luvipro_marketplace_photos p WHERE p.listing_id=x.id AND p.removed_at IS NULL),'[]'::jsonb)))")
start=read.index(' WITH matches AS(')
end=read.index(" RETURN jsonb_build_object('items',items,'total',total",start)
read=read[:start]+""" IF p_filters ? 'radius_km' AND (NOT p_filters ? 'latitude' OR NOT p_filters ? 'longitude' OR (p_filters->>'radius_km')::numeric NOT BETWEEN 1 AND 500 OR (p_filters->>'latitude')::numeric NOT BETWEEN -90 AND 90 OR (p_filters->>'longitude')::numeric NOT BETWEEN -180 AND 180) THEN RAISE EXCEPTION 'Valid temporary search center and radius 1-500 km required';END IF;
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
"""+read[end:]
parts.append(read)
photo=function('luvipro_marketplace_photo_access_v1')
photo=change(photo,"OR l.seller_uid=p_actor OR EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND lower(role)='admin')", "OR (EXISTS(SELECT 1 FROM auth.users a WHERE a.id=p_actor AND a.email_confirmed_at IS NOT NULL AND a.deleted_at IS NULL AND coalesce(a.banned_until,'-infinity'::timestamptz)<=now()) AND (l.seller_uid=p_actor OR EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND lower(role)='admin')))")
parts.append(photo)
# Nullable Auth references preserve history and do not obstruct a separately approved,
# manually processed login deletion. This migration itself deletes no accounts or data.
fk=[]
for table,columns in {'authorities':['seller_uid','reviewed_by'],'inquiries':['buyer_uid','seller_uid'],'messages':['sender_uid'],'upload_intents':['actor_uid'],'cases':['reporter_uid','reviewed_by']}.items():
 for col in columns:
  full='luvipro_marketplace_'+table
  fk.append(f'ALTER TABLE public.{full} ALTER COLUMN {col} DROP NOT NULL, DROP CONSTRAINT {full}_{col}_fkey, ADD CONSTRAINT {full}_{col}_fkey FOREIGN KEY ({col}) REFERENCES auth.users(id) ON DELETE SET NULL;')
path.write_text(base+'\n\n'+marker+'\n'+'\n\n'.join(parts)+'\n\n'+'\n'.join(fk)+'\nCOMMIT;\n',encoding='utf-8')
print('Generated guarded replacements; immutable deployed core unchanged.')
