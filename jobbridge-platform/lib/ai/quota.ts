export async function consumeAiQuota(supabase:any,action:string):Promise<boolean>{
 const {data,error}=await supabase.rpc("claim_selectready_ai_request",{p_action:action,p_per_minute:8,p_per_day:40});
 if(error)throw new Error("AI usage protection unavailable.");
 return data===true;
}
