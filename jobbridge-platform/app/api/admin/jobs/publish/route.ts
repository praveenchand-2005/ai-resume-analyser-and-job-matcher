import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { buildJobGuide, buildShortVideo, JobForContent } from "../../../../lib/jobbridgeContent";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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
  const body = await request.json().catch(() => null) as { job_id?: string; publish_article?: boolean; queue_videos?: boolean } | null;
  if (!body?.job_id) return NextResponse.json({ error: "job_id is required." }, { status: 400 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: job, error } = await supabase.from("jobbridge_jobs").select("*,jobbridge_companies(name)").eq("id", body.job_id).maybeSingle();
  if (error || !job) return NextResponse.json({ error: "Job not found.", detail: error?.message }, { status: 404 });
  const validHttps = (value: string | null) => { try { return !!value && new URL(value).protocol === "https:"; } catch { return false; } };
  if (!validHttps(job.source_url) || !validHttps(job.apply_url)) return NextResponse.json({ error: "A verified job must have HTTPS source and application URLs." }, { status: 422 });
  if (job.expires_at && new Date(job.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: "This vacancy is already expired." }, { status: 422 });
  const now = new Date().toISOString();
  const { error: updateError } = await supabase.from("jobbridge_jobs").update({ status: "active", verification_status: "verified", verified_at: now, last_checked_at: now, updated_at: now }).eq("id", job.id);
  if (updateError) return NextResponse.json({ error: "Could not publish job.", detail: updateError.message }, { status: 500 });
  const contentJob = job as JobForContent;
  const outputs: Record<string, unknown> = { job_id: job.id, status: "published" };
  if (body.publish_article !== false) {
    const article = buildJobGuide(contentJob);
    const result = await supabase.from("jobbridge_articles").upsert({ job_id: job.id, slug: job.slug, ...article, status: "published", published_at: now, updated_at: now }, { onConflict: "job_id" });
    if (result.error) return NextResponse.json({ error: "Job is live but article generation failed.", detail: result.error.message, job_id: job.id }, { status: 207 });
    outputs.article = "published";
  }
  if (body.queue_videos !== false) {
    const videos = (["youtube_shorts", "instagram_reels"] as const).map((platform) => ({ job_id: job.id, ...buildShortVideo(contentJob, platform), status: "draft", updated_at: now }));
    const result = await supabase.from("jobbridge_video_queue").upsert(videos, { onConflict: "job_id,platform" });
    if (result.error) return NextResponse.json({ error: "Job and article published, but video queue failed.", detail: result.error.message, ...outputs }, { status: 207 });
    outputs.video_queue = ["youtube_shorts", "instagram_reels"];
  }
  return NextResponse.json(outputs);
}
