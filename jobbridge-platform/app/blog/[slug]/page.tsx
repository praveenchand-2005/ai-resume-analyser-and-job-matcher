import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: article } = await supabase.from("jobbridge_articles")
    .select("title,seo_title,seo_description").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!article) return { title: "Guide not found | JobBridge India" };
  return { title: article.seo_title ?? article.title, description: article.seo_description ?? article.title };
}
function renderLines(lines: string[], key: number) {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (!clean.length) return null;
  if (clean.every((line) => /^-\s/.test(line)))
    return <ul key={key} className="list-disc space-y-2 pl-6">{clean.map((line, i) => <li key={i}>{line.replace(/^-\s/, "")}</li>)}</ul>;
  if (clean.every((line) => /^\d+\.\s/.test(line)))
    return <ol key={key} className="list-decimal space-y-2 pl-6">{clean.map((line, i) => <li key={i}>{line.replace(/^\d+\.\s/, "")}</li>)}</ol>;
  return <p key={key}>{clean.join(" ")}</p>;
}
function GuideBody({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return <div className="mt-4 space-y-5 text-sm leading-7 text-slate-300">
    {blocks.map((block, index) => {
      const lines = block.split("\n");
      const first = lines[0];
      if (first.startsWith("# ")) return <section key={index} className="space-y-3"><h2 className="text-2xl font-bold text-white">{first.slice(2)}</h2>{renderLines(lines.slice(1), index + 1000)}</section>;
      if (first.startsWith("## ")) return <section key={index} className="space-y-3"><h3 className="pt-2 text-xl font-semibold text-white">{first.slice(3)}</h3>{renderLines(lines.slice(1), index + 1000)}</section>;
      return renderLines(lines, index);
    })}
  </div>;
}
export default async function JobGuide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: article } = await supabase.from("jobbridge_articles")
    .select("slug,title,excerpt,body_markdown,published_at,jobbridge_jobs(source_name,source_url,apply_url,location,work_mode,expires_at,jobbridge_companies(name))")
    .eq("slug", slug).eq("status", "published").maybeSingle();
  if (!article) notFound();
  const job = Array.isArray(article.jobbridge_jobs) ? article.jobbridge_jobs[0] : article.jobbridge_jobs;
  const company = Array.isArray(job?.jobbridge_companies) ? job.jobbridge_companies[0] : job?.jobbridge_companies;
  return <main className="min-h-screen bg-slate-950 text-white"><article className="mx-auto max-w-3xl px-6 py-12">
    <Link href="/blog" className="text-cyan-300">← Career blog</Link>
    <p className="mt-10 text-sm font-bold uppercase tracking-[.18em] text-cyan-300">Verified job application guide</p>
    <h1 className="mt-3 text-4xl font-black leading-tight">{article.title}</h1>
    <p className="mt-4 text-slate-400">{company?.name ?? "Employer"} · {job?.location ?? "Location not stated"} · {job?.work_mode ?? "Work mode not stated"}</p>
    <p className="mt-6 text-lg leading-8 text-slate-300">{article.excerpt}</p>
    <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-bold">Original guide</h2><GuideBody content={article.body_markdown} /></section>
    {job?.source_url && <section className="mt-8 border-t border-slate-800 pt-6"><h2 className="text-xl font-bold">Verify and apply</h2><p className="mt-3 text-sm leading-6 text-slate-400">Confirm that the vacancy is still open and check all eligibility requirements on the original source. JobBridge India is an independent discovery service.</p><div className="mt-4 flex flex-wrap gap-4"><a href={job.source_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-cyan-300 underline">Original source ↗</a>{job.apply_url && <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">Official application ↗</a>}</div></section>}
  </article></main>;
}
