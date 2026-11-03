"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
export type HomeJob = {
  id: string; title: string; slug: string; location: string | null;
  work_mode: string | null; experience: string | null; salary_text: string | null;
  skills: string[] | null; source_name: string | null; source_url: string; apply_url: string;
  company: { name: string; slug: string } | null;
};
export default function JobSearch({ jobs }: { jobs: HomeJob[] }) {
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const filtered = useMemo(() => jobs.filter((job) => {
    const text = [job.title, job.company?.name ?? "", ...(job.skills ?? [])].join(" ").toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (!location || (job.location ?? "").toLowerCase().includes(location.toLowerCase()));
  }), [jobs, q, location]);
  return <>
    <div className="mt-9 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-[1fr_1fr_auto]">
      <input aria-label="Search jobs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, company or skill" className="rounded-xl bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400" />
      <input aria-label="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" className="rounded-xl bg-slate-800 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400" />
      <Link href="/jobs" className="rounded-xl bg-cyan-400 px-6 py-3 text-center font-bold text-slate-950">Browse all jobs</Link>
    </div>
    <div className="mt-12 flex items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-cyan-300">Verified opportunities</p><h2 className="mt-2 text-3xl font-bold">Latest jobs</h2></div><Link href="/jobs" className="text-sm font-semibold text-cyan-300">View all →</Link></div>
    {filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8"><h3 className="text-xl font-semibold">{jobs.length ? "No matching jobs" : "We're verifying the first live listings."}</h3><p className="mt-2 text-slate-400">{jobs.length ? "Try a different job title, skill or location." : "Only vacancies with a verified employer or official recruitment source and a valid application destination appear here."}</p>{!jobs.length && <Link className="mt-5 inline-block font-semibold text-cyan-300" href="/sources">Explore official job sources →</Link>}</div> :
      <div className="mt-6 grid gap-5 md:grid-cols-3">{filtered.slice(0, 6).map((job) => <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-sm text-cyan-300">{job.company?.name ?? "Employer"}</p><h3 className="mt-2 text-xl font-bold">{job.title}</h3><p className="mt-3 text-sm text-slate-400">{job.location ?? "Location not specified"} · {job.work_mode ?? "Work mode not specified"}</p>{job.experience && <p className="mt-2 text-sm text-slate-500">{job.experience}</p>}{job.salary_text && <p className="mt-2 text-sm text-slate-500">{job.salary_text}</p>}<div className="mt-5 flex flex-wrap gap-2">{(job.skills ?? []).slice(0,5).map((skill) => <span key={skill} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{skill}</span>)}</div><Link href={`/jobs/${job.slug}`} className="mt-6 inline-block font-semibold text-cyan-300">Job details →</Link><span className="mx-2 text-slate-700">·</span><Link href={`/blog/${job.slug}`} className="inline-block text-sm text-slate-400">Read guide</Link></article>)}</div>}
  </>;
}
