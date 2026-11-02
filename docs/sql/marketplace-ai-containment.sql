BEGIN;
UPDATE public.luvipro_marketplace_settings SET ai_provider_enabled=false WHERE singleton;
REVOKE EXECUTE ON FUNCTION public.luvipro_marketplace_ai_reserve_v1(uuid,uuid,text,bigint,text) FROM service_role;
COMMIT;
-- Retains accounting reservations and existing deterministic assistance. No record deletion.
