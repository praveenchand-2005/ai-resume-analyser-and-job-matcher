import { supabase } from "./supabase";

export async function trackApplyClick(jobId:number){
  const { error } = await supabase.from("jobbridge_apply_clicks").insert({job_id:jobId,referrer:typeof document==="undefined"?null:document.referrer,user_agent:typeof navigator==="undefined"?null:navigator.userAgent});
  return !error;
}