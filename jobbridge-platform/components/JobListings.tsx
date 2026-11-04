"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ListingJob = {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  work_mode: string | null;
  employment_type: string | null;
  experience: string | null;
  salary_text: string | null;
  skills: string[] | null;
  source_name: string | null;
  source_url: string;
  apply_url: string;
  company: { name: string; slug: string } | null;
};

export default function JobListings({ jobs }: { jobs: ListingJob[] }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [workMode, setWorkMode] = useState("all");

  const workModes = useMemo(
    () => Array.from(new Set(jobs.map((job) => job.work_mode?.trim()).filter((value): value is string => Boolean(value)))).sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    return jobs.filter((job) => {
      const searchable = [
        job.title,
        job.company?.name ?? "",
        job.experience ?? "",
        job.employment_type ?? "",
        ...(job.skills ?? []),
      ].join(" ").toLowerCase();
      const matchesQuery = !q || searchable.includes(q);
      const matchesLocation = !place || (job.location ?? "").toLowerCase().includes(place);
      const matchesMode = workMode === "all" || job.work_mode === workMode;
      return matchesQuery && matchesLocation && matchesMode;
    });
  }, [jobs, query, location, workMode]);

  const hasFilters = Boolean(query || location || workMode !== "all");

  return (
    <>
      <section aria-label="Filter jobs" className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_.8fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Keyword</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Role, company or skill" aria-label="Search by role, company or skill" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or state" aria-label="Filter by location" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Work mode</span>
            <select value={workMode} onChange={(event) => setWorkMode(event.target.value)} aria-label="Filter by work mode" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
              <option value="all">All work modes</option>
              {workModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button type="button" onClick={() => { setQuery(""); setLocation(""); setWorkMode("all"); }} disabled={!hasFilters} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">Clear filters</button>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400" aria-live="polite">Showing <span className="font-semibold text-white">{filtered.length}</span> of {jobs.length} verified jobs</p>
      </section>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h2 className="text-xl font-semibold">No matching jobs found</h2>
          <p className="mt-2 text-slate-400">Try a different keyword or location, or clear the filters to see all verified listings.</p>
          <button type="button" onClick={() => { setQuery(""); setLocation(""); setWorkMode("all"); }} className="mt-5 font-semibold text-cyan-300 hover:text-white">Clear all filters →</button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filtered.map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400/40">
              <p className="text-sm text-cyan-300">{job.company?.name ?? "Employer"}</p>
              <h2 className="mt-2 text-xl font-semibold">{job.title}</h2>
              <p className="mt-3 text-sm text-slate-400">{job.location ?? "Location not specified"} · {job.work_mode ?? "Work mode not specified"} · {job.employment_type ?? "Employment type not specified"}</p>
              {job.experience && <p className="mt-2 text-sm text-slate-500">{job.experience}</p>}
              {job.salary_text && <p className="mt-2 text-sm text-slate-500">{job.salary_text}</p>}
              <div className="mt-4 flex flex-wrap gap-2">{(job.skills ?? []).map((skill) => <span key={skill} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{skill}</span>)}</div>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link href={`/jobs/${job.slug}`} className="font-semibold text-cyan-300">Details →</Link>
                <Link href={`/blog/${job.slug}`} className="font-semibold text-slate-300">Read job guide →</Link>
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">Official application ↗</a>
              </div>
              <p className="mt-4 text-xs text-slate-500">Source: {job.source_name ?? "Employer source"} · <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="underline">Verify listing</a></p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
