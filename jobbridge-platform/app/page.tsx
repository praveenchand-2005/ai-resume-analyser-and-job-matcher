import Link from "next/link";
import { supabase } from "../lib/supabase";
import JobSearch, { HomeJob } from "../components/JobSearch";
export const revalidate = 300;
export default async function Home() {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("jobbridge_jobs")
    .select("id,title,slug,location,work_mode,experience,salary_text,skills,source_name,source_url,apply_url,posted_at,expires_at,jobbridge_companies(name,slug)")
    .eq("status", "active").eq("verification_status", "verified")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("posted_at", { ascending: false }).limit(12);
  const jobs: HomeJob[] = (data ?? []).map((job: any) => ({
    ...job,
    company: Array.isArray(job.jobbridge_companies) ? job.jobbridge_companies[0] ?? null : job.jobbridge_companies ?? null
  }));
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/90"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-xl font-black tracking-tight text-cyan-300">JOBBRIDGE <span className="text-white">INDIA</span></Link>
        <nav className="flex gap-5 text-sm text-slate-300"><Link href="/jobs">Jobs</Link><Link href="/blog">Career blog</Link><Link href="/sources">Job sources</Link></nav>
      </div></header>
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-16">
        <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[.22em] text-cyan-300">India jobs · fresher to experienced</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl">Your next opportunity starts with a better search.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">Discover opportunities, understand the eligibility, and apply through the original employer or official recruitment portal. No fake vacancies. No application fees charged by us.</p></div>
        {error ? <p className="mt-8 rounded-xl border border-amber-700/50 p-4 text-amber-200">Live listings are temporarily unavailable.</p> : <JobSearch jobs={jobs} />}
      </section>
      <section className="border-y border-slate-800 bg-slate-900/50"><div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-3"><div><p className="text-cyan-300">01 / Discover</p><h3 className="mt-2 text-xl font-bold">Find relevant jobs</h3><p className="mt-2 text-sm leading-6 text-slate-400">Search by role, skills, location and work mode.</p></div><div><p className="text-cyan-300">02 / Understand</p><h3 className="mt-2 text-xl font-bold">Read practical job guides</h3><p className="mt-2 text-sm leading-6 text-slate-400">Get eligibility, skills, selection and application details in one place.</p></div><div><p className="text-cyan-300">03 / Apply</p><h3 className="mt-2 text-xl font-bold">Apply at the source</h3><p className="mt-2 text-sm leading-6 text-slate-400">We send you to the employer or official recruitment website.</p></div></div></section>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-xs text-slate-500"><span>© {new Date().getFullYear()} JobBridge India</span><span>Independent job discovery service · Not a government website</span><span><Link href="/about">About</Link> · <Link href="/sources">Sources</Link> · <Link href="/blog">Blog</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></footer>
    </main>
  );
}
