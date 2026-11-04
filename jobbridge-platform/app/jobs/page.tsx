import Link from "next/link";
import { supabase } from "../../lib/supabase";
import JobListings from "../../components/JobListings";

export const revalidate = 300;

export default async function JobsPage() {
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from("jobbridge_jobs")
    .select("id,title,slug,location,work_mode,employment_type,experience,salary_text,skills,source_name,source_url,apply_url,posted_at,expires_at,jobbridge_companies(name,slug)")
    .eq("status", "active")
    .not("source_url", "ilike", "%example.com%")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("posted_at", { ascending: false });

  const validJobs = (jobs ?? [])
    .filter((job: any) => job.source_url && job.apply_url && /^https?:\\/\\//i.test(job.source_url) && /^https?:\\/\\//i.test(job.apply_url))
    .map((job: any) => ({
      ...job,
      company: Array.isArray(job.jobbridge_companies)
        ? job.jobbridge_companies[0] ?? null
        : job.jobbridge_companies ?? null,
    }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/" className="text-cyan-300">← JobBridge India</Link>
        <div className="mt-8">
          <p className="text-sm uppercase tracking-[.2em] text-cyan-300">Verified listings</p>
          <h1 className="mt-2 text-4xl font-bold">Latest jobs in India</h1>
          <p className="mt-3 text-slate-400">Vacancies with traceable source links and direct application destinations.</p>
        </div>
        {error && (
          <p className="mt-8 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-amber-200">
            Listings are temporarily unavailable. Please try again shortly.
          </p>
        )}
        {!error && validJobs.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-xl font-semibold">No verified vacancies are published yet.</h2>
            <p className="mt-2 text-slate-400">We have intentionally excluded demonstration records and listings with expired deadlines. Use the official recruitment sources below.</p>
            <Link href="/sources" className="mt-5 inline-block font-semibold text-cyan-300">Browse official job sources →</Link>
          </div>
        ) : (
          !error && <JobListings jobs={validJobs} />
        )}
      </div>
    </main>
  );
}
