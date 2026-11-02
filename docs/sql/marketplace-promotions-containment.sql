BEGIN;
REVOKE EXECUTE ON FUNCTION public.luvipro_marketplace_promotion_v1(text,uuid,uuid,text,uuid,integer,text,date,text,bigint,boolean,timestamptz,jsonb) FROM anon,authenticated;
COMMIT;
-- Stop all new promotion entry points and sponsored reads; preserve financial/audit
-- records and stricter existing Marketplace authorization. Never refund automatically.
