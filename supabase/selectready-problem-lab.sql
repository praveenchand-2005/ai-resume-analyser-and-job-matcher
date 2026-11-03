create table if not exists public.practice_problems (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 topic text not null,
 difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
 target_role text not null,
 problem jsonb not null,
 model_name text,
 created_at timestamptz not null default now()
);
create table if not exists public.problem_submissions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 problem_id uuid not null references public.practice_problems(id) on delete cascade,
 language text not null,
 code_text text not null,
 score integer check (score between 0 and 100),
 feedback jsonb not null,
 model_name text,
 created_at timestamptz not null default now()
);
create index if not exists practice_problems_user_created_idx on public.practice_problems(user_id,created_at desc);
create index if not exists problem_submissions_user_created_idx on public.problem_submissions(user_id,created_at desc);
alter table public.practice_problems enable row level security;
alter table public.problem_submissions enable row level security;
create policy practice_problems_owner on public.practice_problems for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy problem_submissions_owner on public.problem_submissions for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.practice_problems,public.problem_submissions to authenticated;
