import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);

export default async function JobsPage() {
  const { data: jobs } = await db.from("jobbridge_jobs").select("id,title,slug,location,work_mode,experience,salary_text,skills,jobbridge_companies(name,slug)").eq("status","active").order("posted_at",{ascending:false});
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-6xl px-6 py-10"><Link href="/" className="text-cyan-300">← JobBridge</Link><h1 className="mt-8 text-4xl font-bold">Latest jobs</h1><div className="mt-8 grid gap-5 md:grid-cols-2">{(jobs ?? []).map((j:any)=><article key={j.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-semibold">{j.title}</h2><p className="mt-2 text-slate-400">{j.jobbridge_companies?.name}</p><p className="mt-4 text-sm text-slate-400">{j.location ?? "Location not specified"} · {j.work_mode ?? "Work mode not specified"}</p><div className="mt-4 flex flex-wrap gap-2">{(j.skills ?? []).map((s:string)=><span key={s} className="rounded-full border border-slate-700 px-2 py-1 text-xs">{s}</span>)}</div><Link href={`/jobs/${j.slug}`} className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">View job</Link></article>)}</div></div></main>;
}