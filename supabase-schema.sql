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

create index if not exists idx_portal_updates_created_at
  on public.portal_updates (created_at desc);

alter table public.portal_store enable row level security;
alter table public.portal_updates enable row level security;

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
exception
  when others then
    raise notice 'Skipped adding portal_store to supabase_realtime: %', sqlerrm;
end $$;
