-- LUVIPRO: manually confirmed Affiliate payouts and persistent admin reminders.
-- STAGED MIGRATION. Apply in the SAME Supabase LUVIPRO project only AFTER
-- a verified fresh restore/backup and prior affiliate finance migrations.
-- This schema NEVER triggers actual bank, Stripe or PayPal transfers.
create table if not exists public.luvipro_affiliate_payment_reminders (
 payout_id uuid primary key references public.luvipro_affiliate_payouts(id) on delete restrict,
 remind_on date not null,
 note text not null default '' check (length(note) <= 300),
 status text not null default 'open' check (status in ('open','cleared')),
 last_set_by_uid uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 cleared_at timestamptz,
 constraint reminder_state_consistent check (
   (status='open' and cleared_at is null) or
   (status='cleared' and cleared_at is not null)
 )
);
create index if not exists luvipro_affiliate_payment_reminders_due_idx
  on public.luvipro_affiliate_payment_reminders(remind_on,payout_id)
  where status='open';
alter table public.luvipro_affiliate_payment_reminders enable row level security;
revoke all on public.luvipro_affiliate_payment_reminders from public,anon,authenticated;
grant select on public.luvipro_affiliate_payment_reminders to authenticated;
grant select,insert,update on public.luvipro_affiliate_payment_reminders to service_role;
create policy luvipro_affiliate_reminders_admin_read
 on public.luvipro_affiliate_payment_reminders for select to authenticated
 using ((select public.is_admin()));

-- A reminder can only be scheduled for an unpaid, prepared payout.
-- It never creates, approves, issues or executes a financial transfer.
create or replace function public.luvipro_affiliate_set_payment_reminder(
 p_payout uuid,p_date date,p_note text,p_actor uuid
) returns void language plpgsql security invoker
 set search_path=pg_catalog,public,pg_temp as $$
declare v_status text;
begin
 if p_date is null or p_date<current_date or p_date>current_date+365
   or p_note is null or length(p_note)>300 then
   raise exception 'Invalid reminder date or note';
 end if;
 if not exists(select 1 from auth.users where id=p_actor) then
   raise exception 'Invalid administrator';
 end if;
 select status into v_status
   from public.luvipro_affiliate_payouts where id=p_payout for update;
 if not found or v_status<>'prepared' then
   raise exception 'Only unpaid prepared payouts can have payment reminders';
 end if;
 insert into public.luvipro_affiliate_payment_reminders
   (payout_id,remind_on,note,status,last_set_by_uid,cleared_at)
 values(p_payout,p_date,p_note,'open',p_actor,null)
 on conflict(payout_id) do update
   set remind_on=excluded.remind_on,note=excluded.note,status='open',
       last_set_by_uid=excluded.last_set_by_uid,cleared_at=null,updated_at=now();
 insert into public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
 values('manual_transfer_reminder_set',p_payout,p_actor,
   jsonb_build_object('due_date',p_date,'note',p_note));
end; $$;
revoke execute on function public.luvipro_affiliate_set_payment_reminder(uuid,date,text,uuid)
 from public,anon,authenticated;
grant execute on function public.luvipro_affiliate_set_payment_reminder(uuid,date,text,uuid)
 to service_role;

-- Clear a reminder automatically only when an ADMIN has recorded an
-- externally executed bank transfer and payout status reaches 'paid'.
create or replace function public.luvipro_affiliate_clear_payment_reminder()
returns trigger language plpgsql
 set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.status='paid' and old.status is distinct from 'paid' then
   update public.luvipro_affiliate_payment_reminders
    set status='cleared',cleared_at=now(),updated_at=now()
    where payout_id=new.id and status='open';
 end if;
 return new;
end; $$;
drop trigger if exists luvipro_affiliate_reminder_paid on public.luvipro_affiliate_payouts;
create trigger luvipro_affiliate_reminder_paid
 after update of status on public.luvipro_affiliate_payouts
 for each row when (new.status='paid')
 execute function public.luvipro_affiliate_clear_payment_reminder();
revoke execute on function public.luvipro_affiliate_clear_payment_reminder()
 from public,anon,authenticated;
-- Never automatically send funds; this table is a backoffice reminder only.
