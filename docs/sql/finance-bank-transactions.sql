-- Persist reviewed bank imports by bank account and provider transaction ID.
BEGIN;
CREATE TABLE public.luvipro_finance_bank_transactions (
  account_code text NOT NULL REFERENCES public.luvipro_finance_accounts(code),
  transaction_id text NOT NULL CHECK (transaction_id ~ '^[A-Za-z0-9_.-]{1,120}$'),
  booking_date date NOT NULL,
  amount_cents bigint NOT NULL CHECK (amount_cents BETWEEN -99999999999 AND 99999999999 AND amount_cents <> 0),
  reference text NOT NULL CHECK (length(reference) <= 500),
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_code, transaction_id)
);
ALTER TABLE public.luvipro_finance_bank_transactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_finance_bank_transactions FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.luvipro_finance_bank_transactions TO service_role;
COMMIT;
