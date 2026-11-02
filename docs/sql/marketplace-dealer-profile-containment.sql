BEGIN;
REVOKE EXECUTE ON FUNCTION public.luvipro_marketplace_dealer_profile_v1(text,uuid,jsonb,integer,text,boolean) FROM authenticated;
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
-- Retain private submissions/review history, restore strict pre-profile public projection.
