-- STAGED, ADDITIVE. Apply AFTER docs/sql/affiliate-accounting-extension.sql
-- Only after a fresh verified database backup and local RLS/trigger tests.
-- Does not touch existing customer/workshop profiles, auth identities or previous invoices.
alter table public.luvipro_discount_codes
  add column if not exists version integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();
create or replace function public.luvipro_discount_code_change_audit()
returns trigger language plpgsql set search_path = pg_catalog,public,pg_temp as $$
begin
  if new.affiliate_id is distinct from old.affiliate_id then
   raise exception 'Changing affiliate identity is forbidden; create a new code instead';
  end if;
  if new.code is distinct from old.code and
     (old.redemption_count > 0 or exists
       (select 1 from public.luvipro_affiliate_commissions c where c.code_id=old.id)) then
    raise exception 'Previously redeemed coupon identifier cannot change';
  end if;
  if old.redemption_count>0 and new.valid_from is distinct from old.valid_from then
    raise exception 'Start date of already used code cannot change';
  end if;
  new.version := old.version + 1;
  new.updated_at := now();
  insert into public.luvipro_affiliate_audit(action,entity_id,actor_uid,details)
    values ('code_updated',new.id,auth.uid(),jsonb_build_object(
      'previous',jsonb_build_object('code',old.code,'active',old.active,
        'discount_bps',old.discount_bps,'commission_bps',old.commission_bps,
        'valid_from',old.valid_from,'valid_until',old.valid_until,'usage_limit',old.usage_limit),
      'new',jsonb_build_object('code',new.code,'active',new.active,
        'discount_bps',new.discount_bps,'commission_bps',new.commission_bps,
        'valid_from',new.valid_from,'valid_until',new.valid_until,'usage_limit',new.usage_limit)
    ));
  return new;
end; $$;
drop trigger if exists luvipro_discount_code_update_audit on public.luvipro_discount_codes;
create trigger luvipro_discount_code_update_audit before update
 on public.luvipro_discount_codes for each row
 execute function public.luvipro_discount_code_change_audit();
revoke execute on function public.luvipro_discount_code_change_audit() from public,anon,authenticated;
-- Any commission already attributed retains its original, immutable commission_cents.
-- Never retroactively rewrite historical attributed sales, payouts or invoices.
