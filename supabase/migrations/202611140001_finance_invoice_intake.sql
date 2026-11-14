begin;

-- Intake metadata is separate from approved expenses and issued invoices.
-- Keep original bytes in the existing private accounting bucket.
create table public.luvipro_invoice_intake (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique check (
    object_path ~ '^intake/[0-9a-f]{64}\.(xml|pdf)$'
  ),
  sha256 text not null unique check (sha256 ~ '^[0-9a-f]{64}$'),
  byte_length integer not null check (byte_length between 1 and 5242880),
  received_at timestamptz not null default now(),
  received_by uuid not null,
  check (object_path like 'intake/' || sha256 || '.%')
);

create table public.luvipro_invoice_intake_review (
  id bigint generated always as identity primary key,
  intake_id uuid not null references public.luvipro_invoice_intake(id),
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null,
  decision text not null check (decision in ('needs_review', 'rejected')),
  note text not null check (length(btrim(note)) between 1 and 2000)
);

alter table public.luvipro_invoice_intake enable row level security;
alter table public.luvipro_invoice_intake_review enable row level security;
revoke all on public.luvipro_invoice_intake, public.luvipro_invoice_intake_review
  from public, anon, authenticated, service_role;
grant select, insert on public.luvipro_invoice_intake, public.luvipro_invoice_intake_review
  to service_role;
grant usage on sequence public.luvipro_invoice_intake_review_id_seq to service_role;

commit;

