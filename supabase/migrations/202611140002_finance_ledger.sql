begin;
create schema luvipro_ledger;
revoke all on schema luvipro_ledger from public, anon, authenticated;
grant usage on schema luvipro_ledger to service_role;

create table luvipro_ledger.accounts (
  id bigint generated always as identity primary key,
  chart text not null check (chart in ('SKR03', 'SKR04')),
  code text not null check (code ~ '^[0-9]{4,8}$'),
  label text not null check (length(btrim(label)) > 0),
  category text not null check (category in ('asset','liability','equity','revenue','expense')),
  unique (chart, code)
);

create table luvipro_ledger.periods (
  month date primary key check (extract(day from month) = 1),
  closed_at timestamptz
);

create table luvipro_ledger.entries (
  id bigint generated always as identity primary key,
  source_kind text not null check (length(btrim(source_kind)) between 1 and 64),
  source_id text not null check (length(btrim(source_id)) between 1 and 200),
  document_reference text not null check (length(btrim(document_reference)) between 1 and 500),
  posting_date date not null,
  invoice_date date,
  service_date date,
  delivery_date date,
  due_date date,
  payment_date date,
  created_at timestamptz not null default now(),
  created_by uuid not null,
  unique (source_kind, source_id)
);

create table luvipro_ledger.lines (
  entry_id bigint not null references luvipro_ledger.entries(id),
  line_no integer not null,
  account_id bigint not null references luvipro_ledger.accounts(id),
  debit_cents bigint not null check (debit_cents >= 0),
  credit_cents bigint not null check (credit_cents >= 0),
  check ((debit_cents > 0) <> (credit_cents > 0)),
  primary key (entry_id, line_no)
);

alter table luvipro_ledger.accounts enable row level security;
alter table luvipro_ledger.periods enable row level security;
alter table luvipro_ledger.entries enable row level security;
alter table luvipro_ledger.lines enable row level security;
revoke all on all tables in schema luvipro_ledger from public, anon, authenticated, service_role;
grant select on all tables in schema luvipro_ledger to service_role;

-- Called only by a trusted backend after checking the user's administrator role.
create function luvipro_ledger.post_entry(
  actor uuid, header jsonb, postings jsonb
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  entry_key bigint;
  posting_day date := (header->>'posting_date')::date;
  period_month date := date_trunc('month', posting_day::timestamp)::date;
  period_closed timestamptz;
  line_count integer;
  net numeric;
  chart_count integer;
begin
  if jsonb_typeof(postings) is distinct from 'array' then
    raise exception 'Posting lines must be an array';
  end if;
  if jsonb_array_length(postings) not between 2 and 1000 then
    raise exception 'Expected 2 to 1000 posting lines';
  end if;
  select closed_at into period_closed from luvipro_ledger.periods
    where month = period_month for update;
  if not found or period_closed is not null then
    raise exception 'Posting period is unavailable';
  end if;
  select count(*), sum(p.debit_cents::numeric - p.credit_cents),
    count(distinct a.chart)
    into line_count, net, chart_count
    from jsonb_to_recordset(postings) p(account_id bigint, debit_cents bigint, credit_cents bigint)
    join luvipro_ledger.accounts a on a.id = p.account_id;
  if line_count <> jsonb_array_length(postings) or net is distinct from 0 or chart_count <> 1 then
    raise exception 'Posting must balance and use accounts from one chart';
  end if;
  insert into luvipro_ledger.entries (
    source_kind, source_id, document_reference, posting_date, created_by,
    invoice_date, service_date, delivery_date, due_date, payment_date
  ) values (
    header->>'source_kind', header->>'source_id', header->>'document_reference', posting_day, actor,
    (header->>'invoice_date')::date, (header->>'service_date')::date,
    (header->>'delivery_date')::date, (header->>'due_date')::date, (header->>'payment_date')::date
  ) returning id into entry_key;
  insert into luvipro_ledger.lines
  select entry_key, n::integer, (line->>'account_id')::bigint,
    (line->>'debit_cents')::bigint, (line->>'credit_cents')::bigint
  from jsonb_array_elements(postings) with ordinality x(line,n);
  return entry_key;
end
$$;
revoke all on function luvipro_ledger.post_entry(uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function luvipro_ledger.post_entry(uuid,jsonb,jsonb) to service_role;
commit;

