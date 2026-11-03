import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "../../../../lib/auth/require-user";
import { AIConfigurationError, AIProviderError, generateStructuredResponse } from "../../../../lib/ai/provider";
import { consumeAiQuota } from "../../../../lib/ai/quota";
export const runtime = "nodejs";

type Review = {
  alignment_score:number; verdict:string; summary:string; strengths:string[];
  missing_skills:Array<{skill:string;importance:string;next_step:string}>;
  keyword_review:Array<{keyword:string;status:string;evidence:string}>;
  evidence_gaps:string[];
  bullet_rewrites:Array<{original:string;suggested:string;truth_check:string}>;
  interview_topics:string[];
  preparation_tasks:Array<{title:string;reason:string;estimated_minutes:number}>;
};

export async function POST(request:NextRequest) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({error:"Sign in to use AI resume review."},{status:401});
  const body = await request.json().catch(()=>null);
  const jd = typeof body?.jobDescription==="string"?body.jobDescription.trim():"";
  const role = typeof body?.targetRole==="string"?body.targetRole.trim().slice(0,120):"";
  let resumeText = typeof body?.resumeText==="string"?body.resumeText.trim():"";
  let resumeId = typeof body?.resumeId==="string"?body.resumeId:null;
  if (!jd || jd.length>18000) return NextResponse.json({error:"Paste a job description under 18,000 characters."},{status:400});
  if (resumeId) {
    const {data,error}=await ctx.supabase.from("candidate_resumes").select("id,extracted_text").eq("id",resumeId).eq("user_id",ctx.userId).maybeSingle();
    if (error || !data) return NextResponse.json({error:"Saved resume not found."},{status:404});
    resumeText = resumeText || data.extracted_text;
  }
  if (!resumeText || resumeText.length>30000) return NextResponse.json({error:"Resume text is required and must be under 30,000 characters."},{status:400});

  const allowed = await consumeAiQuota(ctx.supabase, "resume_review").catch(() => null);
  if (allowed === null) return NextResponse.json({ error: "AI usage protection is unavailable; request blocked." }, { status: 503 });
  if (!allowed) return NextResponse.json({ error: "Free AI practice limit reached. Retry after a short break." }, { status: 429 });

  try {
    const system = [
      "Evaluate a fresher or early-career candidate fairly against a supplied job description.",
      "Never invent skills, experience, metrics, employers, certifications or projects.",
      "Missing experience is a learning gap, not a personal failing. Do not predict an employer ATS decision.",
      "alignment_score is a transparent role-alignment estimate from 0 to 100, not an official ATS score.",
      "Return JSON fields: alignment_score, verdict, summary, strengths, missing_skills[{skill,importance,next_step}],",
      "keyword_review[{keyword,status,evidence}], evidence_gaps, bullet_rewrites[{original,suggested,truth_check}],",
      "interview_topics, preparation_tasks[{title,reason,estimated_minutes}]. Only rewrite bullets using supplied facts."
    ].join(" ");
    const {data:review,model}=await generateStructuredResponse<Review>(system,JSON.stringify({target_role:role,resume:resumeText,job_description:jd}),2400);
    const score=Math.max(0,Math.min(100,Math.round(Number(review.alignment_score)||0)));
    const {data:target,error:targetErr}=await ctx.supabase.from("job_targets").insert({user_id:ctx.userId,target_role:role||"Target role",description:jd}).select("id").single();
    if (targetErr || !target) return NextResponse.json({error:"Could not save the target job."},{status:500});
    if (!resumeId) {
      const {data:saved,error}=await ctx.supabase.from("candidate_resumes").insert({
        user_id:ctx.userId,title:role?role+" resume":"Reviewed resume",target_role:role||null,content:{},extracted_text:resumeText
      }).select("id").single();
      if (error || !saved) return NextResponse.json({error:"Review generated but resume could not be saved."},{status:500});
      resumeId=saved.id;
    }
    const {data:record,error}=await ctx.supabase.from("resume_analyses").insert({
      user_id:ctx.userId,resume_id:resumeId,job_target_id:target.id,alignment_score:score,analysis:review,model_name:model
    }).select("id").single();
    if (error || !record) return NextResponse.json({error:"Review generated but could not be saved."},{status:500});
    return NextResponse.json({analysis:{...review,alignment_score:score},resumeId,analysisId:record.id});
  } catch (error) {
    if (error instanceof AIConfigurationError) return NextResponse.json({error:error.message,code:"AI_NOT_CONFIGURED"},{status:503});
    if (error instanceof AIProviderError) return NextResponse.json({error:error.message},{status:502});
    return NextResponse.json({error:"Resume review failed. Please retry."},{status:500});
  }
}
