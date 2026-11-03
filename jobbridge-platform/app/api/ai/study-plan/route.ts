import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "../../../../lib/auth/require-user";
import { AIConfigurationError, AIProviderError, generateStructuredResponse } from "../../../../lib/ai/provider";
export const runtime = "nodejs";
type Plan = {days:Array<{day:number;focus:string;task:string;deliverable:string;estimated_minutes:number}>};

export async function POST(request:NextRequest) {
  const ctx=await getUserContext();
  if (!ctx) return NextResponse.json({error:"Sign in to create a preparation plan."},{status:401});
  const body=await request.json().catch(()=>null);
  const role=typeof body?.targetRole==="string"?body.targetRole.trim().slice(0,120):"";
  const gaps=Array.isArray(body?.skillGaps)?body.skillGaps.slice(0,15):[];
  const days=Number(body?.days)===14?14:7;
  if (!role) return NextResponse.json({error:"Enter a target role."},{status:400});
  const allowed=await consumeAiQuota(ctx.supabase,"study_plan").catch(()=>null);
  if(allowed===null)return NextResponse.json({error:"AI usage protection is unavailable; request blocked."},{status:503});
  if(!allowed)return NextResponse.json({error:"Free AI practice limit reached. Retry after a short break."},{status:429});
  try {
    const {data:plan,model}=await generateStructuredResponse<Plan>(
      "You are a practical career mentor for Indian freshers. Create a realistic daily plan. Recommend free learning activities by type, not invented URLs. Every task needs a measurable deliverable. Do not promise a job. Return JSON days[{day,focus,task,deliverable,estimated_minutes}].",
      JSON.stringify({target_role:role,skill_gaps:gaps,duration_days:days}),1800
    );
    if (!Array.isArray(plan.days) || plan.days.length!==days) return NextResponse.json({error:"The AI returned an incomplete plan. Retry."},{status:502});
    const {data:saved,error}=await ctx.supabase.from("learning_plans").insert({
      user_id:ctx.userId,target_role:role,duration_days:days,plan,model_name:model
    }).select("id").single();
    if (error || !saved) return NextResponse.json({error:"Plan generated but could not be saved."},{status:500});
    return NextResponse.json({plan,planId:saved.id});
  } catch (error) {
    if (error instanceof AIConfigurationError) return NextResponse.json({error:error.message,code:"AI_NOT_CONFIGURED"},{status:503});
    if (error instanceof AIProviderError) return NextResponse.json({error:error.message},{status:502});
    return NextResponse.json({error:"Could not create a preparation plan."},{status:500});
  }
}
