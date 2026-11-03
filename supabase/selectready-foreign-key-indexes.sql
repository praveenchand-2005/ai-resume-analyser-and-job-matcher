create index if not exists resume_analyses_resume_id_idx on public.resume_analyses(resume_id);
create index if not exists resume_analyses_job_target_id_idx on public.resume_analyses(job_target_id);
create index if not exists interview_turns_user_id_idx on public.interview_turns(user_id);
create index if not exists problem_submissions_problem_id_idx on public.problem_submissions(problem_id);
