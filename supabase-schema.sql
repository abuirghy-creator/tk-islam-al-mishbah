-- ============================================================================
-- TK Islam Al Mishbah - Supabase Cloud Persistence & Real-Time Schema
-- Jalankan SQL ini satu kali di Supabase Dashboard -> SQL Editor -> New Query
-- ============================================================================

create table if not exists public.portal_store (
  id text primary key,
  store_id text not null,
  published_version integer not null default 0,
  last_published_at timestamptz,
  published_by text,
  publish_note text,
  draft_version integer not null default 0,
  last_draft_saved_at timestamptz,
  draft_saved_by text,
  last_action_label text,
  published_snapshot jsonb,
  draft_snapshot jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_updates (
  id bigint generated always as identity primary key,
  store_id text not null,
  version integer not null,
  action_label text not null,
  saved_by text not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_accounts (
  id text primary key,
  username text not null,
  password text not null default 'password123',
  name text not null,
  role text not null,
  avatar_url text,
  email text,
  phone text,
  is_owner boolean not null default false,
  is_principal boolean not null default false,
  related_teacher_id text,
  related_staff_id text,
  related_student_id text,
  position text,
  updated_at timestamptz not null default now()
);

create table if not exists public.work_schedules (
  category text primary key,
  schedule jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.student_attendance (
  id text primary key,
  student_id text not null,
  student_name text not null,
  class_name text not null,
  date text not null,
  time text not null,
  status text not null,
  method text not null,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_attendance (
  id text primary key,
  teacher_id text not null,
  teacher_name text not null,
  date text not null,
  time text not null,
  check_out_time text,
  status text not null,
  notes text,
  check_out_early boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_portal_accounts_username_lower
  on public.portal_accounts (lower(username));

create index if not exists idx_portal_updates_created_at
  on public.portal_updates (created_at desc);

create index if not exists idx_student_attendance_date
  on public.student_attendance (date desc);

create index if not exists idx_teacher_attendance_date
  on public.teacher_attendance (date desc);

alter table public.portal_store enable row level security;
alter table public.portal_updates enable row level security;
alter table public.portal_accounts enable row level security;
alter table public.work_schedules enable row level security;
alter table public.student_attendance enable row level security;
alter table public.teacher_attendance enable row level security;

drop policy if exists "portal_store_read_all" on public.portal_store;
create policy "portal_store_read_all"
  on public.portal_store
  for select
  to anon, authenticated
  using (true);

drop policy if exists "portal_store_insert_all" on public.portal_store;
create policy "portal_store_insert_all"
  on public.portal_store
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "portal_store_update_all" on public.portal_store;
create policy "portal_store_update_all"
  on public.portal_store
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "portal_updates_read_all" on public.portal_updates;
create policy "portal_updates_read_all"
  on public.portal_updates
  for select
  to anon, authenticated
  using (true);

drop policy if exists "portal_updates_insert_all" on public.portal_updates;
create policy "portal_updates_insert_all"
  on public.portal_updates
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "portal_accounts_read_all" on public.portal_accounts;
create policy "portal_accounts_read_all"
  on public.portal_accounts
  for select
  to anon, authenticated
  using (true);

drop policy if exists "portal_accounts_insert_all" on public.portal_accounts;
create policy "portal_accounts_insert_all"
  on public.portal_accounts
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "portal_accounts_update_all" on public.portal_accounts;
create policy "portal_accounts_update_all"
  on public.portal_accounts
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "portal_accounts_delete_all" on public.portal_accounts;
create policy "portal_accounts_delete_all"
  on public.portal_accounts
  for delete
  to anon, authenticated
  using (true);

drop policy if exists "work_schedules_all" on public.work_schedules;
create policy "work_schedules_all"
  on public.work_schedules
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "student_attendance_all" on public.student_attendance;
create policy "student_attendance_all"
  on public.student_attendance
  for all
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "teacher_attendance_all" on public.teacher_attendance;
create policy "teacher_attendance_all"
  on public.teacher_attendance
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.portal_store to anon, authenticated;
grant select, insert, update on public.portal_updates to anon, authenticated;
grant select, insert, update, delete on public.portal_accounts to anon, authenticated;
grant select, insert, update, delete on public.work_schedules to anon, authenticated;
grant select, insert, update, delete on public.student_attendance to anon, authenticated;
grant select, insert, update, delete on public.teacher_attendance to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'portal_store'
  ) then
    alter publication supabase_realtime add table public.portal_store;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'portal_accounts'
  ) then
    alter publication supabase_realtime add table public.portal_accounts;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'student_attendance'
  ) then
    alter publication supabase_realtime add table public.student_attendance;
  end if;
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'teacher_attendance'
  ) then
    alter publication supabase_realtime add table public.teacher_attendance;
  end if;
exception
  when others then
    raise notice 'Skipped adding tables to supabase_realtime: %', sqlerrm;
end $$;
