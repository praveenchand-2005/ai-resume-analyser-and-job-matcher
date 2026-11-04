import Link from "next/link";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: jobs } = await supabase
    .from("jobbridge_jobs")
    .select("id,title,slug,location,work_mode,experience,salary_text,skills,jobbridge_companies(name,slug)")
    .eq("status", "active")
    .order("posted_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link href="/" className="text-cyan-300">← JobBridge</Link>
        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[.2em] text-cyan-300">Live listings</p>
            <h1 className="mt-2 text-4xl font-bold">Latest jobs</h1>
            <p className="mt-3 text-slate-400">Active opportunities currently available through JobBridge.</p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-400">{jobs?.length ?? 0} jobs</span>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {(jobs ?? []).map((job: any) => (
            <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="mt-2 text-slate-400">{job.jobbridge_companies?.name}</p>
              <p className="mt-4 text-sm text-slate-400">{job.location ?? "Location not specified"} · {job.work_mode ?? "Work mode not specified"}</p>
              {job.experience && <p className="mt-2 text-sm text-slate-500">{job.experience}</p>}
              {job.salary_text && <p className="mt-2 text-sm text-slate-500">{job.salary_text}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {(job.skills ?? []).map((skill: string) => <span key={skill} className="rounded-full border border-slate-700 px-2 py-1 text-xs">{skill}</span>)}
              </div>
              <Link href={`/jobs/${job.slug}`} className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">View job</Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
