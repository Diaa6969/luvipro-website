-- CONTRACT SETTING: Affiliate commission is a fixed gross payout including VAT when due; the Affiliate pays own income tax. The contract must say this explicitly.
-- LUVIPRO manual-only Affiliate settlements.
-- STAGED ONLY. NOT executed in production by this commit.
-- Dependencies (in order):
-- docs/sql/affiliate-accounting-extension.sql
-- docs/sql/affiliate-code-controls.sql
-- docs/sql/bookkeeping-extension.sql
-- Requires fresh, verified backup & isolated restore/RLS tests.
-- All application / partner / invoice data remains in ONE Supabase project.

create table if not exists public.luvipro_affiliate_tax_profiles (
 affiliate_id uuid primary key references public.luvipro_affiliate_applications(id) on delete restrict,
 legal_name text not null check (char_length(trim(legal_name)) between 3 and 180),
 postal_address text not null check (char_length(trim(postal_address)) between 6 and 400),
 country char(2) not null default 'DE' check (country='DE'), -- other countries require tailored tax treatment
 tax_number_or_vat_id text not null check (char_length(trim(tax_number_or_vat_id)) between 6 and 50),
 vat_mode text not null check (vat_mode in ('de_19','de_kleinunternehmer')),
 selfbilling_agreed boolean not null default false,
 commission_gross_inclusive_agreed boolean not null default false, -- commission % of customer's net purchase price sets TOTAL payout including any applicable VAT
 selfbilling_agreement_reference text not null default '',
 verified_by_uid uuid references auth.users(id),
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint luvipro_affiliate_agreement_ready check
  (not selfbilling_agreed or (commission_gross_inclusive_agreed and verified_at is not null and verified_by_uid is not null
   and length(trim(selfbilling_agreement_reference)) >= 4))
);
alter table public.luvipro_affiliate_tax_profiles enable row level security;
revoke all on public.luvipro_affiliate_tax_profiles from public,anon,authenticated;
grant select on public.luvipro_affiliate_tax_profiles to authenticated;
grant select,insert,update on public.luvipro_affiliate_tax_profiles to service_role;
create policy luvipro_tax_admin_read on public.luvipro_affiliate_tax_profiles
 for select to authenticated using ((select public.is_admin()));
create policy luvipro_tax_owner_read on public.luvipro_affiliate_tax_profiles
 for select to authenticated using (exists(
   select 1 from public.luvipro_affiliate_applications a where a.id=affiliate_id
   and a.owner_uid=(select auth.uid()) and a.status='approved'));

create sequence if not exists public.luvipro_affiliate_gutschrift_sequence;
revoke all on sequence public.luvipro_affiliate_gutschrift_sequence from public,anon,authenticated;
grant usage,select on sequence public.luvipro_affiliate_gutschrift_sequence to service_role;

-- Immutable tax-document snapshots, unique per payout. No client insertion.
create table if not exists public.luvipro_affiliate_settlement_documents (
 id uuid primary key default gen_random_uuid(),
 payout_id uuid not null unique references public.luvipro_affiliate_payouts(id) on delete restrict,
 affiliate_id uuid not null references public.luvipro_affiliate_applications(id) on delete restrict,
 document_number text not null unique,
 document_type text not null check (document_type='gutschrift'),
 issued_at timestamptz not null default now(),
 service_month date not null check (extract(day from service_month)=1),
 service_from date not null,
 service_until date not null,
 constraint luvipro_affiliate_service_period check (service_until>=service_from),
 supplier_legal_name text not null,
 supplier_address text not null,
 supplier_tax_number text not null,
 issuer_legal_name text not null,
 issuer_address text not null,
 vat_mode text not null check (vat_mode in ('de_19','de_kleinunternehmer')),
 vat_rate smallint not null check (vat_rate in (0,19)),
 net_cents bigint not null check (net_cents>0),
 vat_cents bigint not null check (vat_cents>=0),
 gross_cents bigint not null check (gross_cents>0),
 agreement_ref text not null check (char_length(trim(agreement_ref))>=4),
 created_at timestamptz not null default now(),
 constraint luvipro_affiliate_settlement_calc check
  (gross_cents = net_cents + vat_cents and
   net_cents = case when vat_rate=19 then (gross_cents*100+59)/119 else gross_cents end),
 constraint luvipro_affiliate_settlement_vatmode check
  ((vat_mode='de_19' and vat_rate=19) or
   (vat_mode='de_kleinunternehmer' and vat_rate=0))
);
alter table public.luvipro_affiliate_settlement_documents enable row level security;
revoke all on public.luvipro_affiliate_settlement_documents from public,anon,authenticated;
grant select on public.luvipro_affiliate_settlement_documents to authenticated;
grant select,insert on public.luvipro_affiliate_settlement_documents to service_role;
create policy luvipro_settlement_admin_read on public.luvipro_affiliate_settlement_documents
 for select to authenticated using ((select public.is_admin()));
