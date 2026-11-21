alter table public.incomes
  add column if not exists payment_method text not null default 'UPI';
