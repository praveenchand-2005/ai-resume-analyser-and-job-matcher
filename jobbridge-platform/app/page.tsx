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
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080b18]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-lg font-black text-white shadow-lg shadow-violet-950/50">J</span><span className="text-lg font-black tracking-tight text-white">JOBBRIDGE<span className="text-violet-300"> INDIA</span></span></Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-300 sm:gap-7"><Link className="transition hover:text-white" href="/jobs">Find jobs</Link><Link className="hidden transition hover:text-white sm:block" href="/blog">Career guides</Link><Link className="hidden transition hover:text-white sm:block" href="/sources">Sources</Link><Link href="/jobs" className="rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-violet-100 transition hover:bg-violet-500/25">Explore jobs <span aria-hidden="true">↗</span></Link></nav>
        </div>
      </header>
      <section className="relative isolate">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_18%_10%,rgba(109,40,217,.24),transparent_42%),radial-gradient(ellipse_at_82%_30%,rgba(8,145,178,.16),transparent_36%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-violet-200"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /> Built for India's next generation</div>
            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.04] tracking-[-.045em] text-white sm:text-6xl xl:text-7xl">Your next chapter starts <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">right here.</span></h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">Find verified jobs, understand what employers expect, and apply through the original source. A clearer path from searching to getting hired.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/jobs" className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-violet-950/50 transition hover:-translate-y-0.5 hover:brightness-110">Explore opportunities <span aria-hidden="true">→</span></Link><Link href="/blog" className="rounded-xl border border-white/15 bg-white/[.04] px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[.08]">Career resources</Link></div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-400"><span>✓ Source-linked vacancies</span><span>✓ No candidate fees</span><span>✓ Direct employer applications</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-lg">
            <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-cyan-500/20 blur-3xl" />
            <div className="rounded-[2rem] border border-white/10 bg-[#11162a]/90 p-5 shadow-2xl shadow-black/50 backdrop-blur sm:p-7">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">The opportunity board</p><p className="mt-1 text-lg font-bold text-white">Make your next move</p></div><span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">Live discovery</span></div>
              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-violet-300/20 bg-gradient-to-r from-violet-500/15 to-indigo-500/5 p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-violet-200">01 · Find your fit</span><span className="text-violet-300">⌕</span></div><p className="mt-2 text-sm font-bold text-white">Search roles, skills and locations</p><p className="mt-1 text-xs text-slate-400">Discover opportunities that match your direction.</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-cyan-200">02 · Know the process</span><span className="text-cyan-300">↗</span></div><p className="mt-2 text-sm font-bold text-white">Understand eligibility and skills</p><p className="mt-1 text-xs text-slate-400">Practical guides make every application clearer.</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-emerald-200">03 · Apply with confidence</span><span className="text-emerald-300">✓</span></div><p className="mt-2 text-sm font-bold text-white">Go directly to the source</p><p className="mt-1 text-xs text-slate-400">No middleman application fees from JobBridge.</p></div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5"><span className="text-xs text-slate-400">Your career journey, made simpler.</span><span className="text-xs font-bold text-violet-200">JOBBRIDGE INDIA</span></div>
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/10 bg-[#171d34] px-4 py-3 shadow-xl sm:block"><p className="text-[10px] uppercase tracking-widest text-slate-400">Your next step</p><p className="mt-1 text-sm font-bold text-white">Start with a search ↗</p></div>
          </div>
        </div>
      </section>
      <section className="border-y border-white/[.08] bg-white/[.025]"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-3 sm:px-8"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-xl text-violet-300">⌕</span><div><h2 className="font-bold text-white">Search smarter</h2><p className="mt-1 text-sm text-slate-400">Explore by role, skill and location.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">◎</span><div><h2 className="font-bold text-white">Know the details</h2><p className="mt-1 text-sm text-slate-400">Eligibility, source links and practical guides.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-xl text-emerald-300">↗</span><div><h2 className="font-bold text-white">Apply direct</h2><p className="mt-1 text-sm text-slate-400">Reach the employer's official application page.</p></div></div></div></section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Your journey starts here</p><h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Find an opportunity worth pursuing.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Browse verified listings and practical career guides. Every listing should lead back to a traceable source.</p></div><Link href="/jobs" className="text-sm font-bold text-cyan-300 hover:text-white">Browse all jobs →</Link></div>
        {error ? <p className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-amber-200">Live listings are temporarily unavailable. Please try again shortly.</p> : <JobSearch jobs={jobs} />}
      </section>
      <footer className="border-t border-white/10 bg-[#080b18]"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-5 py-8 text-xs text-slate-500 sm:px-8"><span>© {new Date().getFullYear()} JobBridge India</span><span>Independent job discovery service · Not a government website</span><span><Link href="/about">About</Link> · <Link href="/sources">Sources</Link> · <Link href="/blog">Blog</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></div></footer>
    </main>
  );
}
