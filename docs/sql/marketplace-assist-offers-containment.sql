-- Specific reversible containment: keep settings, usage, audit, listings and all reports.
BEGIN;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_config_v1(jsonb,integer,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_assist_v1(text,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_report_offer_v1(uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
-- Re-enable only by replaying the reviewed GRANT statements after verification.
-- Do not drop tables or delete usage, audit or financial records as a rollback shortcut.
