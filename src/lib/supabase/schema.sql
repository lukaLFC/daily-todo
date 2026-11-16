-- ============ 1. PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  theme text not null default 'day' check (theme in ('day', 'night')),
  day_ends time not null default '05:00',
  daily_date date,                       -- the day the daily list is for (to detect a new day)
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read their own profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ============ 2. LISTS ============
create table public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  hue smallint check (hue between 0 and 359),      -- list colour, null = none
  position integer not null default 0,             -- order on the My lists page
  created_at timestamptz not null default now()
);

create index lists_owner_id_idx on public.lists (owner_id);
alter table public.lists enable row level security;

create policy "Owners manage their lists" on public.lists
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- ============ 3. TASKS ============
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  frequency_days integer not null default 0 check (frequency_days >= 0),  -- 0 = temporary task
  is_done boolean not null default false,
  is_selected boolean not null default false,       -- starred = on the daily list
  last_done date,
  prev_done date,                                   -- lets un-checking restore the old date
  done_by uuid references public.profiles (id) on delete set null,
  timer_minutes integer not null default 0 check (timer_minutes between 0 and 1440),  -- 0 = no timer
  timer_started_at timestamptz,                     -- set while the stopwatch runs
  timer_elapsed_ms bigint not null default 0 check (timer_elapsed_ms >= 0),
  timer_fired boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_list_id_idx on public.tasks (list_id);
alter table public.tasks enable row level security;

create policy "Owners manage tasks in their lists" on public.tasks
  for all to authenticated
  using (exists (
    select 1 from public.lists
    where lists.id = tasks.list_id and lists.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.lists
    where lists.id = tasks.list_id and lists.owner_id = (select auth.uid())
  ));

-- ============ 4. PERMISSIONS FOR LOGGED-IN USERS ============
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.lists, public.tasks to authenticated;

-- ============ 5. AUTO-CREATE A PROFILE AT SIGNUP ============
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',   -- email signup (our form)
      new.raw_user_meta_data ->> 'full_name',      -- Google
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 6. PROFILES FOR ACCOUNTS THAT ALREADY EXIST ============
insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name',
           raw_user_meta_data ->> 'name', split_part(email, '@', 1)),
  coalesce(raw_user_meta_data ->> 'avatar_url', raw_user_meta_data ->> 'picture')
from auth.users
on conflict (id) do nothing;

alter table public.profiles add column timezone text not null default 'UTC';