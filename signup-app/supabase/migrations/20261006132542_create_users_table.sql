-- 1. Create the table
create table public.user_table (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  created_at  timestamptz not null default now()
);
 
-- 2. Turn on Row Level Security (RLS)
alter table public.user_table enable row level security;
 
-- 3. Policy: a signed-in user may insert ONLY their own row
create policy "Users can insert their own row"
  on public.user_table
  for insert
  to authenticated
  with check (auth.uid() = id);
 
-- 4. Policy: a signed-in user may read ONLY their own row
create policy "Users can view their own row"
  on public.user_table
  for select
  to authenticated
  using (auth.uid() = id);
 
-- 5. Allow the API roles to use the table (RLS still applies)
grant select, insert on public.user_table to authenticated;