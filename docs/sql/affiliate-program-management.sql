-- Additive management APIs for the existing Auth identity and native FlutterFlow pages.
-- No account/role changes, automatic approvals, transfers or real payment activation.
BEGIN;
ALTER TABLE public.luvipro_affiliate_applications
 ADD COLUMN IF NOT EXISTS review_revision integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS registration_verified_at timestamptz,
 ADD COLUMN IF NOT EXISTS registration_verified_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_submit_v1(
 p_actor uuid,p_payload jsonb,p_registration_path text
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE u auth.users%ROWTYPE; result uuid;
BEGIN
 SELECT * INTO u FROM auth.users WHERE id=p_actor;
 IF NOT FOUND OR u.email_confirmed_at IS NULL OR nullif(u.email,'') IS NULL THEN
  RAISE EXCEPTION 'Confirmed account required' USING ERRCODE='42501';
 END IF;
 IF p_payload->>'terms_version' IS DISTINCT FROM '2026-10-29'
 OR p_payload->'terms_accepted' IS DISTINCT FROM 'true'::jsonb
 OR p_payload->'privacy_accepted' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Current Affiliate terms and privacy acknowledgment required';
 END IF;
 IF char_length(btrim(coalesce(p_payload->>'company_name',''))) NOT BETWEEN 1 AND 160
 OR char_length(btrim(coalesce(p_payload->>'contact_name',''))) NOT BETWEEN 1 AND 160
 OR char_length(btrim(coalesce(p_payload->>'business_address',''))) NOT BETWEEN 5 AND 300
 OR char_length(coalesce(p_payload->>'phone',''))>60
 OR char_length(coalesce(p_payload->>'website',''))>300
 OR char_length(coalesce(p_payload->>'marketing_plan',''))>1600
 OR coalesce(p_payload->>'country','') NOT IN ('DE','AT','CH','NL','FR','PL') THEN
  RAISE EXCEPTION 'Invalid application fields';
 END IF;
 IF p_registration_path IS NULL OR p_registration_path NOT LIKE p_actor::text||'/%'
 OR p_registration_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|png|jpg)$'
 OR NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='luvipro-affiliate-docs'
  AND o.name=p_registration_path AND (o.metadata->>'size')::bigint BETWEEN 32 AND 5242880
  AND o.metadata->>'mimetype' IN ('application/pdf','image/png','image/jpeg')) THEN
  RAISE EXCEPTION 'Verified private registration document required';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text,3126));
 IF EXISTS(SELECT 1 FROM public.luvipro_affiliate_applications WHERE owner_uid=p_actor) THEN
  RAISE EXCEPTION 'An application already exists for this account' USING ERRCODE='23505';
 END IF;
 IF NOT public.luvipro_affiliate_take_rate(md5(p_actor::text)||md5(p_actor::text),5) THEN
  RAISE EXCEPTION 'Application rate limit exceeded';
 END IF;
 INSERT INTO public.luvipro_affiliate_applications(owner_uid,company_name,contact_name,
  email,phone,country,business_address,website,marketing_plan,registration_path,
  legal_agb_version,legal_agb_accepted_at)
 VALUES(p_actor,btrim(p_payload->>'company_name'),btrim(p_payload->>'contact_name'),
  lower(u.email),btrim(coalesce(p_payload->>'phone','')),p_payload->>'country',
  btrim(p_payload->>'business_address'),btrim(coalesce(p_payload->>'website','')),
  btrim(coalesce(p_payload->>'marketing_plan','')),p_registration_path,'2026-10-29',now())
 RETURNING id INTO result;
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 VALUES('application_submitted',result,p_actor,jsonb_build_object('agb_version','2026-10-29'));
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.luvipro_affiliate_submit_v1(uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_affiliate_submit_v1(uuid,jsonb,text) TO service_role;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_admin_review_v1(
 p_application uuid,p_expected_revision integer,p_status text,p_public_message text,
 p_private_note text,p_registration_checked boolean,p_contract_checked boolean,p_contract_reference text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.luvipro_affiliate_applications%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('pending','approved','rejected','suspended')
 OR p_public_message IS NULL OR char_length(p_public_message)>1600
 OR p_private_note IS NULL OR char_length(p_private_note)>3000
 OR (p_status IN ('rejected','suspended') AND char_length(btrim(p_public_message))<5) THEN
  RAISE EXCEPTION 'Invalid review decision'; END IF;
 SELECT * INTO a FROM public.luvipro_affiliate_applications WHERE id=p_application FOR UPDATE;
 IF NOT FOUND OR p_expected_revision IS DISTINCT FROM a.review_revision THEN
  RAISE EXCEPTION 'Application changed; reload before review' USING ERRCODE='40001'; END IF;
 IF p_status='approved' AND (p_registration_checked IS NOT TRUE
  OR p_contract_checked IS NOT TRUE OR char_length(btrim(coalesce(p_contract_reference,''))) NOT BETWEEN 4 AND 200
  OR a.legal_agb_version IS NULL OR a.legal_agb_accepted_at IS NULL
  OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='luvipro-affiliate-docs' AND name=a.registration_path)) THEN
  RAISE EXCEPTION 'Verified registration, accepted AGB and signed individual terms required'; END IF;
 IF a.individual_agreement_accepted_at IS NOT NULL AND p_status='approved'
  AND btrim(p_contract_reference)<>a.individual_agreement_ref THEN
  RAISE EXCEPTION 'Existing signed agreement is immutable; document a separate amendment'; END IF;
 UPDATE public.luvipro_affiliate_applications SET status=p_status,
  applicant_message=btrim(p_public_message),review_notes=btrim(p_private_note),
  reviewed_at=now(),updated_at=now(),review_revision=review_revision+1,
  registration_verified_at=CASE WHEN p_status='approved' THEN coalesce(registration_verified_at,now()) ELSE registration_verified_at END,
  registration_verified_by=CASE WHEN p_status='approved' THEN coalesce(registration_verified_by,auth.uid()) ELSE registration_verified_by END,
  individual_agreement_ref=CASE WHEN p_status='approved' THEN btrim(p_contract_reference) ELSE individual_agreement_ref END,
  individual_agreement_accepted_at=CASE WHEN p_status='approved' THEN coalesce(individual_agreement_accepted_at,now()) ELSE individual_agreement_accepted_at END
 WHERE id=a.id;
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 VALUES('application_reviewed',a.id,auth.uid(),jsonb_build_object('previous_status',a.status,
  'status',p_status,'revision',a.review_revision+1,'registration_checked',p_registration_checked,
  'contract_checked',p_contract_checked,'contract_reference',p_contract_reference));
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_admin_workspace_v1(p_section text,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb; total bigint;
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN
  RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid offset'; END IF;
 IF p_section='applications' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_applications;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT id,owner_uid,company_name,contact_name,email,phone,country,business_address,
    website,marketing_plan,status,review_notes,applicant_message,review_revision,
    legal_agb_version,legal_agb_accepted_at,individual_agreement_ref,individual_agreement_accepted_at,
    registration_verified_at,created_at,reviewed_at
    FROM public.luvipro_affiliate_applications ORDER BY (status='pending') DESC,created_at DESC,id LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='codes' THEN
  SELECT count(*) INTO total FROM public.luvipro_discount_codes;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT c.*,a.company_name FROM public.luvipro_discount_codes c LEFT JOIN public.luvipro_affiliate_applications a ON a.id=c.affiliate_id
    ORDER BY c.created_at DESC,c.id LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='commissions' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_commissions;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT c.*,a.company_name FROM public.luvipro_affiliate_commissions c JOIN public.luvipro_affiliate_applications a ON a.id=c.affiliate_id
    ORDER BY c.created_at DESC,c.id LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='audit' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_audit;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT * FROM public.luvipro_affiliate_audit ORDER BY created_at DESC,id DESC LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='tax_profiles' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_tax_profiles;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT t.*,a.company_name FROM public.luvipro_affiliate_tax_profiles t JOIN public.luvipro_affiliate_applications a ON a.id=t.affiliate_id
    ORDER BY a.company_name,t.affiliate_id LIMIT 100 OFFSET p_offset) q;
 ELSE RAISE EXCEPTION 'Unknown Admin section'; END IF;
 RETURN jsonb_build_object('items',result,'has_more',total>p_offset+100,'total',total);
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_owned_ledger_v1(p_section text,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a uuid; result jsonb; total bigint;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 THEN RAISE EXCEPTION 'Invalid offset'; END IF;
 SELECT id INTO a FROM public.luvipro_affiliate_applications WHERE owner_uid=auth.uid();
 IF a IS NULL THEN RETURN jsonb_build_object('items','[]'::jsonb,'has_more',false,'total',0); END IF;
 IF p_section='codes' THEN
  SELECT count(*) INTO total FROM public.luvipro_discount_codes WHERE affiliate_id=a;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT id,code,active,discount_bps,commission_bps,valid_from,valid_until,usage_limit,redemption_count
    FROM public.luvipro_discount_codes WHERE affiliate_id=a ORDER BY created_at DESC,id LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='commissions' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_commissions WHERE affiliate_id=a;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT id,source_type,source_order_id,net_after_discount_cents::text,commission_cents::text,
    commission_rate_bps,status,created_at,verified_paid_at,delivered_at,return_deadline_at
    FROM public.luvipro_affiliate_commissions WHERE affiliate_id=a ORDER BY created_at DESC,id LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='payouts' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_payouts WHERE affiliate_id=a;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT id,payout_month,status,amount_cents::text,paid_at FROM public.luvipro_affiliate_payouts
    WHERE affiliate_id=a ORDER BY payout_month DESC,id LIMIT 100 OFFSET p_offset) q;
 ELSIF p_section='documents' THEN
  SELECT count(*) INTO total FROM public.luvipro_affiliate_settlement_documents WHERE affiliate_id=a;
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM
   (SELECT id,document_number,service_month,net_cents::text,vat_cents::text,gross_cents::text,vat_mode,vat_rate,issued_at
    FROM public.luvipro_affiliate_settlement_documents WHERE affiliate_id=a ORDER BY issued_at DESC,id LIMIT 100 OFFSET p_offset) q;
 ELSE RAISE EXCEPTION 'Unknown owner ledger section'; END IF;
 RETURN jsonb_build_object('items',result,'has_more',total>p_offset+100,'total',total);
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_admin_tax_profile_v1(p_affiliate uuid,p_profile jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.luvipro_affiliate_applications WHERE id=p_affiliate AND country='DE' AND registration_verified_at IS NOT NULL AND individual_agreement_accepted_at IS NOT NULL) THEN RAISE EXCEPTION 'Verified domestic supplier and signed individual agreement required; foreign tax treatment needs separate review';END IF;
 IF p_profile->'evidence_checked' IS DISTINCT FROM 'true'::jsonb
 OR p_profile->>'country' IS DISTINCT FROM 'DE' OR coalesce(p_profile->>'vat_mode','') NOT IN ('de_19','de_kleinunternehmer')
 OR char_length(btrim(coalesce(p_profile->>'legal_name',''))) NOT BETWEEN 3 AND 180
 OR char_length(btrim(coalesce(p_profile->>'postal_address',''))) NOT BETWEEN 6 AND 400
 OR char_length(btrim(coalesce(p_profile->>'tax_number_or_vat_id',''))) NOT BETWEEN 6 AND 50
 OR char_length(btrim(coalesce(p_profile->>'agreement_reference',''))) NOT BETWEEN 4 AND 200
 OR p_profile->'selfbilling_agreed' IS DISTINCT FROM 'true'::jsonb
 OR p_profile->'gross_inclusive_agreed' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'Verified tax evidence and written VAT-inclusive selfbilling agreement required'; END IF;
 INSERT INTO public.luvipro_affiliate_tax_profiles(affiliate_id,legal_name,postal_address,country,
  tax_number_or_vat_id,vat_mode,selfbilling_agreed,commission_gross_inclusive_agreed,
  selfbilling_agreement_reference,verified_by_uid,verified_at)
 VALUES(p_affiliate,btrim(p_profile->>'legal_name'),btrim(p_profile->>'postal_address'),'DE',
  btrim(p_profile->>'tax_number_or_vat_id'),p_profile->>'vat_mode',true,true,
  btrim(p_profile->>'agreement_reference'),auth.uid(),now())
 ON CONFLICT(affiliate_id) DO UPDATE SET legal_name=excluded.legal_name,
  postal_address=excluded.postal_address,country=excluded.country,
  tax_number_or_vat_id=excluded.tax_number_or_vat_id,vat_mode=excluded.vat_mode,
  selfbilling_agreed=true,commission_gross_inclusive_agreed=true,
  selfbilling_agreement_reference=excluded.selfbilling_agreement_reference,
  verified_by_uid=auth.uid(),verified_at=now();
 INSERT INTO public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 VALUES('tax_profile_verified',p_affiliate,auth.uid(),jsonb_build_object('vat_mode',p_profile->>'vat_mode'));
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_admin_prepare_payout_v1(p_affiliate uuid,p_month date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 RETURN public.luvipro_affiliate_prepare_manual_payout(p_affiliate,p_month,auth.uid());
END; $$;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_admin_issue_document_v1(
 p_payout uuid,p_issuer_name text,p_issuer_address text,p_legal_details_verified boolean
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR public.is_admin() IS NOT TRUE THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_legal_details_verified IS NOT TRUE THEN RAISE EXCEPTION 'Registered issuer details must be verified'; END IF;
 RETURN public.luvipro_affiliate_issue_selfbilling(p_payout,p_issuer_name,p_issuer_address,auth.uid());
END; $$;

REVOKE ALL ON FUNCTION public.luvipro_affiliate_admin_review_v1(uuid,integer,text,text,text,boolean,boolean,text),
 public.luvipro_affiliate_admin_workspace_v1(text,integer),public.luvipro_affiliate_owned_ledger_v1(text,integer),
 public.luvipro_affiliate_admin_tax_profile_v1(uuid,jsonb),public.luvipro_affiliate_admin_prepare_payout_v1(uuid,date),
 public.luvipro_affiliate_admin_issue_document_v1(uuid,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.luvipro_affiliate_admin_review_v1(uuid,integer,text,text,text,boolean,boolean,text),
 public.luvipro_affiliate_admin_workspace_v1(text,integer),public.luvipro_affiliate_owned_ledger_v1(text,integer),
 public.luvipro_affiliate_admin_tax_profile_v1(uuid,jsonb),public.luvipro_affiliate_admin_prepare_payout_v1(uuid,date),
 public.luvipro_affiliate_admin_issue_document_v1(uuid,text,text,boolean) TO authenticated,service_role;

-- Existing website finance sessions use a trusted server operator. This bridge
-- is SERVICE-ONLY and reuses the same guarded APIs as the native app.
CREATE OR REPLACE FUNCTION public.luvipro_affiliate_admin_dispatch_v1(p_actor uuid,p_action text,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE previous_sub text:=current_setting('request.jwt.claim.sub',true); result jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.users WHERE id=p_actor AND lower(role)='admin') THEN
  RAISE EXCEPTION 'Verified Admin operator required' USING ERRCODE='42501'; END IF;
 PERFORM set_config('request.jwt.claim.sub',p_actor::text,true);
 IF p_action='review' THEN
  PERFORM public.luvipro_affiliate_admin_review_v1((p_payload->>'application_id')::uuid,
   (p_payload->>'expected_revision')::integer,p_payload->>'status',
   p_payload->>'public_message',p_payload->>'private_note',
   (p_payload->>'registration_checked')::boolean,(p_payload->>'contract_checked')::boolean,p_payload->>'contract_reference');
  result:='{"saved":true}'::jsonb;
 ELSIF p_action='tax_profile' THEN
  PERFORM public.luvipro_affiliate_admin_tax_profile_v1((p_payload->>'affiliate_id')::uuid,p_payload->'profile');
  result:='{"saved":true}'::jsonb;
 ELSIF p_action='prepare_payout' THEN
  result:=jsonb_build_object('id',public.luvipro_affiliate_admin_prepare_payout_v1((p_payload->>'affiliate_id')::uuid,(p_payload->>'month')::date));
 ELSIF p_action='issue_document' THEN
  result:=jsonb_build_object('id',public.luvipro_affiliate_admin_issue_document_v1((p_payload->>'payout_id')::uuid,
   p_payload->>'issuer_name',p_payload->>'issuer_address',(p_payload->>'legal_details_verified')::boolean));
 ELSE RAISE EXCEPTION 'Unsupported Admin operation'; END IF;
 PERFORM set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.luvipro_affiliate_admin_dispatch_v1(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_affiliate_admin_dispatch_v1(uuid,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
