-- LUVIPRO ACCOUNTING LEDGER - STAGED FOR REVIEW ONLY.
-- Never execute against live Supabase without a separate user authorization and backup.
-- Assumes docs/sql/invoicing-schema.sql was reviewed and installed first.
-- No existing LUVIPRO app user, vehicle, inspection or payment table is changed.

-- Immutable invoice tax snapshots are required for historic month-over-month
-- bookkeeping. Future rate/price changes must NOT recalculate past invoices.
ALTER TABLE public.luvipro_billing_invoices
  ADD COLUMN IF NOT EXISTS invoice_date date,
  ADD COLUMN IF NOT EXISTS net_cents bigint,
  ADD COLUMN IF NOT EXISTS vat_cents bigint,
  ADD COLUMN IF NOT EXISTS gross_cents bigint;

ALTER TABLE public.luvipro_billing_invoices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_billing_invoices FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.luvipro_billing_invoices TO service_role;

CREATE INDEX IF NOT EXISTS luvipro_billing_invoice_date_idx
  ON public.luvipro_billing_invoices (invoice_date, created_at DESC);

CREATE TABLE IF NOT EXISTS public.luvipro_billing_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL CHECK (length(trim(supplier)) BETWEEN 1 AND 150),
  supplier_invoice_number text NOT NULL CHECK (length(trim(supplier_invoice_number)) BETWEEN 1 AND 100),
  invoice_date date NOT NULL,
  category text NOT NULL CHECK (category IN
    ('waren','software','marketing','miete','buero','personal','transport','sonstiges')),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  net_cents bigint NOT NULL CHECK (net_cents >= 0),
  vat_cents bigint NOT NULL CHECK (vat_cents >= 0),
  gross_cents bigint NOT NULL CHECK (gross_cents >= 0),
  vat_rate smallint NOT NULL CHECK (vat_rate IN (0, 7, 19)),
  vorsteuer_confirmed boolean NOT NULL DEFAULT false,
  paid boolean NOT NULL DEFAULT false,
  file_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT luvipro_cost_balance CHECK (net_cents + vat_cents = gross_cents),
  CONSTRAINT luvipro_supplier_invoice_unique UNIQUE (supplier, supplier_invoice_number)
);
CREATE INDEX IF NOT EXISTS luvipro_billing_expense_date_idx
  ON public.luvipro_billing_expenses (invoice_date, created_at DESC);
ALTER TABLE public.luvipro_billing_expenses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_billing_expenses FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.luvipro_billing_expenses TO service_role;

-- The Storage bucket is PRIVATE. Objects are only written/read through
-- authenticated server APIs using the service_role key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('luvipro-accounting', 'luvipro-accounting', false, 5242880,
          ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- No policies granting storage.objects access to anon or authenticated roles.
-- Never expose the SERVICE_ROLE_KEY in Next.js browser code.
-- Requires backup, audit trail, document retention, corrections/storno
-- workflow and accountant review before activation.
