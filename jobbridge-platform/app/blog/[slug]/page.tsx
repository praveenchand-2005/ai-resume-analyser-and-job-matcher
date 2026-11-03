import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export const revalidate = 300;

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const {data:job}=await supabase.from("jobbridge_jobs").select("title,location,jobbridge_companies(name)").eq("slug",slug).eq("status","active").not("source_url","ilike","%example.com%").maybeSingle();
  if(!job)return {title:"Guide not found | JobBridge India"};
  const company=Array.isArray(job.jobbridge_companies)?job.jobbridge_companies[0]:job.jobbridge_companies;
  return {title:`${job.title} at ${company?.name??"Employer"}: eligibility & how to apply | JobBridge India`,description:`Read the job description, location, skills and official application instructions for ${job.title}.`};
}

export default async function JobGuide({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const now=new Date().toISOString();
  const {data:job}=await supabase.from("jobbridge_jobs").select("id,title,slug,description,location,work_mode,employment_type,experience,salary_text,skills,source_name,source_url,apply_url,posted_at,expires_at,jobbridge_companies(name,website_url,description)").eq("slug",slug).eq("status","active").not("source_url","ilike","%example.com%").or(`expires_at.is.null,expires_at.gt.${now}`).maybeSingle();
  if(!job || !job.description || !job.source_url || !job.apply_url)notFound();
  const company=Array.isArray(job.jobbridge_companies)?job.jobbridge_companies[0]:job.jobbridge_companies;
  const published=job.posted_at?new Date(job.posted_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"Not provided by source";
  const deadline=job.expires_at?new Date(job.expires_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):"Not specified in the listing";
  return <main className="min-h-screen bg-slate-950 text-white"><article className="mx-auto max-w-3xl px-6 py-12"><Link href="/blog" className="text-cyan-300">← Career blog</Link><p className="mt-10 text-sm font-bold uppercase tracking-[.18em] text-cyan-300">Job application guide</p><h1 className="mt-3 text-4xl font-black leading-tight">{job.title} at {company?.name??"the employer"}: eligibility, skills and how to apply</h1><p className="mt-4 text-slate-400">{job.location??"Location not specified"} · {job.work_mode??"Work mode not specified"} · Published {published}</p><p className="mt-6 text-lg leading-8 text-slate-300">This guide summarizes the vacancy information available in the employer or recruitment source. Confirm the latest requirements, dates and application status on the original website before submitting your application.</p>
  <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-bold">Opportunity at a glance</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs uppercase text-slate-500">Employer</dt><dd className="mt-1">{company?.name??"Not stated"}</dd></div><div><dt className="text-xs uppercase text-slate-500">Location</dt><dd className="mt-1">{job.location??"Not stated"}</dd></div><div><dt className="text-xs uppercase text-slate-500">Work arrangement</dt><dd className="mt-1">{job.work_mode??"Not stated"}</dd></div><div><dt className="text-xs uppercase text-slate-500">Employment type</dt><dd className="mt-1">{job.employment_type??"Not stated"}</dd></div><div><dt className="text-xs uppercase text-slate-500">Experience</dt><dd className="mt-1">{job.experience??"Not stated"}</dd></div><div><dt className="text-xs uppercase text-slate-500">Compensation</dt><dd className="mt-1">{job.salary_text??"Not disclosed in the listing"}</dd></div><div><dt className="text-xs uppercase text-slate-500">Application deadline</dt><dd className="mt-1">{deadline}</dd></div></dl></section>
  <section className="mt-10"><h2 className="text-2xl font-bold">Role and responsibilities</h2><div className="mt-4 whitespace-pre-wrap leading-8 text-slate-300">{job.description}</div></section>
  <section className="mt-10"><h2 className="text-2xl font-bold">Skills mentioned</h2>{job.skills?.length?<ul className="mt-4 flex flex-wrap gap-2">{job.skills.map((skill:string)=><li key={skill} className="rounded-full border border-slate-700 px-3 py-2 text-sm">{skill}</li>)}</ul>:<p className="mt-3 text-slate-400">The source does not list specific skills in the structured vacancy details.</p>}</section>
  <section className="mt-10"><h2 className="text-2xl font-bold">How to apply</h2><ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-slate-300"><li>Open the original employer or recruitment source.</li><li>Read the complete notification and confirm that the vacancy is still open.</li><li>Check the official eligibility criteria, required documents and deadline.</li><li>Submit your application only through the official application destination.</li><li>Save the acknowledgement or application reference if one is provided.</li></ol><a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950">Open official application ↗</a></section>
  <section className="mt-10 border-t border-slate-800 pt-6"><h2 className="text-xl font-bold">Source and verification</h2><p className="mt-3 text-sm leading-6 text-slate-400">Source: {job.source_name??"Original employer source"}. This article is an independent summary, not an employer or government announcement. The source may change after publication; verify all details before applying.</p><a href={job.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-cyan-300 underline">View original source ↗</a></section>
  </article></main>;
}
