-- Reapply the exact candidate-table grant hardening migration.
revoke all privileges on table
 public.candidate_profiles,public.candidate_resumes,public.job_targets,public.resume_analyses,
 public.interview_sessions,public.interview_turns,public.learning_plans,
 public.practice_problems,public.problem_submissions
from anon,authenticated,public;
grant select,insert,update,delete on table
 public.candidate_profiles,public.candidate_resumes,public.job_targets,public.resume_analyses,
 public.interview_sessions,public.interview_turns,public.learning_plans,
 public.practice_problems,public.problem_submissions
to authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on tables from authenticated;
