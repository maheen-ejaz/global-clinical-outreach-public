-- Phase 1 prospect research schema for US clinical program providers.
-- RLS is enabled on every table with no policies: only the service role (pipeline) can read/write.
-- Phase 2 (CRM) adds authenticated-team policies and outreach tables.

create type provider_type as enum ('academic', 'community', 'private_usce', 'fellowship');
create type program_type as enum ('observership', 'elective', 'externship', 'fellowship', 'research', 'other');
create type program_audience as enum ('students', 'graduates', 'both', 'unknown');
create type role_tier as enum ('decision_maker', 'coordinator', 'other');
create type email_kind as enum ('published', 'pattern_guess', 'generic_inbox');
create type email_status as enum ('unchecked', 'valid', 'catch_all', 'unknown', 'invalid');
create type email_confidence as enum ('high', 'medium', 'low');
create type duplicate_status as enum ('clear', 'possible', 'confirmed');

create function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider_type provider_type not null,
  website text not null,
  domain text not null unique check (domain = lower(domain)),
  street text,
  city text,
  state text,
  zip text,
  main_phone text,
  fax text,
  general_inbox text,
  contact_form_url text,
  ownership_type text,
  health_system text,
  university_affiliation text,
  year_founded int,
  bed_count int,
  residency_program_count int,
  accreditations text[] not null default '{}',
  rankings_awards text,
  centres_of_excellence text[] not null default '{}',
  locations text[] not null default '{}',
  timezone text,
  international_office boolean,
  social_links jsonb not null default '{}',
  mission text,
  accepts_imgs boolean,
  img_requirements text,
  marketplace_listings text[] not null default '{}',
  img_friendliness_score smallint check (img_friendliness_score between 0 and 5),
  price_band text,
  site_freshness text,
  pitch_angle text,
  priority_score smallint check (priority_score between 1 and 3),
  duplicate_status duplicate_status not null default 'clear',
  details jsonb not null default '{}',
  field_sources jsonb not null default '{}',
  discovery_source text,
  batch text not null,
  scraped_at timestamptz,
  researched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table programs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  type program_type not null default 'other',
  specialties text[] not null default '{}',
  audience program_audience not null default 'unknown',
  duration text,
  seats text,
  application_fee text,
  program_fee text,
  refund_policy text,
  payment_terms text,
  usmle_min text,
  grad_year_limit text,
  english_test text,
  compliance_reqs text,
  visa_types text[] not null default '{}',
  housing_help text,
  certificate_or_lor text,
  schedule text,
  hands_on boolean,
  virtual_option boolean,
  application_window text,
  required_documents text,
  apply_url text,
  outcomes text,
  page_last_updated text,
  details jsonb not null default '{}',
  source_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create table people (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  full_name text not null,
  credentials text,
  title text,
  department text,
  role_tier role_tier not null default 'other',
  is_outreach_target boolean not null default false,
  direct_phone text,
  office_location text,
  bio_snippet text,
  is_img boolean,
  research_interests text,
  tenure text,
  linkedin_url text,
  linkedin_verified boolean not null default false,
  email_resolved_at timestamptz,
  source_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, full_name)
);

create table emails (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  person_id uuid references people (id) on delete cascade,
  address text not null unique check (address = lower(address)),
  kind email_kind not null,
  pattern_used text,
  status email_status not null default 'unchecked',
  provider_status text,
  confidence email_confidence,
  checked_at timestamptz,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table news_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  headline text not null,
  published_on date,
  url text not null,
  created_at timestamptz not null default now(),
  unique (org_id, url)
);

create table pages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  url text not null unique,
  page_kind text,
  storage_path text not null,
  content_hash text not null,
  credits_used int not null default 0,
  scraped_at timestamptz not null default now()
);

create table pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  batch text not null,
  step text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  orgs_processed int not null default 0,
  firecrawl_credits int not null default 0,
  reoon_checks int not null default 0,
  errors jsonb not null default '[]'
);

create index organizations_batch_idx on organizations (batch);
create index programs_org_id_idx on programs (org_id);
create index people_org_id_idx on people (org_id);
create index emails_org_id_idx on emails (org_id);
create index emails_person_id_idx on emails (person_id);
create index news_items_org_id_idx on news_items (org_id);
create index pages_org_id_idx on pages (org_id);

create trigger organizations_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger programs_updated_at before update on programs
  for each row execute function set_updated_at();
create trigger people_updated_at before update on people
  for each row execute function set_updated_at();
create trigger emails_updated_at before update on emails
  for each row execute function set_updated_at();

alter table organizations enable row level security;
alter table programs enable row level security;
alter table people enable row level security;
alter table emails enable row level security;
alter table news_items enable row level security;
alter table pages enable row level security;
alter table pipeline_runs enable row level security;

grant select, insert, update, delete on all tables in schema public to service_role;

-- Private bucket for cached raw page markdown (service role only).
insert into storage.buckets (id, name, public) values ('raw-pages', 'raw-pages', false)
  on conflict (id) do nothing;
