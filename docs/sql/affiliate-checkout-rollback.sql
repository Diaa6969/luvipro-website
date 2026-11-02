BEGIN;
REVOKE EXECUTE ON FUNCTION public.luvipro_checkout_order_v1(uuid,uuid,jsonb),public.luvipro_checkout_cancel_v1(uuid,text),public.luvipro_checkout_refund_v1(uuid,date,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
-- Preserve history reads and all order/refund records; no weakening of existing RLS.
COMMIT;
