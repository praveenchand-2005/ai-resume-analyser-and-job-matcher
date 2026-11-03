create extension if not exists pgcrypto;

create table if not exists public.candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  target_role text,
  education_level text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.candidate_resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My resume',
  target_role text,
  content jsonb not null default '{}'::jsonb,
  extracted_text text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  company_name text,
  description text not null,
  source_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.candidate_resumes(id) on delete cascade,
  job_target_id uuid not null references public.job_targets(id) on delete cascade,
  alignment_score integer not null check (alignment_score between 0 and 100),
  analysis jsonb not null,
  model_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  interview_type text not null check (interview_type in ('technical','hr','behavioral','sql','python','project')),
  experience_level text not null default 'fresher',
  status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
  max_turns integer not null default 6 check (max_turns between 1 and 12),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  turn_number integer not null check (turn_number between 1 and 12),
  question text not null,
  focus_skill text,
  difficulty text not null default 'beginner',
  answer text,
  score integer check (score between 0 and 100),
  evaluation jsonb,
  model_name text,
  created_at timestamptz not null default now(),
  unique(session_id, turn_number)
);

create table if not exists public.learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null,
  duration_days integer not null check (duration_days in (7,14)),
  plan jsonb not null,
  model_name text,
  created_at timestamptz not null default now()
);

create index if not exists candidate_resumes_user_updated_idx on public.candidate_resumes(user_id,updated_at desc);
create index if not exists job_targets_user_created_idx on public.job_targets(user_id,created_at desc);
create index if not exists resume_analyses_user_created_idx on public.resume_analyses(user_id,created_at desc);
create index if not exists interview_sessions_user_created_idx on public.interview_sessions(user_id,created_at desc);
create index if not exists interview_turns_session_number_idx on public.interview_turns(session_id,turn_number);
create index if not exists learning_plans_user_created_idx on public.learning_plans(user_id,created_at desc);

alter table public.candidate_profiles enable row level security;
alter table public.candidate_resumes enable row level security;
alter table public.job_targets enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_turns enable row level security;
alter table public.learning_plans enable row level security;

create policy candidate_profiles_owner on public.candidate_profiles for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy candidate_resumes_owner on public.candidate_resumes for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy job_targets_owner on public.job_targets for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy resume_analyses_owner on public.resume_analyses for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy interview_sessions_owner on public.interview_sessions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy interview_turns_owner on public.interview_turns for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy learning_plans_owner on public.learning_plans for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

-- Explicit Data API privileges for the authenticated role. No anonymous access is granted.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.candidate_profiles, public.candidate_resumes, public.job_targets, public.resume_analyses, public.interview_sessions, public.interview_turns, public.learning_plans to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
