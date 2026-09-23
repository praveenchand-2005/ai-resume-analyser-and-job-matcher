"use client";

import { useState } from "react";
import { trackApplyClick } from "../lib/applyClick";

export default function ApplyButton({jobId,applyUrl}:{jobId:number;applyUrl:string}) {
  const [loading,setLoading]=useState(false);
  async function handleApply(){
    setLoading(true);
    await trackApplyClick(jobId);
    window.location.href=applyUrl;
  }
  return <button onClick={handleApply} disabled={loading} className="mt-8 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 disabled:opacity-60">{loading?"Opening employer site…":"Apply on employer site"}</button>;
}