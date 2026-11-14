BEGIN;
CREATE TABLE public.luvipro_finance_accounts (
  code text PRIMARY KEY CHECK (code ~ '^[0-9]{4,9}$'),
  label text NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 120),
  kind text NOT NULL CHECK (kind IN ('asset','liability','equity','income','expense'))
);
CREATE TABLE public.luvipro_finance_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_date date NOT NULL,
  reference text NOT NULL UNIQUE CHECK (length(trim(reference)) BETWEEN 1 AND 180),
  memo text NOT NULL CHECK (length(trim(memo)) BETWEEN 1 AND 500),
  posted_at timestamptz NOT NULL DEFAULT now(),
  reversal_of uuid UNIQUE REFERENCES public.luvipro_finance_journal(id)
);
CREATE TABLE public.luvipro_finance_lines (
  entry_id uuid NOT NULL REFERENCES public.luvipro_finance_journal(id),
  line_number integer NOT NULL,
  account text NOT NULL REFERENCES public.luvipro_finance_accounts(code),
  debit_cents bigint NOT NULL CHECK (debit_cents BETWEEN 0 AND 100000000000),
  credit_cents bigint NOT NULL CHECK (credit_cents BETWEEN 0 AND 100000000000),
  PRIMARY KEY (entry_id, line_number),
  CHECK ((debit_cents > 0) <> (credit_cents > 0))
);
CREATE INDEX luvipro_finance_lines_account_idx ON public.luvipro_finance_lines(account);
CREATE INDEX luvipro_finance_journal_date_idx ON public.luvipro_finance_journal(posting_date, id);
ALTER TABLE public.luvipro_finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luvipro_finance_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.luvipro_finance_lines ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.luvipro_finance_accounts, public.luvipro_finance_journal, public.luvipro_finance_lines FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.luvipro_finance_accounts TO service_role;
GRANT SELECT ON public.luvipro_finance_journal, public.luvipro_finance_lines TO service_role;

-- The owner writes both tables in one transaction. Only the verified server API
-- may invoke the function. Clients receive no direct table or function grants.
CREATE FUNCTION public.luvipro_finance_post(
  p_date date, p_reference text, p_memo text, p_lines jsonb, p_reversal uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  entry uuid;
  total_debit numeric;
  total_credit numeric;
  original_date date;
BEGIN
  IF p_reversal IS NOT NULL THEN
    SELECT posting_date INTO STRICT original_date FROM public.luvipro_finance_journal
      WHERE id = p_reversal AND reversal_of IS NULL;
    IF p_date < original_date THEN RAISE EXCEPTION 'Invalid reversal date'; END IF;
    SELECT jsonb_agg(jsonb_build_object('account', account, 'debit', credit_cents, 'credit', debit_cents) ORDER BY line_number)
      INTO p_lines FROM public.luvipro_finance_lines WHERE entry_id = p_reversal;
  END IF;
  IF jsonb_typeof(p_lines) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Lines must be an array'; END IF;
  IF jsonb_array_length(p_lines) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Invalid line count'; END IF;
  INSERT INTO public.luvipro_finance_journal (posting_date, reference, memo, reversal_of)
    VALUES (p_date, p_reference, p_memo, p_reversal) RETURNING id INTO entry;
  INSERT INTO public.luvipro_finance_lines (entry_id, line_number, account, debit_cents, credit_cents)
    SELECT entry, ordinal, line->>'account', (line->>'debit')::bigint, (line->>'credit')::bigint
    FROM jsonb_array_elements(p_lines) WITH ORDINALITY AS items(line, ordinal);
  SELECT sum(debit_cents), sum(credit_cents) INTO total_debit, total_credit
    FROM public.luvipro_finance_lines WHERE entry_id = entry;
  IF total_debit IS DISTINCT FROM total_credit THEN RAISE EXCEPTION 'Unbalanced entry'; END IF;
  RETURN entry;
END;
$$;
REVOKE ALL ON FUNCTION public.luvipro_finance_post(date,text,text,jsonb,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.luvipro_finance_post(date,text,text,jsonb,uuid) TO service_role;
COMMIT;
