-- Hosted dashboard (outreach.goocampusglobal.com): signed-in viewers read published dashboard snapshots.
-- `outreach publish` (service role) writes one row per batch plus 'all'; the web page reads them with the viewer's
-- session. Viewers are the addresses in dashboard_viewers (synced from config/dashboard-viewers.json by
-- `outreach viewers`). The prospect tables keep RLS with no policies: the browser never reads them directly.
-- Rollback: drop table dashboards, dashboard_viewers; drop function private.is_dashboard_viewer; drop schema private.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table dashboard_viewers (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table dashboards (
  batch text primary key,
  label text not null,
  data jsonb not null,
  published_at timestamptz not null default now()
);

alter table dashboard_viewers enable row level security;
alter table dashboards enable row level security;

-- A viewer is a signed-in user whose confirmed email is on the list. Lives outside the exposed schemas so it cannot
-- be called over the REST API; security definer so the policy can read auth.users and the viewer list.
create function private.is_dashboard_viewer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from auth.users u
    join public.dashboard_viewers v on v.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.is_dashboard_viewer() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_dashboard_viewer() to authenticated;

create policy "viewers read dashboards" on dashboards
  for select to authenticated using ((select private.is_dashboard_viewer()));

revoke all on dashboards, dashboard_viewers from anon, authenticated;
grant select on dashboards to authenticated;
grant select, insert, update, delete on dashboards, dashboard_viewers to service_role;
