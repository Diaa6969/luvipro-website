-- STAGED ONLY. Requires all affiliate/accounting/manual/reminder dependencies.
-- Do not deploy without a complete verified PostgreSQL/Auth/Storage backup.
-- Guarded adapters for the ORIGINAL FlutterFlow Admin Center. No transfer API.
-- Actor identity always derives from the verified Auth session, never the client.
revoke insert,update,delete on public.luvipro_affiliate_payouts,
 public.luvipro_affiliate_commissions from authenticated;
-- A case/whitespace variant must not record the same bank reference twice.
create unique index if not exists luvipro_affiliate_transfer_reference_normalized
 on public.luvipro_affiliate_manual_transfers(lower(btrim(bank_reference)));

alter table public.luvipro_affiliate_commissions
 add column if not exists commission_rate_bps integer
 check (commission_rate_bps between 0 and 10000);
-- No guessed backfill of historic contract rates.
create or replace function public.luvipro_affiliate_commission_snapshot_v1()
returns trigger language plpgsql set search_path='' as $$
declare c public.luvipro_discount_codes%rowtype;
begin
 if tg_op='INSERT' then
  select * into c from public.luvipro_discount_codes where id=new.code_id;
  if not found or c.affiliate_id<>new.affiliate_id then raise exception 'Invalid attributed code'; end if;
  new.commission_rate_bps:=c.commission_bps;
  -- Percentage of NET SELLING PRICE AFTER DISCOUNT = agreed TOTAL payout.
  new.commission_cents:=floor((new.net_after_discount_cents::numeric*c.commission_bps+5000)/10000)::bigint;
 elsif tg_op='DELETE' then
  if old.status='paid' then raise exception 'Paid commission is immutable'; end if;
  return old;
 elsif (old.status='paid' and to_jsonb(new) is distinct from to_jsonb(old)) or
   new.affiliate_id is distinct from old.affiliate_id or new.code_id is distinct from old.code_id or
   new.source_type is distinct from old.source_type or new.source_order_id is distinct from old.source_order_id or
   new.net_after_discount_cents is distinct from old.net_after_discount_cents or
   new.commission_cents is distinct from old.commission_cents or
   new.commission_rate_bps is distinct from old.commission_rate_bps then
  raise exception 'Attributed commission snapshot is immutable; use a corrective entry';
 end if;
 return new;
end $$;
create trigger luvipro_commission_snapshot_v1 before insert or update or delete
 on public.luvipro_affiliate_commissions for each row
 execute function public.luvipro_affiliate_commission_snapshot_v1();
revoke all on function public.luvipro_affiliate_commission_snapshot_v1() from public,anon,authenticated;

create or replace function public.luvipro_affiliate_admin_set_reminder_v1(
 p_payout uuid,p_date date,p_note text
) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.is_admin() is not true then
  raise exception 'Admin required' using errcode='42501';
 end if;
 perform public.luvipro_affiliate_set_payment_reminder(p_payout,p_date,p_note,auth.uid());
end $$;

create or replace function public.luvipro_affiliate_admin_confirm_transfer_v1(
 p_payout uuid,p_reference text,p_paid_on date,
 p_transfer_done boolean,p_evidence_checked boolean
) returns uuid language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or public.is_admin() is not true then
  raise exception 'Admin required' using errcode='42501';
 end if;
 if p_transfer_done is not true or p_evidence_checked is not true then
  raise exception 'Explicit external transfer and evidence confirmation required' using errcode='22023';
 end if;
 return public.luvipro_affiliate_record_manual_transfer(p_payout,p_reference,p_paid_on,auth.uid());
end $$;

create or replace function public.luvipro_affiliate_admin_settlements_v1(p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or public.is_admin() is not true then
  raise exception 'Admin required' using errcode='42501';
 end if;
 if p_offset is null or p_offset<0 or p_offset>100000 then raise exception 'Invalid offset'; end if;
 select jsonb_build_object('items',coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb),
 'has_more',(select count(*)>p_offset+100 from public.luvipro_affiliate_payouts)) into result
 from (
  select p.id,p.affiliate_id,a.company_name,p.payout_month,p.status,p.amount_cents::text amount_cents,
   p.paid_at,p.payment_reference,d.id document_id,d.document_number,
   d.net_cents::text net_cents,d.vat_cents::text vat_cents,d.gross_cents::text gross_cents,d.vat_mode,d.vat_rate,
   r.remind_on,r.note reminder_note,r.status reminder_status,
   case when r.status='open' and r.remind_on<=current_date then 0
        when r.status='open' then 1 when p.status='prepared' then 2 else 3 end priority
  from public.luvipro_affiliate_payouts p
  join public.luvipro_affiliate_applications a on a.id=p.affiliate_id
  left join public.luvipro_affiliate_settlement_documents d on d.payout_id=p.id
  left join public.luvipro_affiliate_payment_reminders r on r.payout_id=p.id
  order by priority,r.remind_on nulls last,p.payout_month desc,p.id
  limit 100 offset p_offset
 ) q;
 return result;
end $$;

revoke all on function public.luvipro_affiliate_admin_set_reminder_v1(uuid,date,text),
 public.luvipro_affiliate_admin_confirm_transfer_v1(uuid,text,date,boolean,boolean),
 public.luvipro_affiliate_admin_settlements_v1(integer) from public,anon;
grant execute on function public.luvipro_affiliate_admin_set_reminder_v1(uuid,date,text),
 public.luvipro_affiliate_admin_confirm_transfer_v1(uuid,text,date,boolean,boolean),
 public.luvipro_affiliate_admin_settlements_v1(integer) to authenticated;

-- Containment rollback: REVOKE these three EXECUTEs from authenticated.
-- Keep the restricted grants, ledger, reminders and immutable evidence intact.
-- Do not restore direct payout/commission writes or delete financial records.
