begin;
create table luvipro_ledger.company_versions (
  version bigint generated always as identity primary key,
  created_at timestamptz not null default clock_timestamp(),
  created_by uuid not null,
  configuration jsonb not null check (jsonb_typeof(configuration) = 'object'),
  check (octet_length(configuration::text) <= 16000)
);
alter table luvipro_ledger.company_versions enable row level security;
revoke all on luvipro_ledger.company_versions from public, anon, authenticated, service_role;
grant select on luvipro_ledger.company_versions to service_role;

-- Saving company information alone cannot activate any financial operation.
create function luvipro_ledger.save_company_version(
  actor uuid, expected_version bigint, configuration jsonb
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  latest_version bigint;
  saved_version bigint;
begin
  if jsonb_typeof(configuration) is distinct from 'object'
    or configuration - array['legal_name','legal_form','registered_address',
      'register_reference','tax_number','vat_id','bank_account','fiscal_year_start',
      'chart','vat_treatment','invoice_numbering','signatories'] <> '{}'::jsonb
    or coalesce(configuration->>'legal_form','') not in ('UG','GmbH')
    or coalesce(configuration->>'chart','') not in ('SKR03','SKR04')
    or length(btrim(coalesce(configuration->>'legal_name',''))) not between 1 and 250
    or length(btrim(coalesce(configuration->>'registered_address',''))) not between 1 and 1000 then
    raise exception 'Invalid company configuration';
  end if;
  lock table luvipro_ledger.company_versions in share row exclusive mode;
  select max(version) into latest_version from luvipro_ledger.company_versions;
  if expected_version is distinct from coalesce(latest_version, 0) then
    raise exception 'Company configuration has changed' using errcode = '40001';
  end if;
  insert into luvipro_ledger.company_versions(created_by, configuration)
    values(actor, configuration) returning version into saved_version;
  return saved_version;
end
$$;
revoke all on function luvipro_ledger.save_company_version(uuid,bigint,jsonb)
  from public, anon, authenticated;
grant execute on function luvipro_ledger.save_company_version(uuid,bigint,jsonb) to service_role;
commit;

