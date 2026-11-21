-- Kharcha additive platform migration. Safe to run against existing Kharcha databases.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  college_name text,
  profile_photo_url text,
  monthly_allowance numeric(12,2) check (monthly_allowance >= 0),
  currency text not null default 'INR',
  role text not null default 'student' check (role in ('student','admin')),
  language text not null default 'en' check (language in ('en','hi')),
  theme text not null default 'light' check (theme in ('light','dark')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.expenses add column if not exists merchant text;
alter table public.expenses add column if not exists category text;
alter table public.expenses add column if not exists amount numeric(12,2);
alter table public.expenses add column if not exists day integer;
alter table public.expenses add column if not exists source text;
alter table public.expenses add column if not exists transaction_date date;
alter table public.expenses add column if not exists payment_method text default 'UPI';
alter table public.expenses add column if not exists description text;
alter table public.expenses add column if not exists receipt_path text;

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  source text not null,
  description text,
  income_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, month, category)
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(12,2) not null check (target_amount > 0),
  target_date date,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  contribution_date date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table if not exists public.group_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  paid_by uuid not null references public.group_members(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  split_type text not null default 'equal' check (split_type in ('equal','custom')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.group_expenses(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  unique(expense_id, member_id)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_member uuid not null references public.group_members(id) on delete cascade,
  to_member uuid not null references public.group_members(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  settled_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  merchant text,
  amount numeric(12,2),
  receipt_date date,
  status text not null default 'review' check (status in ('review','saved','failed')),
  expense_id uuid references public.expenses(id) on delete set null,
  raw_ocr text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  payment_method text not null default 'UPI',
  recurrence text not null check (recurrence in ('daily','weekly','monthly','yearly')),
  next_due_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null check (amount > 0),
  billing_frequency text not null check (billing_frequency in ('monthly','yearly')),
  next_payment_date date not null,
  payment_method text not null default 'UPI',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  reminder_date date not null,
  reminder_type text not null default 'payment',
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financial_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) check (target_amount >= 0),
  start_date date not null default current_date,
  end_date date not null,
  progress numeric(12,2) not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null,
  completed boolean not null default false,
  quiz_score integer check (quiz_score between 0 and 100),
  completed_at timestamptz,
  unique(user_id, lesson_key)
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text,
  type text not null check (type in ('bug','feature','feedback','help')),
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on public.expenses(user_id, transaction_date);
create index if not exists incomes_user_date_idx on public.incomes(user_id, income_date);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at);

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_contributions enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_expenses enable row level security;
alter table public.group_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.receipts enable row level security;
alter table public.notifications enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.calendar_reminders enable row level security;
alter table public.financial_challenges enable row level security;
alter table public.learning_progress enable row level security;
alter table public.support_requests enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_group_member(target_group uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.groups g where g.id = target_group and g.created_by = auth.uid())
  or exists(select 1 from public.group_members m where m.group_id = target_group and m.user_id = auth.uid());
$$;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());

drop policy if exists "expenses owner" on public.expenses;
create policy "expenses owner" on public.expenses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "incomes owner" on public.incomes;
create policy "incomes owner" on public.incomes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "budgets owner" on public.budgets;
create policy "budgets owner" on public.budgets for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "goals owner" on public.savings_goals;
create policy "goals owner" on public.savings_goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "contributions owner" on public.savings_contributions;
create policy "contributions owner" on public.savings_contributions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "receipts owner" on public.receipts;
create policy "receipts owner" on public.receipts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications owner" on public.notifications;
create policy "notifications owner" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "recurring owner" on public.recurring_expenses;
create policy "recurring owner" on public.recurring_expenses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "subscriptions owner" on public.subscriptions;
create policy "subscriptions owner" on public.subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "reminders owner" on public.calendar_reminders;
create policy "reminders owner" on public.calendar_reminders for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "challenges owner" on public.financial_challenges;
create policy "challenges owner" on public.financial_challenges for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "learning owner" on public.learning_progress;
create policy "learning owner" on public.learning_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "support requester" on public.support_requests;
create policy "support requester" on public.support_requests for insert
with check (user_id is null or user_id = auth.uid());
drop policy if exists "support requester read" on public.support_requests;
create policy "support requester read" on public.support_requests for select
using (user_id = auth.uid() or public.is_admin());

-- Group policies use membership rather than exposing private rows.
drop policy if exists "groups member read" on public.groups;
create policy "groups member read" on public.groups for select using (
  public.is_group_member(groups.id)
);
drop policy if exists "groups creator write" on public.groups;
create policy "groups creator write" on public.groups for all using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "group members read" on public.group_members;
create policy "group members read" on public.group_members for select using (
  public.is_group_member(group_members.group_id)
);
drop policy if exists "group member create" on public.group_members;
create policy "group member create" on public.group_members for all using (
  exists(select 1 from public.groups g where g.id = group_members.group_id and g.created_by = auth.uid())
) with check (
  exists(select 1 from public.groups g where g.id = group_members.group_id and g.created_by = auth.uid())
);

drop policy if exists "group expenses member read" on public.group_expenses;
create policy "group expenses member read" on public.group_expenses for select using (
  public.is_group_member(group_expenses.group_id)
);
drop policy if exists "group expenses creator write" on public.group_expenses;
create policy "group expenses creator write" on public.group_expenses for all using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "group splits member read" on public.group_splits;
create policy "group splits member read" on public.group_splits for select using (
  exists (
    select 1 from public.group_expenses e
    where e.id = group_splits.expense_id and public.is_group_member(e.group_id)
  )
);
drop policy if exists "group splits expense creator write" on public.group_splits;
create policy "group splits expense creator write" on public.group_splits for all
using (
  exists (
    select 1 from public.group_expenses e
    where e.id = group_splits.expense_id and e.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.group_expenses e
    where e.id = group_splits.expense_id and e.created_by = auth.uid()
      and public.is_group_member(e.group_id)
  )
);
drop policy if exists "settlements member read" on public.settlements;
create policy "settlements member read" on public.settlements for select using (
  public.is_group_member(settlements.group_id)
);
drop policy if exists "settlements creator write" on public.settlements;
create policy "settlements creator write" on public.settlements for all
using (created_by = auth.uid() and public.is_group_member(settlements.group_id))
with check (created_by = auth.uid() and public.is_group_member(settlements.group_id));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, college_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'college_name',
          case when new.raw_user_meta_data->>'account_type' = 'admin' then 'student' else 'student' end)
  on conflict(id) do update set
    full_name = excluded.full_name,
    college_name = excluded.college_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into storage.buckets(id, name, public)
values ('receipts', 'receipts', false)
on conflict(id) do nothing;

drop policy if exists "receipt owner upload" on storage.objects;
create policy "receipt owner upload" on storage.objects for insert
with check (bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "receipt owner read" on storage.objects;
create policy "receipt owner read" on storage.objects for select
using (bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "receipt owner delete" on storage.objects;
create policy "receipt owner delete" on storage.objects for delete
using (bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.prevent_profile_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end;
  return new;
end;
$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

