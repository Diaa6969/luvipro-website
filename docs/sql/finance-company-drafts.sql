BEGIN;
CREATE TABLE public.luvipro_finance_company_revisions (
  revision bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  saved_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL CHECK (jsonb_typeof(details) = 'object' AND octet_length(details::text) <= 16000)
);
ALTER TABLE public.luvipro_finance_company_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_finance_company_revisions FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.luvipro_finance_company_revisions TO service_role;
REVOKE ALL ON SEQUENCE public.luvipro_finance_company_revisions_revision_seq FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.luvipro_finance_company_revisions_revision_seq TO service_role;
COMMIT;
