-- Containment only: preserves all listing, report, conversation and audit records.
BEGIN;
DO $$DECLARE r record;BEGIN FOR r IN SELECT oid::regprocedure signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND left(proname,length('luvipro_marketplace_'))='luvipro_marketplace_' LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated,service_role',r.signature);
END LOOP;END$$;
-- Keep the additive report invalidation trigger: it only closes visibility, never reopens it.
COMMIT;
-- Also disable marketplace-v1 and restore the previous website/FlutterFlow navigation.
-- Do not drop the private bucket, tables, original inspections or historical messages.
