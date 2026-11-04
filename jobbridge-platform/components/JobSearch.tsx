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
    <div className="mt-9 grid gap-3 rounded-2xl border border-white/10 bg-[#11162a]/90 p-3 shadow-2xl shadow-black/20 md:grid-cols-[1fr_1fr_auto]">
      <label className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.04] px-4"><span className="text-lg text-violet-300" aria-hidden="true">⌕</span><input aria-label="Search jobs" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, company or skill" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-0" /></label>
      <label className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.04] px-4"><span className="text-sm text-cyan-300" aria-hidden="true">⌖</span><input aria-label="Filter by location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or remote" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:ring-0" /></label>
      <Link href="/jobs" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:brightness-110">Browse all jobs <span aria-hidden="true">→</span></Link>
    </div>
    <div className="mt-14 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Verified opportunities</p><h2 className="mt-2 text-3xl font-black tracking-tight text-white">Latest jobs</h2><p className="mt-2 text-sm text-slate-400">Source-linked opportunities, with direct application destinations.</p></div><Link href="/jobs" className="shrink-0 text-sm font-bold text-cyan-300 hover:text-white">View all →</Link></div>
    {filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-white/10 bg-[#11162a] p-8"><h3 className="text-xl font-semibold text-white">{jobs.length ? "No matching jobs" : "We're verifying the first live listings."}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{jobs.length ? "Try a different job title, skill or location." : "Only vacancies with a verified employer or official recruitment source and a valid application destination appear here."}</p>{!jobs.length && <Link className="mt-5 inline-block font-semibold text-cyan-300" href="/sources">Explore official job sources →</Link>}</div> :
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.slice(0, 6).map((job) => <article key={job.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#171d34] to-[#101426] p-6 transition duration-200 hover:-translate-y-1 hover:border-violet-300/30 hover:shadow-xl hover:shadow-violet-950/20"><div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl transition group-hover:bg-violet-400/20" /><div className="relative"><div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-violet-200">{job.company?.name ?? "Employer"}</p><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Verified</span></div><h3 className="mt-3 text-xl font-bold leading-snug text-white">{job.title}</h3><p className="mt-3 text-sm text-slate-400">{job.location ?? "Location not specified"} <span className="text-slate-600">·</span> {job.work_mode ?? "Work mode not specified"}</p>{job.experience && <p className="mt-2 text-xs text-slate-500">{job.experience}</p>}{job.salary_text && <p className="mt-2 text-sm font-semibold text-cyan-200">{job.salary_text}</p>}<div className="mt-5 flex min-h-7 flex-wrap gap-2">{(job.skills ?? []).slice(0,4).map((skill) => <span key={skill} className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[11px] text-slate-300">{skill}</span>)}</div><div className="mt-6 flex items-center justify-between border-t border-white/[.08] pt-4"><Link href={`/jobs/${job.slug}`} className="text-sm font-bold text-cyan-300 transition group-hover:text-white">View details →</Link><Link href={`/blog/${job.slug}`} className="text-xs font-medium text-slate-400 hover:text-violet-200">Application guide</Link></div></div></article>)}</div>}
  </>;
}
