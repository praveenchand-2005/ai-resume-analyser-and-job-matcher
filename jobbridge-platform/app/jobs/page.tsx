import Link from "next/link";
import { supabase } from "../../lib/supabase";

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
  const validJobs = (jobs ?? []).filter((job: any) => job.source_url && job.apply_url && /^https?:\/\//i.test(job.source_url) && /^https?:\/\//i.test(job.apply_url));
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-6xl px-6 py-10"><Link href="/" className="text-cyan-300">← JobBridge India</Link><div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[.2em] text-cyan-300">Verified listings</p><h1 className="mt-2 text-4xl font-bold">Latest jobs in India</h1><p className="mt-3 text-slate-400">Vacancies with traceable source links and direct application destinations.</p></div><span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-400">{validJobs.length} jobs</span></div>
  {error && <p className="mt-8 rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-amber-200">Listings are temporarily unavailable. Please try again shortly.</p>}
  {validJobs.length === 0 && !error && <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8"><h2 className="text-xl font-semibold">No verified vacancies are published yet.</h2><p className="mt-2 text-slate-400">We have intentionally excluded demonstration records and listings with expired deadlines. Use the official recruitment sources below.</p><Link href="/sources" className="mt-5 inline-block font-semibold text-cyan-300">Browse official job sources →</Link></div>}
  <div className="mt-8 grid gap-5 md:grid-cols-2">{validJobs.map((job:any)=>{const company=Array.isArray(job.jobbridge_companies)?job.jobbridge_companies[0]:job.jobbridge_companies;return <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-sm text-cyan-300">{company?.name ?? "Employer"}</p><h2 className="mt-2 text-xl font-semibold">{job.title}</h2><p className="mt-3 text-sm text-slate-400">{job.location ?? "Location not specified"} · {job.work_mode ?? "Work mode not specified"} · {job.employment_type ?? "Employment type not specified"}</p>{job.experience&&<p className="mt-2 text-sm text-slate-500">{job.experience}</p>}{job.salary_text&&<p className="mt-2 text-sm text-slate-500">{job.salary_text}</p>}<div className="mt-4 flex flex-wrap gap-2">{(job.skills??[]).map((skill:string)=><span key={skill} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{skill}</span>)}</div><div className="mt-6 flex flex-wrap gap-4"><Link href={`/jobs/${job.slug}`} className="font-semibold text-cyan-300">Details →</Link><Link href={`/blog/${job.slug}`} className="font-semibold text-slate-300">Read job guide →</Link><a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">Official application ↗</a></div><p className="mt-4 text-xs text-slate-500">Source: {job.source_name ?? "Employer source"} · <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="underline">Verify listing</a></p></article>})}</div></div></main>;
}
