export async function consumeAiQuota(supabase:any,userId:string,action:string):Promise<boolean>{
 const {error}=await supabase.from("ai_usage_events").insert({
  user_id:userId,action:action.slice(0,60)
 });
 if(!error)return true;
 if(error.code==="P0001" || String(error.message||"").includes("AI_RATE_LIMIT_REACHED"))return false;
 throw new Error("AI usage protection unavailable.");
}
