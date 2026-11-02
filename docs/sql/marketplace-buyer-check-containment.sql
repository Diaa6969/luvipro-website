BEGIN;
REVOKE EXECUTE ON FUNCTION public.luvipro_marketplace_buyer_check_v1(text,uuid,uuid,uuid,integer,text,timestamptz,boolean,uuid,text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.luvipro_marketplace_check_partners_v1(uuid) FROM authenticated;
COMMIT;
-- Preserve request/event records and stricter live Partner/latest-verification checks.
-- Original read/dealer definitions saved separately for reviewed compatibility recovery; do not automatically reopen weaker public checks.
