import Link from "next/link";

export default async function JobPage({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-3xl px-6 py-12"><Link href="/jobs" className="text-cyan-300">← All jobs</Link><h1 className="mt-8 text-4xl font-bold">Job details</h1><p className="mt-4 text-slate-400">Job: {slug}</p><p className="mt-6">This job-detail route is ready for the live Supabase record and employer application flow.</p></div></main>;
}