"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Job = {
  id: number;
  title: string;
  slug: string;
  location: string | null;
  work_mode: string | null;
  experience: string | null;
  salary_text: string | null;
  skills: string[];
  apply_url: string;
  company: { name: string; slug: string } | null;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [l, setL] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const { data, error } = await supabase
        .from("jobbridge_jobs")
        .select("id,title,slug,location,work_mode,experience,salary_text,skills,apply_url,jobbridge_companies(name,slug)")
        .eq("status", "active")
        .order("posted_at", { ascending: false });

      if (!error && data) {
        setJobs(
          data.map((job: any) => ({
            ...job,
            company: Array.isArray(job.jobbridge_companies)
              ? job.jobbridge_companies[0] ?? null
              : job.jobbridge_companies ?? null,
          }))
        );
      }
      setLoading(false);
    }

    loadJobs();
  }, []);

  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          (!q ||
            [j.title, j.company?.name ?? "", ...(j.skills ?? [])]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase())) &&
          (!l || (j.location ?? "").toLowerCase().includes(l.toLowerCase()))
      ),
    [jobs, q, l]
  );

  async function apply(job: Job) {
    await supabase.from("jobbridge_apply_clicks").insert({
      job_id: job.id,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    window.location.href = job.apply_url;
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <b className="text-xl text-cyan-300">JobBridge</b>
          <span className="text-sm text-slate-400">Find jobs. Apply direct. Get hired.</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">Job discovery</p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight">Find your next opportunity.</h1>
          <p className="mt-5 text-lg text-slate-400">
            Search jobs from permitted public sources and go directly to the original employer application.
          </p>
        </div>

        <div className="mt-10 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_1fr_auto]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Role, company or skill" className="rounded-xl bg-slate-800 px-4 py-3 outline-none" />
          <input value={l} onChange={(e) => setL(e.target.value)} placeholder="Location" className="rounded-xl bg-slate-800 px-4 py-3 outline-none" />
          <button onClick={() => {}} className="rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950">Search</button>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">Loading live jobs…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">No matching jobs found.</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {filtered.map((j) => (
                <article key={j.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                  <div className="flex justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{j.title}</h2>
                      <p className="mt-1 text-slate-400">{j.company?.name ?? "Company"}</p>
                    </div>
                    {j.work_mode && <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">{j.work_mode}</span>}
                  </div>
                  <p className="mt-5 text-sm text-slate-400">{j.location ?? "Location not specified"}</p>
                  {j.experience && <p className="mt-2 text-sm text-slate-500">{j.experience}</p>}
                  {j.salary_text && <p className="mt-2 text-sm text-slate-500">{j.salary_text}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(j.skills ?? []).map((s) => <span key={s} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{s}</span>)}
                  </div>
                  <button onClick={() => apply(j)} className="mt-6 w-full rounded-xl border border-cyan-400/50 px-4 py-3 font-semibold text-cyan-300">
                    View & Apply
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-500">Applications are sent to the original employer URL. JobBridge records an application click for transparent traffic analytics.</p>
      </section>
    </main>
  );
}