create table public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  merchant text not null default 'Demo Shop',
  merchant_reference text,
  return_url text not null,
  webhook_url text,
  currency text not null default 'USD',
  amount numeric(12,2) not null check (amount >= 0),
  items jsonb not null default '[]'::jsonb,
  customer jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

grant all on public.payment_sessions to service_role;

alter table public.payment_sessions enable row level security;

create policy "service role manages payment sessions"
  on public.payment_sessions for all
  to service_role
  using (true) with check (true);

create index payment_sessions_created_at_idx on public.payment_sessions (created_at desc);