create policy luvipro_settlement_owner_read on public.luvipro_affiliate_settlement_documents
 for select to authenticated using (exists(
   select 1 from public.luvipro_affiliate_applications a where a.id=affiliate_id
   and a.owner_uid=(select auth.uid()) and a.status='approved'));

-- Manual bank payment evidence; append-only, no debit API or bank integration.
create table if not exists public.luvipro_affiliate_manual_transfers (
 id uuid primary key default gen_random_uuid(),
 payout_id uuid not null unique references public.luvipro_affiliate_payouts(id) on delete restrict,
 settlement_document_id uuid not null unique references public.luvipro_affiliate_settlement_documents(id) on delete restrict,
 affiliate_id uuid not null references public.luvipro_affiliate_applications(id) on delete restrict,
 gross_cents bigint not null check(gross_cents>0),
 bank_reference text not null unique check (char_length(trim(bank_reference)) between 5 and 200),
 transferred_on date not null,
 recorded_by_uid uuid references auth.users(id),
 recorded_at timestamptz not null default now(),
 note text not null default ''
);
alter table public.luvipro_affiliate_manual_transfers enable row level security;
revoke all on public.luvipro_affiliate_manual_transfers from public,anon,authenticated;
grant select on public.luvipro_affiliate_manual_transfers to authenticated;
grant select,insert on public.luvipro_affiliate_manual_transfers to service_role;
create policy luvipro_transfer_admin_read on public.luvipro_affiliate_manual_transfers
 for select to authenticated using ((select public.is_admin()));
create policy luvipro_transfer_owner_read on public.luvipro_affiliate_manual_transfers
 for select to authenticated using (exists(
   select 1 from public.luvipro_affiliate_applications a where a.id=affiliate_id
   and a.owner_uid=(select auth.uid()) and a.status='approved'));

-- Protect issued docs / transfer evidence even from privileged accidental updates.
create or replace function public.luvipro_affiliate_immutable_rows() returns trigger
 language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 raise exception 'Immutable finance ledger: issue corrective document/entry instead';
end; $$;
create trigger luvipro_settlement_immutable_before before update or delete
 on public.luvipro_affiliate_settlement_documents for each row execute function public.luvipro_affiliate_immutable_rows();
create trigger luvipro_transfer_immutable_before before update or delete
 on public.luvipro_affiliate_manual_transfers for each row execute function public.luvipro_affiliate_immutable_rows();
revoke execute on function public.luvipro_affiliate_immutable_rows() from public,anon,authenticated;

