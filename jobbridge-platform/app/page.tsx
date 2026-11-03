"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Job = {
  id: number; title: string; slug: string; location: string | null;
  work_mode: string | null; experience: string | null; salary_text: string | null;
  skills: string[]; source_name: string | null; source_url: string; apply_url: string;
  posted_at: string | null; expires_at: string | null;
  company: { name: string; slug: string } | null;
};

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("jobbridge_jobs")
        .select("id,title,slug,location,work_mode,experience,salary_text,skills,source_name,source_url,apply_url,posted_at,expires_at,jobbridge_companies(name,slug)")
        .eq("status", "active")
        .not("source_url", "ilike", "%example.com%")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("posted_at", { ascending: false })
        .limit(12);
      if (!error && data) {
        setJobs(data.map((job: any) => ({
          ...job,
          company: Array.isArray(job.jobbridge_companies) ? job.jobbridge_companies[0] ?? null : job.jobbridge_companies ?? null,
        })));
      }
      setLoading(false);
    }
    loadJobs();
  }, []);

  const filtered = useMemo(() => jobs.filter((job) => {
    const text = [job.title, job.company?.name ?? "", ...(job.skills ?? [])].join(" ").toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!location || (job.location ?? "").toLowerCase().includes(location.toLowerCase()));
  }), [jobs, q, location]);

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-black tracking-tight text-cyan-300">JOBBRIDGE <span className="text-white">INDIA</span></Link>
          <nav className="flex gap-5 text-sm text-slate-300"><Link href="/jobs">Jobs</Link><Link href="/blog">Career blog</Link><Link href="/sources">Job sources</Link></nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-14 pt-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[.22em] text-cyan-300">India jobs · fresher to experienced</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">Your next opportunity starts with a better search.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">Discover opportunities, understand the eligibility, and apply through the original employer or official recruitment portal. No fake vacancies. No application fees charged by us.</p>
        </div>

        <div className="mt-9 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_1fr_auto]">
          <input aria-label="Search jobs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, company or skill" className="rounded-xl bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400" />
          <input aria-label="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" className="rounded-xl bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400" />
          <Link href="/jobs" className="rounded-xl bg-cyan-400 px-6 py-3 text-center font-bold text-slate-950">Browse all jobs</Link>
        </div>

        <div className="mt-12 flex items-end justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-300">Verified opportunities</p><h2 className="mt-2 text-3xl font-bold">Latest jobs</h2></div>
          <Link href="/jobs" className="text-sm font-semibold text-cyan-300">View all →</Link>
        </div>
        {loading ? <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">Checking current listings…</p> :
          filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8"><h3 className="text-xl font-semibold">We're verifying the first live listings.</h3><p className="mt-2 text-slate-400">We have excluded demo records and expired vacancies. Browse official recruitment sources while our verified feed is being populated.</p><Link className="mt-5 inline-block font-semibold text-cyan-300" href="/sources">Explore official job sources →</Link></div> :
          <div className="mt-6 grid gap-5 md:grid-cols-3">{filtered.map((job) => <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-sm text-cyan-300">{job.company?.name ?? "Employer"}</p><h3 className="mt-2 text-xl font-bold">{job.title}</h3><p className="mt-3 text-sm text-slate-400">{job.location ?? "Location not specified"} · {job.work_mode ?? "Work mode not specified"}</p>{job.experience && <p className="mt-2 text-sm text-slate-500">{job.experience}</p>}{job.salary_text && <p className="mt-2 text-sm text-slate-500">{job.salary_text}</p>}<div className="mt-5 flex flex-wrap gap-2">{(job.skills ?? []).slice(0,5).map((skill) => <span key={skill} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{skill}</span>)}</div><Link href={`/jobs/${job.slug}`} className="mt-6 inline-block font-semibold text-cyan-300">Job details →</Link><span className="mx-2 text-slate-700">·</span><Link href={`/blog/${job.slug}`} className="inline-block text-sm text-slate-400">Read guide</Link></article>)}</div>}
      </section>

      <section className="border-y border-slate-800 bg-slate-900/50"><div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3"><div><p className="text-cyan-300">01 / Discover</p><h3 className="mt-2 text-xl font-bold">Find relevant jobs</h3><p className="mt-2 text-sm leading-6 text-slate-400">Search by role, skills, location and work mode.</p></div><div><p className="text-cyan-300">02 / Understand</p><h3 className="mt-2 text-xl font-bold">Read practical job guides</h3><p className="mt-2 text-sm leading-6 text-slate-400">Get eligibility, skills, selection and application details in one place.</p></div><div><p className="text-cyan-300">03 / Apply</p><h3 className="mt-2 text-xl font-bold">Apply at the source</h3><p className="mt-2 text-sm leading-6 text-slate-400">We send you to the employer or official recruitment website.</p></div></div></section>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-xs text-slate-500"><span>© {new Date().getFullYear()} JobBridge India</span><span>Independent job discovery service · Not a government website</span><span><Link href="/about">About</Link> · <Link href="/sources">Sources</Link> · <Link href="/blog">Blog</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></footer>
    </main>
  );
}
