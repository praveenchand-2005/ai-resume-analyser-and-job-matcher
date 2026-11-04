import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import ApplyButton from "../../../components/ApplyButton";

export const revalidate = 300;

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const {data:job}=await supabase.from("jobbridge_jobs").select("title,location,jobbridge_companies(name)").eq("slug",slug).eq("status","active").eq("verification_status","verified").not("source_url","ilike","%example.com%").maybeSingle();
  if(!job)return {title:"Job not found | JobBridge India"};
  const company=Array.isArray(job.jobbridge_companies)?job.jobbridge_companies[0]:job.jobbridge_companies;
  return {title:`${job.title} at ${company?.name ?? "Employer"} | JobBridge India`,description:`Job details, eligibility and official application link for ${job.title} in ${job.location ?? "India"}.`};
}

export default async function JobPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const now=new Date().toISOString();
  const {data:job}=await supabase.from("jobbridge_jobs").select("id,title,slug,description,location,work_mode,employment_type,experience,salary_text,skills,source_name,source_url,apply_url,posted_at,expires_at,jobbridge_companies(name,slug,website_url,description)").eq("slug",slug).eq("status","active").not("source_url","ilike","%example.com%").or(`expires_at.is.null,expires_at.gt.${now}`).maybeSingle();
  const isHttpUrl=(value:string)=>value.startsWith("https://")||value.startsWith("http://");
  if(!job || !isHttpUrl(job.source_url) || !isHttpUrl(job.apply_url))notFound();
  const company=Array.isArray(job.jobbridge_companies)?job.jobbridge_companies[0]:job.jobbridge_companies;
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-4xl px-6 py-12"><Link href="/jobs" className="text-cyan-300">← All jobs</Link><article className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-8"><p className="text-cyan-300">{company?.name ?? "Employer"}</p><h1 className="mt-2 text-4xl font-bold">{job.title}</h1><p className="mt-4 text-slate-400">{job.location ?? "Location not specified"} · {job.work_mode ?? "Work mode not specified"}</p><div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">{job.employment_type&&<span>{job.employment_type}</span>}{job.experience&&<span>{job.experience}</span>}{job.salary_text&&<span>{job.salary_text}</span>}</div><div className="mt-6 flex flex-wrap gap-2">{(job.skills??[]).map((s:string)=><span key={s} className="rounded-full border border-slate-700 px-3 py-1 text-sm">{s}</span>)}</div><h2 className="mt-10 text-xl font-bold">Job description</h2><div className="mt-4 whitespace-pre-wrap leading-7 text-slate-300">{job.description ?? "The employer has not supplied a detailed description. Check the original source before applying."}</div><div className="mt-8 flex flex-wrap items-center gap-4"><ApplyButton jobId={job.id} applyUrl={job.apply_url}/><Link href={`/blog/${job.slug}`} className="font-semibold text-cyan-300">Read application guide →</Link></div><p className="mt-5 text-xs text-slate-500">Original source: <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="underline">{job.source_name ?? "Employer career page"}</a>. Always verify details and deadlines at the source.</p></article></div></main>;
}