-- ADMIN SERVER ONLY. Functions are SECURITY INVOKER and accessible solely to service_role.
create or replace function public.luvipro_affiliate_prepare_manual_payout(p_affiliate uuid,p_month date,p_operator uuid)
returns uuid language plpgsql security invoker set search_path=pg_catalog,public,pg_temp as $$
declare v_id uuid; v_net bigint;v_count integer;
begin
 if p_month is null or extract(day from p_month)<>1 or p_month>=date_trunc('month',current_date)::date then
  raise exception 'Invalid settlement month';
 end if;
 if not exists(select 1 from public.luvipro_affiliate_applications where id=p_affiliate and status='approved') then
  raise exception 'Unapproved affiliate';
 end if;
 -- Single writer per affiliate/month, including concurrent admin requests.
 perform pg_advisory_xact_lock(hashtextextended(p_affiliate::text||':'||p_month::text,17));
 if exists(select 1 from public.luvipro_affiliate_payouts where affiliate_id=p_affiliate and payout_month=p_month) then
  raise exception 'A monthly payout already exists';
 end if;
 select coalesce(sum(commission_cents),0),count(*) into v_net,v_count
 from public.luvipro_affiliate_commissions
 where affiliate_id=p_affiliate and payout_id is null and status='eligible'
  and verified_paid_at is not null and delivered_at is not null
  and cancelled_at is null and refunded_at is null
  and now() >= greatest(delivered_at+interval '15 days',coalesce(return_deadline_at,delivered_at+interval '15 days'))
  and greatest(delivered_at+interval '15 days',coalesce(return_deadline_at,delivered_at+interval '15 days')) < p_month+interval '1 month';
 if v_count=0 or v_net<=0 then raise exception 'No verified eligible commissions'; end if;
 insert into public.luvipro_affiliate_payouts (affiliate_id,payout_month,amount_cents,status)
 values(p_affiliate,p_month,v_net,'prepared') returning id into v_id;
 update public.luvipro_affiliate_commissions set payout_id=v_id
 where affiliate_id=p_affiliate and payout_id is null and status='eligible'
  and verified_paid_at is not null and delivered_at is not null
  and cancelled_at is null and refunded_at is null
  and now() >= greatest(delivered_at+interval '15 days',coalesce(return_deadline_at,delivered_at+interval '15 days'))
  and greatest(delivered_at+interval '15 days',coalesce(return_deadline_at,delivered_at+interval '15 days')) < p_month+interval '1 month';
 -- Single transaction guarantees exactly-once linked earnings.
 if (select coalesce(sum(commission_cents),0) from public.luvipro_affiliate_commissions where payout_id=v_id)<>v_net
 then raise exception 'Payout sum changed during settlement'; end if;
 insert into public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 values('manual_payout_prepared',v_id,p_operator,jsonb_build_object('affiliate_id',p_affiliate,'month',p_month,'commission_net_cents',v_net));
 return v_id;
end; $$;
revoke execute on function public.luvipro_affiliate_prepare_manual_payout(uuid,date,uuid) from public,anon,authenticated;
grant execute on function public.luvipro_affiliate_prepare_manual_payout(uuid,date,uuid) to service_role;

create or replace function public.luvipro_affiliate_issue_selfbilling(
 p_payout uuid,p_issuer_name text,p_issuer_address text,p_operator uuid
) returns uuid language plpgsql security invoker set search_path=pg_catalog,public,pg_temp as $$
declare v_id uuid; p public.luvipro_affiliate_payouts%rowtype;
 t public.luvipro_affiliate_tax_profiles%rowtype;v_vat bigint;v_num text;v_rate smallint;v_first date;v_last date;
begin
 select * into p from public.luvipro_affiliate_payouts where id=p_payout for update;
 if not found or p.status<>'prepared' or p.amount_cents<=0 then raise exception 'Payout not prepared'; end if;
 if exists(select 1 from public.luvipro_affiliate_settlement_documents where payout_id=p_payout)
 then raise exception 'Tax document already issued'; end if;
 select * into t from public.luvipro_affiliate_tax_profiles where affiliate_id=p.affiliate_id;
 if not found or t.country<>'DE' or not t.selfbilling_agreed or t.verified_at is null
   or t.tax_number_or_vat_id='' or not t.commission_gross_inclusive_agreed
   or length(trim(t.selfbilling_agreement_reference))<4 then
  raise exception 'Reviewed German tax profile + written selfbilling agreement required';
 end if;
 if nullif(trim(p_issuer_name),'') is null or nullif(trim(p_issuer_address),'') is null
 then raise exception 'Registered LUVIPRO issuer details missing'; end if;
 select coalesce(sum(commission_cents),0),min(created_at)::date,max(created_at)::date into v_vat,v_first,v_last
 from public.luvipro_affiliate_commissions
 where payout_id=p_payout and affiliate_id=p.affiliate_id and status='eligible';
 if v_vat<>p.amount_cents or v_first is null or v_last is null then raise exception 'Commission sum mismatch'; end if;
 v_rate:=case when t.vat_mode='de_19' then 19 else 0 end;
 -- Contractual agreement: commission is a VAT-inclusive GROSS cap,
 -- calculated from the net selling price. Do NOT add VAT on top.
 -- Example 270,00 EUR commission incl. 19% VAT => net 226,89 + VAT 43,11.
 v_vat:=case when v_rate=19 then p.amount_cents - (p.amount_cents*100+59)/119 else 0 end;
 v_num:='GS-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.luvipro_affiliate_gutschrift_sequence')::text,8,'0');
 insert into public.luvipro_affiliate_settlement_documents(
  payout_id,affiliate_id,document_number,document_type,service_month,service_from,service_until,
  supplier_legal_name,supplier_address,supplier_tax_number,
  issuer_legal_name,issuer_address,vat_mode,vat_rate,net_cents,vat_cents,gross_cents,agreement_ref
 )values(
  p.id,p.affiliate_id,v_num,'gutschrift',p.payout_month,v_first,v_last,
  t.legal_name,t.postal_address,t.tax_number_or_vat_id,
  p_issuer_name,p_issuer_address,t.vat_mode,v_rate,p.amount_cents-v_vat,v_vat,p.amount_cents,t.selfbilling_agreement_reference
 ) returning id into v_id;
 insert into public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 values('selfbilling_issued',v_id,p_operator,jsonb_build_object('payout_id',p.id,'number',v_num,'net',p.amount_cents-v_vat,'vat',v_vat,'gross_total',p.amount_cents));
 return v_id;
