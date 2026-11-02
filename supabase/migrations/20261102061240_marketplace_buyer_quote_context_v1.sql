BEGIN;
CREATE FUNCTION public.luvipro_marketplace_buyer_quote_v1(p_request uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1();r public.luvipro_marketplace_buyer_checks%ROWTYPE;location jsonb;
BEGIN
 SELECT * INTO r FROM public.luvipro_marketplace_buyer_checks WHERE id=p_request AND buyer_uid=actor;
 IF NOT FOUND OR r.status NOT IN('accepted','appointment_proposed','scheduled') OR NOT r.seller_accepted OR r.partner_uid IS NULL OR NOT public.luvipro_marketplace_partner_available_v1(r.partner_uid,true) THEN RAISE EXCEPTION 'Accepted own buyer request and current workshop required' USING ERRCODE='42501';END IF;
 SELECT jsonb_build_object('id',loc.id,'partner_user_id',loc.partner_user_id,'company_name',loc.company_name,'city',loc.city,'postal_code',loc.postal_code) INTO location
 FROM public.partner_locations loc JOIN public.partner_verifications v ON v.id=loc.partner_verification_id WHERE loc.partner_user_id=r.partner_uid AND loc.is_active AND loc.accepts_inspection_requests AND v.status='approved' AND v.show_on_map ORDER BY loc.id LIMIT 1;
 IF location IS NULL THEN RAISE EXCEPTION 'Current workshop unavailable' USING ERRCODE='42501';END IF;
 RETURN jsonb_build_object('request_id',r.id,'product',r.product,'partner',location,'quote_only',true,'commercial_enabled',false,'notice','Bestehende LUVIPRO Preisprüfung für diese Anfrage. Keine Bestellung, Zahlung oder Berichtsfreigabe; Termin bleibt im Käufer-Check.');
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_buyer_quote_v1(uuid) FROM PUBLIC,anon,service_role;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_buyer_quote_v1(uuid) TO authenticated;
COMMIT;
