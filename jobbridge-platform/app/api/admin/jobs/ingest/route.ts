import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type IncomingJob = {
  title: string; company_name: string; company_website?: string;
  location?: string | null; work_mode?: "remote" | "hybrid" | "onsite" | null;
  employment_type?: string | null; experience?: string | null; salary_text?: string | null;
  skills?: string[]; description?: string | null; source_name: string; source_url: string;
  source_type?: "employer" | "government" | "rss" | "greenhouse" | "lever" | "manual";
  apply_url: string; posted_at?: string | null; expires_at?: string | null; external_id?: string | null;
};
function isHttpsUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
}
function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "job";
}
function authorized(request: NextRequest) {
  const expected = process.env.JOBBRIDGE_INGEST_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server database credentials are not configured." }, { status: 503 });
  let payload: { jobs?: IncomingJob[] };
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  if (!Array.isArray(payload.jobs) || payload.jobs.length < 1 || payload.jobs.length > 50)
    return NextResponse.json({ error: "Provide between 1 and 50 jobs." }, { status: 400 });
  const invalid = payload.jobs.find((job) => !job.title?.trim() || !job.company_name?.trim() || !job.source_name?.trim() || !isHttpsUrl(job.source_url) || !isHttpsUrl(job.apply_url) || (job.company_website && !isHttpsUrl(job.company_website)));
  if (invalid) return NextResponse.json({ error: "Every job needs a title, company, source name, and HTTPS source/application URLs." }, { status: 400 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const run = await supabase.from("jobbridge_ingestion_runs").insert({ status: "running", found_count: payload.jobs.length }).select("id").single();
  if (run.error || !run.data) return NextResponse.json({ error: "Could not start ingestion audit.", detail: run.error?.message }, { status: 500 });
  let inserted = 0; let rejected = 0; const errors: string[] = [];
  for (const job of payload.jobs) {
    const sourceUrl = new URL(job.source_url).toString();
    const source = await supabase.from("jobbridge_sources").upsert({
      name: job.source_name.trim(), source_type: job.source_type ?? "employer", source_url: sourceUrl, is_active: true
    }, { onConflict: "source_url" }).select("id").single();
    if (source.error || !source.data) { rejected++; errors.push(`${job.title}: source registry upsert failed`); continue; }
    const company = await supabase.from("jobbridge_companies").upsert({
      name: job.company_name.trim(), slug: slugify(job.company_name), website_url: job.company_website ?? null
    }, { onConflict: "slug" }).select("id").single();
    if (company.error || !company.data) { rejected++; errors.push(`${job.title}: company upsert failed`); continue; }
    const hash = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 10);
    const record = {
      company_id: company.data.id, source_id: source.data.id, title: job.title.trim(), slug: `${slugify(job.title)}-${hash}`,
      location: job.location ?? null, work_mode: job.work_mode ?? null,
      employment_type: job.employment_type ?? null, experience: job.experience ?? null,
      salary_text: job.salary_text ?? null, skills: job.skills ?? [], description: job.description ?? null,
      source_name: job.source_name.trim(), source_url: sourceUrl, apply_url: new URL(job.apply_url).toString(),
      posted_at: job.posted_at ?? new Date().toISOString(), expires_at: job.expires_at ?? null,
      external_id: job.external_id ?? null, verification_status: "pending", status: "draft",
      last_checked_at: new Date().toISOString()
    };
    const result = await supabase.from("jobbridge_jobs").upsert(record, { onConflict: "source_url" });
    if (result.error) { rejected++; errors.push(`${job.title}: ${result.error.message}`); } else inserted++;
  }
  await supabase.from("jobbridge_ingestion_runs").update({
    completed_at: new Date().toISOString(), status: rejected === 0 ? "succeeded" : inserted > 0 ? "partial" : "failed",
    inserted_count: inserted, rejected_count: rejected, metadata: { errors: errors.slice(0, 20) }
  }).eq("id", run.data.id);
  return NextResponse.json({ run_id: run.data.id, received: payload.jobs.length, upserted: inserted, rejected, errors }, { status: rejected ? 207 : 200 });
}