end; $$;
revoke execute on function public.luvipro_affiliate_issue_selfbilling(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.luvipro_affiliate_issue_selfbilling(uuid,text,text,uuid) to service_role;

create or replace function public.luvipro_affiliate_record_manual_transfer(
 p_payout uuid,p_ref text,p_transferred_on date,p_operator uuid
) returns uuid language plpgsql security invoker set search_path=pg_catalog,public,pg_temp as $$
declare p public.luvipro_affiliate_payouts%rowtype; d public.luvipro_affiliate_settlement_documents%rowtype;v_id uuid;
begin
 if nullif(trim(p_ref),'') is null or char_length(trim(p_ref))<5 or char_length(trim(p_ref))>200
  or p_transferred_on is null or p_transferred_on>current_date or p_transferred_on<current_date-interval '120 days'
 then raise exception 'Valid completed external bank transfer reference/date required'; end if;
 select * into p from public.luvipro_affiliate_payouts where id=p_payout for update;
 if not found or p.status<>'prepared' or p.paid_at is not null then raise exception 'Not an unpaid prepared payout'; end if;
 select * into d from public.luvipro_affiliate_settlement_documents where payout_id=p.id;
 if not found or d.affiliate_id<>p.affiliate_id or d.gross_cents<>p.amount_cents then
  raise exception 'Valid issued tax document required before payout'; end if;
 if p_transferred_on<d.issued_at::date then raise exception 'Payment before issued document'; end if;
 if exists(select 1 from public.luvipro_affiliate_manual_transfers where payout_id=p.id)
 then raise exception 'Duplicate manual payment'; end if;
 update public.luvipro_affiliate_payouts set status='paid',
  paid_at=(p_transferred_on::timestamp at time zone 'Europe/Berlin'),
  payment_reference=trim(p_ref) where id=p.id;
 update public.luvipro_affiliate_commissions set status='paid' where payout_id=p.id and status='eligible';
 insert into public.luvipro_affiliate_manual_transfers(
  payout_id,settlement_document_id,affiliate_id,gross_cents,bank_reference,transferred_on,recorded_by_uid
 )values(p.id,d.id,p.affiliate_id,d.gross_cents,trim(p_ref),p_transferred_on,p_operator)
 returning id into v_id;
 -- The existing monthly report lists affiliate expenses separately to avoid
 -- duplicate entries in cash events, which must not be written here automatically.
 insert into public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 values('manual_bank_transfer_recorded',v_id,p_operator,
  jsonb_build_object('payout_id',p.id,'document_number',d.document_number,'gross_cents',d.gross_cents,'reference',trim(p_ref)));
 return v_id;
end; $$;
revoke execute on function public.luvipro_affiliate_record_manual_transfer(uuid,text,date,uuid)
 from public,anon,authenticated;
grant execute on function public.luvipro_affiliate_record_manual_transfer(uuid,text,date,uuid)
 to service_role;

-- Display/manual transfer route must authenticate the actual admin on every action.
-- These functions NEVER contact banks, Stripe, PayPal or any payout provider.
