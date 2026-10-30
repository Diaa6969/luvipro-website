-- STAGED ONLY. Requires the fresh complete production backup and restore gate.
-- Apply after affiliate-flutter-admin.sql. Does not change users or their roles.
-- The previous owner SELECT policy also exposed private review_notes through SELECT *.
-- Preserve owner RLS but limit direct columns; private Admin review must use guarded RPCs.
BEGIN;
ALTER TABLE public.luvipro_affiliate_applications
 ADD COLUMN IF NOT EXISTS applicant_message text NOT NULL DEFAULT ''
 CHECK (char_length(applicant_message)<=1600);
REVOKE SELECT ON public.luvipro_affiliate_applications FROM authenticated;
GRANT SELECT(id,owner_uid,company_name,contact_name,email,phone,country,
 business_address,website,marketing_plan,status,reviewed_at,created_at,updated_at,
 legal_agb_version,legal_agb_accepted_at,applicant_message)
 ON public.luvipro_affiliate_applications TO authenticated;

CREATE OR REPLACE FUNCTION public.luvipro_affiliate_account_v1()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.luvipro_affiliate_applications%ROWTYPE; u uuid:=auth.uid();
BEGIN
 IF u IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.luvipro_affiliate_applications WHERE owner_uid=u;
 IF NOT FOUND THEN RETURN jsonb_build_object('application',null); END IF;
 RETURN jsonb_build_object('application',jsonb_build_object(
  'id',a.id,'status',a.status,'company_name',a.company_name,
  'created_at',a.created_at,'reviewed_at',a.reviewed_at,
  'message',a.applicant_message,'agb_version',a.legal_agb_version,
  'new_business_enabled',a.status='approved'),
  'summary',jsonb_build_object(
   'commission_total_cents',(SELECT coalesce(sum(commission_cents),0)::text
    FROM public.luvipro_affiliate_commissions WHERE affiliate_id=a.id AND status<>'void'),
   'commission_pending_cents',(SELECT coalesce(sum(commission_cents),0)::text
    FROM public.luvipro_affiliate_commissions WHERE affiliate_id=a.id AND status='pending'),
   'commission_eligible_cents',(SELECT coalesce(sum(commission_cents),0)::text
    FROM public.luvipro_affiliate_commissions WHERE affiliate_id=a.id AND status='eligible'),
   'commission_paid_cents',(SELECT coalesce(sum(commission_cents),0)::text
    FROM public.luvipro_affiliate_commissions WHERE affiliate_id=a.id AND status='paid')));
END; $$;
REVOKE ALL ON FUNCTION public.luvipro_affiliate_account_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_affiliate_account_v1() TO authenticated;
COMMENT ON FUNCTION public.luvipro_affiliate_account_v1() IS
 'Same Auth identity, owner-only status and real ledger aggregates; no private Admin notes or fabricated order statistics. Historical earned amounts remain visible after suspension.';
COMMIT;
