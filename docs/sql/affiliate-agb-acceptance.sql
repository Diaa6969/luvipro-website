-- LUVIPRO Affiliate legal acceptance version and individually negotiated terms.
-- STAGED migration only: SAME EXISTING Supabase project, no production data deletion.
-- Apply after docs/sql/affiliate-accounting-extension.sql AND fresh verified backup.
-- Existing applications remain unverified; NEVER backfill a fabricated agreement.
alter table public.luvipro_affiliate_applications
  add column if not exists legal_agb_version text,
  add column if not exists legal_agb_accepted_at timestamptz,
  add column if not exists individual_agreement_ref text not null default '',
  add column if not exists individual_agreement_accepted_at timestamptz;

-- For new applications: record time and immutable version from server.
alter table public.luvipro_affiliate_applications
  add constraint luvipro_affiliate_legal_agb_both_or_neither
  check ((legal_agb_version is null and legal_agb_accepted_at is null)
      or (legal_agb_version is not null and length(trim(legal_agb_version)) between 7 and 40
          and legal_agb_accepted_at is not null)) not valid;

alter table public.luvipro_affiliate_applications
  add constraint luvipro_affiliate_individual_agreement_both_or_neither
  check ((individual_agreement_accepted_at is null and individual_agreement_ref = '')
    or (individual_agreement_accepted_at is not null
        and length(trim(individual_agreement_ref)) between 4 and 200)) not valid;

comment on column public.luvipro_affiliate_applications.legal_agb_version is
 'Version shown at applicant consent; null indicates historic record without verifiable consent.';
comment on column public.luvipro_affiliate_applications.individual_agreement_ref is
 'Evidence reference of individually concluded agreement (commission %, product, gross incl. VAT, Gutschrift separately).';

-- Prevent retroactive or accidental manipulation of already saved legal consent.
create or replace function public.luvipro_affiliate_protect_legal_acceptance()
returns trigger language plpgsql
set search_path = pg_catalog, public, pg_temp as $$
begin
 if tg_op='UPDATE' and old.legal_agb_accepted_at is not null and
   (new.legal_agb_accepted_at is distinct from old.legal_agb_accepted_at
    or new.legal_agb_version is distinct from old.legal_agb_version) then
   raise exception 'Original application legal acceptance is immutable';
 end if;
 if tg_op='UPDATE' and old.individual_agreement_accepted_at is not null and
   (new.individual_agreement_accepted_at is distinct from old.individual_agreement_accepted_at
    or new.individual_agreement_ref is distinct from old.individual_agreement_ref) then
   raise exception 'Concluded individual terms are immutable; use a separate signed amendment';
 end if;
 if new.status='approved' and (
    new.legal_agb_version is null or new.legal_agb_accepted_at is null
    or new.individual_agreement_accepted_at is null
    or length(trim(new.individual_agreement_ref))<4) then
   raise exception 'Gewerbe verification, Affiliate AGB acceptance and individual signed terms are required';
 end if;
 return new;
end; $$;
drop trigger if exists luvipro_affiliate_protect_legal_acceptance_before
 on public.luvipro_affiliate_applications;
create trigger luvipro_affiliate_protect_legal_acceptance_before
 before insert or update on public.luvipro_affiliate_applications
 for each row execute function public.luvipro_affiliate_protect_legal_acceptance();
revoke execute on function public.luvipro_affiliate_protect_legal_acceptance()
 from public,anon,authenticated;

-- Do NOT switch on approved affiliate campaigns until signed individual
-- compensation terms are demonstrably captured. No retroactive consent.

-- Each manual code issuance or economic amendment must refer to separate
-- demonstrably accepted individual discount/commission conditions.
alter table public.luvipro_discount_codes
  add column if not exists code_terms_evidence_ref text not null default '',
  add column if not exists code_terms_confirmed_at timestamptz;
alter table public.luvipro_discount_codes
  add constraint luvipro_affiliate_code_terms_evidence_pair
  check ((code_terms_confirmed_at is null and code_terms_evidence_ref = '')
   or (code_terms_confirmed_at is not null
       and char_length(trim(code_terms_evidence_ref)) between 4 and 200)) not valid;

-- An active coupon may never be created or continued without a documented
-- individual set of code terms, and a separately concluded partner agreement.
create or replace function public.luvipro_affiliate_require_code_terms()
returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.active and (new.code_terms_confirmed_at is null
   or char_length(trim(new.code_terms_evidence_ref))<4) then
  raise exception 'Agreed individual discount code terms required before activation';
 end if;
 if tg_op='UPDATE' and new.code_terms_evidence_ref is distinct from old.code_terms_evidence_ref
   and new.code_terms_confirmed_at is null then
  raise exception 'New contractual reference requires acceptance timestamp';
 end if;
 if tg_op='UPDATE' and new.code_terms_confirmed_at is distinct from old.code_terms_confirmed_at then
  insert into public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
   values ('individual_code_terms_confirmed',new.id,auth.uid(),
    jsonb_build_object('evidence_ref',new.code_terms_evidence_ref,'accepted_at',new.code_terms_confirmed_at));
 end if;
 return new;
end; $$;
drop trigger if exists luvipro_affiliate_code_terms_before on public.luvipro_discount_codes;
create trigger luvipro_affiliate_code_terms_before before insert or update
  on public.luvipro_discount_codes for each row
  execute function public.luvipro_affiliate_require_code_terms();
revoke execute on function public.luvipro_affiliate_require_code_terms()
 from public,anon,authenticated;
