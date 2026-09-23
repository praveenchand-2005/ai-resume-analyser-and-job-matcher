"use client";

export default function JobSearchLink({href="/jobs"}:{href?:string}) {
  return <a href={href} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400 hover:text-cyan-300">Browse all jobs</a>;
}