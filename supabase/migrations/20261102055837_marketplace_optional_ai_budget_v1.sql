-- Optional provider remains OFF; no external call or fee is activated.
BEGIN;
ALTER TABLE public.luvipro_marketplace_settings
 ADD COLUMN ai_daily_usd_micros bigint NOT NULL DEFAULT 0 CHECK(ai_daily_usd_micros BETWEEN 0 AND 100000000),
 ADD COLUMN ai_monthly_usd_micros bigint NOT NULL DEFAULT 0 CHECK(ai_monthly_usd_micros BETWEEN 0 AND 1000000000),
 ADD COLUMN ai_approval_reference text,
 ADD CONSTRAINT marketplace_ai_activation_gate CHECK(NOT ai_provider_enabled OR (ai_daily_usd_micros>0 AND ai_monthly_usd_micros>=ai_daily_usd_micros AND length(coalesce(ai_approval_reference,''))>=20));
CREATE TABLE public.luvipro_marketplace_ai_reservations(
 request_id uuid PRIMARY KEY,actor_uid uuid NOT NULL,action text NOT NULL CHECK(action IN('search','description')),
 upper_cost_usd_micros bigint NOT NULL CHECK(upper_cost_usd_micros BETWEEN 1 AND 10000000),model text NOT NULL CHECK(length(model) BETWEEN 1 AND 100),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.luvipro_marketplace_ai_reservations(created_at);
ALTER TABLE public.luvipro_marketplace_ai_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_marketplace_ai_reservations FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.luvipro_marketplace_ai_reserve_v1(p_actor uuid,p_request uuid,p_action text,p_cost bigint,p_model text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.luvipro_marketplace_actor_v1(p_actor);c public.luvipro_marketplace_settings%ROWTYPE;day_start timestamptz;month_start timestamptz;
BEGIN
 IF p_request IS NULL OR p_action IS NULL OR p_action NOT IN('search','description') OR p_cost IS NULL OR p_cost NOT BETWEEN 1 AND 10000000 OR p_model IS NULL OR p_model!~'^[A-Za-z0-9_.:-]{1,100}$' THEN RETURN false;END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('marketplace-global-ai-budget-v1',0));
 SELECT * INTO STRICT c FROM public.luvipro_marketplace_settings WHERE singleton FOR SHARE;
 IF NOT c.ai_provider_enabled OR EXISTS(SELECT 1 FROM public.luvipro_marketplace_ai_reservations WHERE request_id=p_request) THEN RETURN false;END IF;
 -- Fixed client RPC already authorizes ownership and enforces per-user minute/day/month quotas.
 IF NOT EXISTS(SELECT 1 FROM public.luvipro_marketplace_assist_usage WHERE actor_uid=actor AND action=p_action AND created_at>now()-interval '1 minute') THEN RETURN false;END IF;
 day_start:=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';month_start:=date_trunc('month',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 IF (SELECT coalesce(sum(upper_cost_usd_micros),0) FROM public.luvipro_marketplace_ai_reservations WHERE created_at>=day_start)+p_cost>c.ai_daily_usd_micros
 OR (SELECT coalesce(sum(upper_cost_usd_micros),0) FROM public.luvipro_marketplace_ai_reservations WHERE created_at>=month_start)+p_cost>c.ai_monthly_usd_micros THEN RETURN false;END IF;
 INSERT INTO public.luvipro_marketplace_ai_reservations(request_id,actor_uid,action,upper_cost_usd_micros,model) VALUES(p_request,actor,p_action,p_cost,p_model);
 RETURN true;
END$$;
REVOKE ALL ON FUNCTION public.luvipro_marketplace_ai_reserve_v1(uuid,uuid,text,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_marketplace_ai_reserve_v1(uuid,uuid,text,bigint,text) TO service_role;
COMMIT;
-- Conservative reservations are never released on timeout/failure: repeated failures cannot evade the cap.
-- No prompts, output, email, VIN, report contents or credentials are persisted.
