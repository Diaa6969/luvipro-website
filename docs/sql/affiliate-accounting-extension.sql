-- STAGED MIGRATION: apply only after fresh backup and isolated security tests.
-- New tables only; no existing application policies, users, or invoices are modified.
-- 2026-10-29 LUVIPRO affiliate + audit + accounting bridge.
create table if not exists public.luvipro_affiliate_applications (
 id uuid primary key default gen_random_uuid(),
 owner_uid uuid unique references auth.users(id) on delete set null,
 company_name text not null check (length(btrim(company_name)) between 1 and 160),
 contact_name text not null check (length(btrim(contact_name)) between 1 and 160),
 email text not null check (length(email) between 5 and 200),
 phone text not null default '',
 country text not null default 'DE' check (length(country) = 2),
 business_address text not null check (length(btrim(business_address)) between 5 and 300),
 website text not null default '',
 marketing_plan text not null default '' check (length(marketing_plan) <= 1600),
 registration_path text not null unique,
 status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
 review_notes text not null default '',
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create unique index if not exists luvipro_affiliate_pending_email on public.luvipro_affiliate_applications (lower(email)) where status='pending';
create index if not exists luvipro_affiliate_applications_status_created on public.luvipro_affiliate_applications(status,created_at desc);
alter table public.luvipro_affiliate_applications enable row level security;
revoke all on public.luvipro_affiliate_applications from public, anon, authenticated;
grant select, update on public.luvipro_affiliate_applications to authenticated;
grant select, insert, update on public.luvipro_affiliate_applications to service_role;
create policy affiliate_applications_admin_read on public.luvipro_affiliate_applications for select to authenticated using ((select public.is_admin()));
create policy affiliate_applications_admin_update on public.luvipro_affiliate_applications for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy affiliate_applications_owner_read on public.luvipro_affiliate_applications for select to authenticated using (owner_uid = (select auth.uid()));
-- Applicants submit via validated server endpoint; never via unauthenticated Data API.

create table if not exists public.luvipro_discount_codes (
 id uuid primary key default gen_random_uuid(),
 affiliate_id uuid not null references public.luvipro_affiliate_applications(id) on delete restrict,
 code text not null unique check (code ~ '^[A-Z0-9][A-Z0-9_-]{3,31}$'),
 product_sku text not null default 'LU3656060',
 discount_bps integer not null check (discount_bps between 0 and 10000),
 commission_bps integer not null check (commission_bps between 0 and 10000),
 valid_from date not null,
 valid_until date not null,
 usage_limit integer check (usage_limit is null or usage_limit > 0),
 redemption_count integer not null default 0 check (redemption_count >= 0),
 active boolean not null default false,
 created_at timestamptz not null default now(),
 constraint luvipro_discount_dates check (valid_until >= valid_from),
 constraint luvipro_discount_usage check (usage_limit is null or redemption_count <= usage_limit)
);
create index if not exists luvipro_discount_affiliate on public.luvipro_discount_codes(affiliate_id);
alter table public.luvipro_discount_codes enable row level security;
revoke all on public.luvipro_discount_codes from public, anon, authenticated;
grant select, insert, update on public.luvipro_discount_codes to authenticated;
grant select, insert, update on public.luvipro_discount_codes to service_role;
create policy discount_admin_read on public.luvipro_discount_codes for select to authenticated using ((select public.is_admin()));
create policy discount_admin_insert on public.luvipro_discount_codes for insert to authenticated with check ((select public.is_admin()));
create policy discount_admin_update on public.luvipro_discount_codes for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy discount_affiliate_read on public.luvipro_discount_codes for select to authenticated using (
 exists (select 1 from public.luvipro_affiliate_applications a where a.id = affiliate_id and a.owner_uid = (select auth.uid()) and a.status='approved')
);
-- The private registration bucket must never have public read/list policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('luvipro-affiliate-docs','luvipro-affiliate-docs',false,5242880,array['application/pdf','image/png','image/jpeg'])
 on conflict (id) do nothing;

create table if not exists public.luvipro_affiliate_payouts (
 id uuid primary key default gen_random_uuid(),
 affiliate_id uuid not null references public.luvipro_affiliate_applications(id) on delete restrict,
 payout_month date not null check (extract(day from payout_month)=1),
 status text not null default 'prepared' check (status in ('prepared','paid','cancelled')),
 amount_cents bigint not null default 0 check (amount_cents >= 0),
 paid_at timestamptz,
 payment_reference text,
 created_at timestamptz not null default now(),
 unique(affiliate_id,payout_month),
 constraint payout_paid_has_reference check (status <> 'paid' or (paid_at is not null and nullif(btrim(payment_reference),'') is not null))
);
alter table public.luvipro_affiliate_payouts enable row level security;
revoke all on public.luvipro_affiliate_payouts from public,anon,authenticated;
grant select, insert, update on public.luvipro_affiliate_payouts to authenticated;
grant select, insert, update on public.luvipro_affiliate_payouts to service_role;
create policy payout_admin_read on public.luvipro_affiliate_payouts for select to authenticated using ((select public.is_admin()));
create policy payout_admin_insert on public.luvipro_affiliate_payouts for insert to authenticated with check ((select public.is_admin()));
create policy payout_admin_update on public.luvipro_affiliate_payouts for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy payout_affiliate_read on public.luvipro_affiliate_payouts for select to authenticated using (
 exists (select 1 from public.luvipro_affiliate_applications a where a.id=affiliate_id and a.owner_uid=(select auth.uid()) and a.status='approved')
);

create table if not exists public.luvipro_affiliate_commissions (
 id uuid primary key default gen_random_uuid(),
 code_id uuid not null references public.luvipro_discount_codes(id) on delete restrict,
 affiliate_id uuid not null references public.luvipro_affiliate_applications(id) on delete restrict,
 source_type text not null check (source_type in ('stripe','bank_transfer','manual_verified')),
 source_order_id text not null check (length(source_order_id) between 5 and 200),
 net_after_discount_cents bigint not null check (net_after_discount_cents > 0),
 commission_cents bigint not null check (commission_cents >= 0),
 verified_paid_at timestamptz,
 delivered_at timestamptz,
 return_deadline_at timestamptz, -- actual longer legal/contractual return deadline, if applicable
 refunded_at timestamptz,
 cancelled_at timestamptz,
 payout_id uuid references public.luvipro_affiliate_payouts(id) on delete restrict,
 status text not null default 'pending' check (status in ('pending','eligible','paid','void')),
 created_at timestamptz not null default now(),
 unique(source_type,source_order_id),
 constraint commission_paid_payout check (status <> 'paid' or payout_id is not null),
 constraint commission_void_excluded check (status not in ('eligible','paid') or (refunded_at is null and cancelled_at is null))
);
create index if not exists luvipro_affiliate_commissions_partner on public.luvipro_affiliate_commissions(affiliate_id, created_at desc);
alter table public.luvipro_affiliate_commissions enable row level security;
revoke all on public.luvipro_affiliate_commissions from public,anon,authenticated;
grant select, insert, update on public.luvipro_affiliate_commissions to authenticated;
grant select, insert, update on public.luvipro_affiliate_commissions to service_role;
create policy commission_admin_read on public.luvipro_affiliate_commissions for select to authenticated using ((select public.is_admin()));
create policy commission_admin_insert on public.luvipro_affiliate_commissions for insert to authenticated with check ((select public.is_admin()));
create policy commission_admin_update on public.luvipro_affiliate_commissions for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy commission_affiliate_read on public.luvipro_affiliate_commissions for select to authenticated using (
 exists (select 1 from public.luvipro_affiliate_applications a where a.id=affiliate_id and a.owner_uid=(select auth.uid()) and a.status='approved')
);
create or replace function public.luvipro_affiliate_validate_commission() returns trigger
language plpgsql set search_path = pg_catalog, public, pg_temp as $$
declare p public.luvipro_affiliate_payouts%rowtype;
begin
 if new.status in ('eligible','paid') then
  if new.verified_paid_at is null or new.delivered_at is null
     or now() < greatest(new.delivered_at + interval '15 days',coalesce(new.return_deadline_at,new.delivered_at + interval '15 days'))
     or new.refunded_at is not null or new.cancelled_at is not null then
    raise exception 'Verified payment, delivery, and completed 14-day return buffer required';
  end if;
 end if;
 if new.payout_id is not null then
   select * into p from public.luvipro_affiliate_payouts where id = new.payout_id;
   if not found or p.affiliate_id <> new.affiliate_id or p.status = 'cancelled' then
      raise exception 'Invalid payout batch';
   end if;
 end if;
 if new.status = 'paid' and (new.payout_id is null or p.status <> 'paid') then
    raise exception 'Paid commission requires paid payout batch';
 end if;
 if tg_op = 'UPDATE' and old.status = 'paid'
    and (new.status <> old.status or new.commission_cents <> old.commission_cents or new.payout_id is distinct from old.payout_id) then
    raise exception 'Paid commissions require reversal entries, not edits';
 end if;
 return new;
end; $$;
create trigger luvipro_affiliate_validate_commission_before
 before insert or update on public.luvipro_affiliate_commissions
 for each row execute function public.luvipro_affiliate_validate_commission();
revoke execute on function public.luvipro_affiliate_validate_commission() from public,anon,authenticated;

-- Audit trail records administrative actions; no UPDATE/DELETE granted to clients.
create table if not exists public.luvipro_affiliate_audit (
 id bigint generated always as identity primary key,
 action text not null,
 entity_id uuid,
 details jsonb not null default '{}'::jsonb,
 actor_uid uuid,
 created_at timestamptz not null default now()
);
alter table public.luvipro_affiliate_audit enable row level security;
revoke all on public.luvipro_affiliate_audit from public,anon,authenticated;
grant select, insert on public.luvipro_affiliate_audit to authenticated;
grant select, insert on public.luvipro_affiliate_audit to service_role;
create policy affiliate_audit_admin_read on public.luvipro_affiliate_audit for select to authenticated using ((select public.is_admin()));
create policy affiliate_audit_admin_insert on public.luvipro_affiliate_audit for insert to authenticated with check ((select public.is_admin()));

-- Supplementary cash journal for transactions NOT already represented by an invoice
-- or supplier bill. Original invoices remain in their existing respective tables.
-- Append-only to prevent retroactive silent changes; corrections are new entries.
create table if not exists public.luvipro_billing_cash_events (
 id uuid primary key default gen_random_uuid(),
 event_date date not null,
 direction text not null check (direction in ('in','out')),
 category text not null check (category in (
  'other_sales','other_operating_cost','bank_fee','tax','refund',
  'capital','loan','loan_repayment','asset','affiliate','transfer','other'
 )),
 description text not null check (length(btrim(description)) between 3 and 500),
 counterparty text not null default '',
 payment_reference text not null default '',
 gross_cents bigint not null check (gross_cents >= 0),
 net_cents bigint not null check (net_cents >= 0),
 vat_cents bigint not null check (vat_cents >= 0),
 vat_rate smallint not null check (vat_rate in (0,7,19)),
 document_path text unique,
 created_at timestamptz not null default now(),
 constraint cash_event_tax_balance check (net_cents + vat_cents = gross_cents)
);
create index if not exists luvipro_billing_cash_events_date on public.luvipro_billing_cash_events(event_date,created_at desc);
alter table public.luvipro_billing_cash_events enable row level security;
revoke all on public.luvipro_billing_cash_events from public,anon,authenticated;
grant select,insert on public.luvipro_billing_cash_events to authenticated;
grant select,insert on public.luvipro_billing_cash_events to service_role;
create policy cash_events_admin_read on public.luvipro_billing_cash_events for select to authenticated using ((select public.is_admin()));
create policy cash_events_admin_insert on public.luvipro_billing_cash_events for insert to authenticated with check ((select public.is_admin()));
-- No authenticated UPDATE or DELETE: append a reversal entry instead.

-- Guard monthly settlement against invented/duplicate amounts and prevent
-- a payout being marked paid before the verified eligible commissions exist.
create or replace function public.luvipro_affiliate_validate_payout() returns trigger
language plpgsql set search_path = pg_catalog, public, pg_temp as $$
declare v_sum bigint; v_count integer;
begin
 if tg_op='UPDATE' and old.status='paid' and
    (new.status<>old.status or new.amount_cents<>old.amount_cents
     or new.payment_reference is distinct from old.payment_reference
     or new.paid_at is distinct from old.paid_at) then
  raise exception 'Paid payout batches are immutable; use compensating entries';
 end if;
 if new.status='paid' then
  select count(*),coalesce(sum(c.commission_cents),0) into v_count,v_sum
   from public.luvipro_affiliate_commissions c
   where c.payout_id=new.id and c.affiliate_id=new.affiliate_id
   and c.status in ('eligible','paid')
   and c.verified_paid_at is not null and c.delivered_at is not null
   and c.refunded_at is null and c.cancelled_at is null
   and now() >= greatest(c.delivered_at + interval '15 days',coalesce(c.return_deadline_at,c.delivered_at + interval '15 days'));
  if v_count=0 or v_sum<>new.amount_cents or new.amount_cents<=0 then
   raise exception 'Unverified payout amount or no eligible purchases';
  end if;
 end if;
 return new;
end; $$;
create trigger luvipro_affiliate_validate_payout_before
 before insert or update on public.luvipro_affiliate_payouts
 for each row execute function public.luvipro_affiliate_validate_payout();
revoke execute on function public.luvipro_affiliate_validate_payout() from public,anon,authenticated;
