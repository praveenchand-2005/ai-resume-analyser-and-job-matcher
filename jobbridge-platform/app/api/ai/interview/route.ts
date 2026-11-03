import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "../../../../lib/auth/require-user";
import { AIConfigurationError, AIProviderError, generateStructuredResponse } from "../../../../lib/ai/provider";
import { consumeAiQuota } from "../../../../lib/ai/quota";
export const runtime = "nodejs";

type Question = {question:string;focus_skill:string;difficulty:"beginner"|"intermediate"|"advanced"};
type Evaluation = {score:number;verdict:string;strengths:string[];improvements:string[];model_answer:string;next_question:string|null;next_focus_skill:string|null;next_difficulty:"beginner"|"intermediate"|"advanced"};

export async function POST(request:NextRequest) {
  const ctx=await getUserContext();
  if (!ctx) return NextResponse.json({error:"Sign in to start an interview session."},{status:401});
  const body=await request.json().catch(()=>null);
  if (!body || typeof body.action!=="string") return NextResponse.json({error:"Choose an interview action."},{status:400});
  if (!["start","answer"].includes(body.action)) return NextResponse.json({error:"Unsupported interview action."},{status:400});
  const allowed=await consumeAiQuota(ctx.supabase,ctx.userId,"interview_"+body.action).catch(()=>null);
  if(allowed===null)return NextResponse.json({error:"AI usage protection is unavailable; request blocked."},{status:503});
  if(!allowed)return NextResponse.json({error:"Free AI practice limit reached. Retry after a short break."},{status:429});
  try {
    if (body.action==="start") {
      const role=typeof body.targetRole==="string"?body.targetRole.trim().slice(0,120):"";
      const type=typeof body.interviewType==="string"?body.interviewType:"technical";
      const level=typeof body.experienceLevel==="string"?body.experienceLevel.slice(0,40):"fresher";
      if (!role) return NextResponse.json({error:"Enter the role you are preparing for."},{status:400});
      if (!["technical","hr","behavioral","sql","python","project"].includes(type)) return NextResponse.json({error:"Unsupported interview type."},{status:400});
      const {data:first,model}=await generateStructuredResponse<Question>(
        "You are a supportive but rigorous interviewer coaching an Indian fresher. Ask one realistic question for the specified role, type and level. Return JSON with question, focus_skill, difficulty.",
        JSON.stringify({target_role:role,interview_type:type,level}),700
      );
      const {data:session,error}=await ctx.supabase.from("interview_sessions").insert({
        user_id:ctx.userId,target_role:role,interview_type:type,experience_level:level,status:"in_progress",max_turns:6
      }).select("id").single();
      if (error || !session) return NextResponse.json({error:"Could not create the interview session."},{status:500});
      const {data:turn,error:turnErr}=await ctx.supabase.from("interview_turns").insert({
        user_id:ctx.userId,session_id:session.id,turn_number:1,question:first.question,focus_skill:first.focus_skill,difficulty:first.difficulty,model_name:model
      }).select("id,turn_number,question,focus_skill,difficulty").single();
      if (turnErr || !turn) return NextResponse.json({error:"Could not save the first question."},{status:500});
      return NextResponse.json({sessionId:session.id,turn,completed:false});
    }
    if (body.action==="answer") {
      const sessionId=typeof body.sessionId==="string"?body.sessionId:"";
      const answer=typeof body.answer==="string"?body.answer.trim():"";
      if (!sessionId || !answer || answer.length>8000) return NextResponse.json({error:"A session and an answer under 8,000 characters are required."},{status:400});
      const {data:session,error:sErr}=await ctx.supabase.from("interview_sessions").select("id,target_role,interview_type,experience_level,max_turns,status").eq("id",sessionId).eq("user_id",ctx.userId).maybeSingle();
      if (sErr || !session || session.status!=="in_progress") return NextResponse.json({error:"Interview session not found or already completed."},{status:404});
      const {data:current,error:cErr}=await ctx.supabase.from("interview_turns").select("id,turn_number,question,focus_skill").eq("session_id",sessionId).eq("user_id",ctx.userId).is("answer",null).order("turn_number",{ascending:false}).limit(1).maybeSingle();
      if (cErr || !current) return NextResponse.json({error:"No unanswered question was found."},{status:409});
      const finalTurn=current.turn_number >= (session.max_turns||6);
      const {data:evaluation,model}=await generateStructuredResponse<Evaluation>(
        "You evaluate fresher interview answers fairly. Score 0-100 on correctness, reasoning, structure and clarity. Be specific and constructive; do not judge the person's worth or reward fabricated claims. Return JSON: score, verdict, strengths[], improvements[], model_answer, next_question (null if final), next_focus_skill, next_difficulty.",
        JSON.stringify({role:session.target_role,type:session.interview_type,level:session.experience_level,question:current.question,focus_skill:current.focus_skill,candidate_answer:answer,final_turn:finalTurn}),1400
      );
      const score=Math.max(0,Math.min(100,Math.round(Number(evaluation.score)||0)));
      const {error:updateErr}=await ctx.supabase.from("interview_turns").update({answer,score,evaluation,model_name:model}).eq("id",current.id).eq("user_id",ctx.userId).is("answer",null);
      if (updateErr) return NextResponse.json({error:"Could not save the evaluated answer."},{status:500});
      let nextTurn=null;
      const nextQuestion=typeof evaluation.next_question==="string"?evaluation.next_question.trim():"";
      if (!finalTurn && nextQuestion) {
        const {data,error}=await ctx.supabase.from("interview_turns").insert({
          user_id:ctx.userId,session_id:sessionId,turn_number:current.turn_number+1,question:nextQuestion,
          focus_skill:evaluation.next_focus_skill||"Role fundamentals",difficulty:evaluation.next_difficulty||"beginner",model_name:model
        }).select("id,turn_number,question,focus_skill,difficulty").single();
        if (error) return NextResponse.json({error:"Answer evaluated, but the next question could not be saved."},{status:500});
        nextTurn=data;
      } else {
        await ctx.supabase.from("interview_sessions").update({status:"completed",completed_at:new Date().toISOString()}).eq("id",sessionId).eq("user_id",ctx.userId);
      }
      return NextResponse.json({evaluation:{...evaluation,score},nextTurn,completed:!nextTurn});
    }
    return NextResponse.json({error:"Unsupported interview action."},{status:400});
  } catch (error) {
    if (error instanceof AIConfigurationError) return NextResponse.json({error:error.message,code:"AI_NOT_CONFIGURED"},{status:503});
    if (error instanceof AIProviderError) return NextResponse.json({error:error.message},{status:502});
    return NextResponse.json({error:"Interview operation failed. Please retry."},{status:500});
  }
}
