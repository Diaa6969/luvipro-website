-- Match the existing is_admin role AND active profile status; never widen media access.
BEGIN;
CREATE OR REPLACE FUNCTION public.luvipro_marketplace_photo_access_v1(p_photo uuid,p_actor uuid DEFAULT NULL) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p.object_path FROM public.luvipro_marketplace_photos p JOIN public.luvipro_marketplace_listings l ON l.id=p.listing_id
 WHERE p.id=p_photo AND p.removed_at IS NULL AND ((l.status='published' AND public.luvipro_marketplace_eligible_v1(l.id)) OR (EXISTS(SELECT 1 FROM auth.users a WHERE a.id=p_actor AND a.email_confirmed_at IS NOT NULL AND a.deleted_at IS NULL AND coalesce(a.banned_until,'-infinity'::timestamptz)<=now()) AND (l.seller_uid=p_actor OR EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND role='admin' AND status='active'))))
$$;
COMMIT;
