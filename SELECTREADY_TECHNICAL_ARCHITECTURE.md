# SelectReady AI — Fresher Career Engineering MVP

## Product promise
Help a fresher move from an unstructured resume and uncertain interview preparation to a truthful, role-specific application and demonstrable interview readiness. Never invent experience or promise a job.

## Stack
- Frontend: Next.js App Router, React 19, TypeScript, Tailwind CSS.
- Identity: Supabase Auth with cookie-based SSR using @supabase/ssr.
- Database: dedicated Supabase project selectready-ai in Mumbai (ap-south-1).
- Authorization: PostgreSQL RLS on every candidate table; each row is scoped to auth.uid().
- AI: server-only OpenAI-compatible chat-completions adapter. NVIDIA NIM can be configured with AI_API_BASE_URL, AI_API_KEY and AI_MODEL. No AI secret is committed or exposed to browser code. AI requests are guarded by a private database trigger enforcing 8 requests/minute and 40/day per account.
- Hosting: existing Vercel Hobby project; preview only until production is separately approved.
- Resume parsing: PDF.js / Mammoth in browser; extracted text and structured fields are submitted to app APIs.

## API contracts
- GET/POST /api/resumes: list and save the signed-in candidate's resume records.
- POST /api/ai/resume-review: compare resume evidence with a job description and persist the analysis.
- POST /api/ai/interview action start: create a mock interview and generate the first question.
- POST /api/ai/interview action answer: evaluate the answer and generate the next question for a six-turn session.
- POST /api/ai/study-plan: create and persist a 7- or 14-day role-specific preparation plan.
- POST /api/ai/problem-lab: generate original SQL/Python/DSA practice problems or statically review candidate-submitted code; it does not execute code.
- AI quota enforcement: authenticated inserts into ai_usage_events fire a private SECURITY DEFINER trigger with a fixed search_path; the trigger is not exposed as a callable Data API RPC.
- GET /api/health: show database/AI configuration state without returning secrets.

## Database
candidate_profiles, candidate_resumes, job_targets, resume_analyses, interview_sessions, interview_turns, learning_plans, practice_problems, problem_submissions, ai_usage_events.
Every candidate table has user_id ownership and RLS. Explicit Data API grants are included because newly created public-schema tables are no longer automatically exposed by default.

## Preview environment
Public: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
Server-only: AI_API_BASE_URL, AI_API_KEY, AI_MODEL.
The AI key must never use a NEXT_PUBLIC_ prefix. AI routes return a clear configuration error until a valid key and model are configured.

## Verification gates
1. Supabase project restored and healthy.
2. Apply schema and verify tables, RLS, grants and database advisors.
3. Add preview-only Vercel variables for this branch.
4. Run typecheck and production build in GitHub Actions.
5. Test auth, row isolation, resume save/review, interview start/answer and study-plan persistence.
6. Confirm no secret is present in browser bundles or Git history.
7. Keep production branch and deployment unchanged until separately approved.
