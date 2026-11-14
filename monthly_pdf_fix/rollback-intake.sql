begin;
lock table public.luvipro_invoice_intake, public.luvipro_invoice_intake_review
  in access exclusive mode;
do $$
begin
  if exists (select 1 from public.luvipro_invoice_intake)
     or exists (select 1 from public.luvipro_invoice_intake_review) then
    raise exception 'Intake contains records. Disable the endpoint and preserve the archive.';
  end if;
end
$$;
drop table public.luvipro_invoice_intake_review;
drop table public.luvipro_invoice_intake;
commit;

