-- Additive JobBridge pipeline schema. Existing SelectReady tables are untouched.
create table if not exists public.jobbridge_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in ('employer','government','rss','greenhouse','lever','manual')),
  source_url text not null unique,
  terms_url text,
  is_active boolean not null default true,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobbridge_companies
  add column if not exists website_url text,
  add column if not exists description text;

update public.jobbridge_companies
set website_url = website
where website_url is null and website is not null;

alter table public.jobbridge_jobs
  add column if not exists description text,
  add column if not exists employment_type text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists apply_url text,
  add column if not exists expires_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists content_hash text,
  add column if not exists external_id text,
  add column if not exists verification_status text not null default 'pending',
  add column if not exists verified_at timestamptz,
  add column if not exists last_checked_at timestamptz,
  add column if not exists source_id uuid references public.jobbridge_sources(id) on delete set null;

alter table public.jobbridge_jobs
  drop constraint if exists jobbridge_jobs_verification_status_check;
alter table public.jobbridge_jobs
  add constraint jobbridge_jobs_verification_status_check
  check (verification_status in ('pending','verified','rejected','expired'));

create unique index if not exists jobbridge_jobs_source_url_uidx on public.jobbridge_jobs(source_url);
create unique index if not exists jobbridge_jobs_source_external_uidx on public.jobbridge_jobs(source_id, external_id) where source_id is not null and external_id is not null;
create index if not exists jobbridge_jobs_public_freshness_idx on public.jobbridge_jobs(status, verification_status, posted_at desc);
create index if not exists jobbridge_jobs_expiry_idx on public.jobbridge_jobs(expires_at);

create table if not exists public.jobbridge_articles (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.jobbridge_jobs(id) on delete cascade,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body_markdown text not null,
  seo_title text,
  seo_description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobbridge_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.jobbridge_sources(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check (status in ('running','succeeded','partial','failed')),
  found_count integer not null default 0,
  inserted_count integer not null default 0,
  rejected_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.jobbridge_video_queue (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobbridge_jobs(id) on delete cascade,
  platform text not null check (platform in ('youtube_shorts','instagram_reels')),
  title text not null,
  script text not null,
  caption text not null,
  hashtags text[] not null default '{}',
  storyboard jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved','rendering','ready','published','failed')),
  provider_job_id text,
  published_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, platform)
);

create table if not exists public.jobbridge_apply_clicks (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobbridge_jobs(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent_hash text,
  source_campaign text
);

alter table public.jobbridge_sources enable row level security;
alter table public.jobbridge_articles enable row level security;
alter table public.jobbridge_ingestion_runs enable row level security;
alter table public.jobbridge_video_queue enable row level security;
alter table public.jobbridge_apply_clicks enable row level security;

drop policy if exists "Public can read active jobs" on public.jobbridge_jobs;
create policy "Public can read verified active jobs" on public.jobbridge_jobs for select to anon, authenticated
using (status = 'active' and verification_status = 'verified' and source_url is not null and apply_url is not null and (expires_at is null or expires_at > now()));

drop policy if exists "Public can read companies for active jobs" on public.jobbridge_companies;
create policy "Public can read companies for verified jobs" on public.jobbridge_companies for select to anon, authenticated
using (exists (select 1 from public.jobbridge_jobs j where j.company_id = jobbridge_companies.id and j.status = 'active' and j.verification_status = 'verified' and (j.expires_at is null or j.expires_at > now())));

drop policy if exists "Public can read published job guides" on public.jobbridge_articles;
create policy "Public can read published job guides" on public.jobbridge_articles for select to anon, authenticated using (status = 'published');

drop policy if exists "Public can record apply clicks for verified jobs" on public.jobbridge_apply_clicks;
create policy "Public can record apply clicks for verified jobs" on public.jobbridge_apply_clicks for insert to anon, authenticated
with check (exists (select 1 from public.jobbridge_jobs j where j.id = jobbridge_apply_clicks.job_id and j.status = 'active' and j.verification_status = 'verified' and (j.expires_at is null or j.expires_at > now())));

grant select on public.jobbridge_jobs to anon, authenticated;
grant select on public.jobbridge_companies to anon, authenticated;
grant select on public.jobbridge_articles to anon, authenticated;
grant insert on public.jobbridge_apply_clicks to anon, authenticated;
