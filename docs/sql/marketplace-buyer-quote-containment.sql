BEGIN;
REVOKE EXECUTE ON FUNCTION public.luvipro_marketplace_buyer_quote_v1(uuid) FROM authenticated;
COMMIT;
-- Only contains new quote context. Existing requests, scheduling and records remain.
