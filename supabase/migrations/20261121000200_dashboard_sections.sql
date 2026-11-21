alter table public.incomes
  add column if not exists category text not null default 'Other';

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;

create table if not exists public.user_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  icon text not null default '📦',
  created_at timestamptz not null default now(),
  unique (user_id, type, name)
);

alter table public.user_categories enable row level security;

drop policy if exists "user categories owner" on public.user_categories;
create policy "user categories owner" on public.user_categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
