begin;

alter table luvipro_ledger.entries add column reverses_entry_id bigint
  unique references luvipro_ledger.entries(id);
create index on luvipro_ledger.entries (posting_date);

create function luvipro_ledger.reverse_entry(
  actor uuid, original_id bigint, reversal_date date, reason text
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  reverse_id bigint;
  original luvipro_ledger.entries%rowtype;
  postings jsonb;
begin
  if reason is null or length(btrim(reason)) not between 1 and 500 then
    raise exception 'A reversal reason is required';
  end if;
  select * into strict original from luvipro_ledger.entries where id = original_id for update;
  if original.reverses_entry_id is not null or reversal_date < original.posting_date then
    raise exception 'Invalid reversal target or date';
  end if;
  select jsonb_agg(jsonb_build_object('account_id', account_id,
    'debit_cents', credit_cents, 'credit_cents', debit_cents) order by line_no)
    into postings from luvipro_ledger.lines where entry_id = original_id;
  reverse_id := luvipro_ledger.post_entry(actor, jsonb_build_object(
    'source_kind', 'reversal', 'source_id', original_id::text,
    'document_reference', reason, 'posting_date', reversal_date), postings);
  update luvipro_ledger.entries set reverses_entry_id = original_id where id = reverse_id;
  return reverse_id;
end
$$;
revoke all on function luvipro_ledger.reverse_entry(uuid,bigint,date,text)
  from public, anon, authenticated;
grant execute on function luvipro_ledger.reverse_entry(uuid,bigint,date,text) to service_role;

create view luvipro_ledger.monthly_turnover with (security_invoker = true) as
select date_trunc('month', e.posting_date::timestamp)::date as month,
  a.chart, a.code, a.label, a.category,
  sum(l.debit_cents) as debit_cents, sum(l.credit_cents) as credit_cents,
  sum(l.debit_cents::numeric - l.credit_cents) as debit_balance_cents
from luvipro_ledger.entries e
join luvipro_ledger.lines l on l.entry_id = e.id
join luvipro_ledger.accounts a on a.id = l.account_id
group by 1, a.chart, a.code, a.label, a.category;
revoke all on luvipro_ledger.monthly_turnover from public, anon, authenticated;
grant select on luvipro_ledger.monthly_turnover to service_role;
commit;

