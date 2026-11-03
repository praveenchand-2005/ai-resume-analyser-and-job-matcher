import { supabase } from "./supabase";
export async function trackApplyClick(jobId:string){
  const { error } = await supabase.from("jobbridge_apply_clicks").insert({
    job_id:jobId,
    referrer:typeof document==="undefined"?null:document.referrer || null,
  });
  return !error;
}
