BEGIN;
CREATE OR REPLACE FUNCTION public.luvipro_marketplace_buyer_check_v1(p_action text, p_id uuid DEFAULT NULL::uuid, p_listing uuid DEFAULT NULL::uuid, p_partner uuid DEFAULT NULL::uuid, p_revision integer DEFAULT NULL::integer, p_note text DEFAULT ''::text, p_slot timestamp with time zone DEFAULT NULL::timestamp with time zone, p_confirm boolean DEFAULT false, p_request uuid DEFAULT NULL::uuid, p_product text DEFAULT 'inspection_standard'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 IF p_action IN('list','admin_list') THEN
  IF p_action='admin_list' THEN
   IF NOT public.is_admin() OR length(btrim(coalesce(p_note,'')))<12 THEN RAISE EXCEPTION 'Documented Admin Center access required' USING ERRCODE='42501';END IF;
   INSERT INTO public.luvipro_marketplace_audit(actor_uid,action,details) VALUES(actor,'buyer_check_admin_view',jsonb_build_object('reason',p_note));
  END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO items FROM(
   SELECT c.*,advert.data->>'brand' brand,advert.data->>'model' model,advert.data->>'city' city,
   CASE WHEN c.buyer_uid=actor THEN 'buyer' WHEN c.seller_uid=actor THEN 'seller' WHEN c.partner_uid=actor THEN 'partner' ELSE 'admin' END participant_role
   FROM public.luvipro_marketplace_buyer_checks c JOIN public.luvipro_marketplace_listings advert ON advert.id=c.listing_id
   WHERE actor IN(c.buyer_uid,c.seller_uid,c.partner_uid) OR (p_action='admin_list' AND public.is_admin()) ORDER BY c.updated_at DESC,c.id LIMIT 100)x;
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
END$function$
;
COMMIT;
