import Link from "next/link";
import { supabase } from "../../lib/supabase";
export const revalidate = 300;
export const metadata = { title: "Career & Job Guides | JobBridge India", description: "Original, source-linked job application guides for students, freshers and professionals in India." };
export default async function BlogIndex() {
  const { data: articles, error } = await supabase.from("jobbridge_articles")
    .select("id,slug,title,excerpt,published_at,jobbridge_jobs(location,jobbridge_companies(name))")
    .eq("status", "published").order("published_at", { ascending: false });
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-5xl px-6 py-12">
    <Link href="/" className="text-cyan-300">← JobBridge India</Link>
    <p className="mt-10 text-sm font-bold uppercase tracking-[.2em] text-cyan-300">Career intelligence</p>
    <h1 className="mt-2 text-4xl font-black">Job guides that help you apply with confidence.</h1>
    <p className="mt-4 max-w-2xl leading-7 text-slate-400">Original guides based on verified vacancy details, with direct links to the employer or official recruitment source.</p>
    {error && <p className="mt-8 rounded-xl border border-amber-700/50 p-4 text-amber-200">Articles are temporarily unavailable.</p>}
    {(!articles || articles.length === 0) && !error && <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8"><h2 className="text-xl font-bold">The first verified job guides are being prepared.</h2><p className="mt-2 text-slate-400">Guides are published only after a vacancy has been checked against its original source.</p><Link href="/sources" className="mt-5 inline-block font-semibold text-cyan-300">Explore official recruitment sources →</Link></div>}
    <div className="mt-8 grid gap-5 md:grid-cols-2">{(articles ?? []).map((article: any) => {
      const job = Array.isArray(article.jobbridge_jobs) ? article.jobbridge_jobs[0] : article.jobbridge_jobs;
      const company = Array.isArray(job?.jobbridge_companies) ? job.jobbridge_companies[0] : job?.jobbridge_companies;
      return <article key={article.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-6"><p className="text-sm text-cyan-300">{company?.name ?? "Employer"} · {job?.location ?? "India"}</p><h2 className="mt-2 text-xl font-bold">{article.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{article.excerpt}</p><Link href={`/blog/${article.slug}`} className="mt-5 inline-block font-semibold text-cyan-300">Read guide →</Link></article>;
    })}</div>
  </div></main>;
}
