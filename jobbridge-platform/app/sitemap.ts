import type { MetadataRoute } from "next";
import { supabase } from "../lib/supabase";

export const revalidate = 300;

export default async function sitemap():Promise<MetadataRoute.Sitemap> {
  const base = "https://jobbridge-india.vercel.app";
  const now = new Date().toISOString();
  const {data:jobs} = await supabase
    .from("jobbridge_jobs")
    .select("slug,updated_at,posted_at,expires_at")
    .eq("status","active")
    .not("source_url","ilike","%example.com%")
    .or(`expires_at.is.null,expires_at.gt.${now}`);
  const jobUrls:MetadataRoute.Sitemap = (jobs ?? []).flatMap((job:any) => {
    const modified = new Date(job.updated_at ?? job.posted_at ?? Date.now());
    return [
      {url:`${base}/jobs/${job.slug}`,lastModified:modified,changeFrequency:"daily",priority:0.8},
      {url:`${base}/blog/${job.slug}`,lastModified:modified,changeFrequency:"daily",priority:0.7}
    ];
  });
  return [
    {url:base,lastModified:new Date(),changeFrequency:"daily",priority:1},
    {url:`${base}/jobs`,lastModified:new Date(),changeFrequency:"hourly",priority:0.9},
    {url:`${base}/blog`,lastModified:new Date(),changeFrequency:"daily",priority:0.8},
    {url:`${base}/sources`,lastModified:new Date(),changeFrequency:"weekly",priority:0.5},
    {url:`${base}/about`,lastModified:new Date(),changeFrequency:"monthly",priority:0.3},
    ...jobUrls
  ];
}
