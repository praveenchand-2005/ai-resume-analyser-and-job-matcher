import { NextRequest, NextResponse } from "next/server";
import { getUserContext } from "../../../lib/auth/require-user";
export const runtime = "nodejs";

export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({error:"Sign in to view saved resumes."},{status:401});
  const {data,error} = await ctx.supabase.from("candidate_resumes")
    .select("id,title,target_role,content,created_at,updated_at")
    .eq("user_id",ctx.userId).order("updated_at",{ascending:false}).limit(20);
  if (error) return NextResponse.json({error:"Could not load saved resumes."},{status:500});
  return NextResponse.json({resumes:data ?? []});
}

export async function POST(request:NextRequest) {
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({error:"Sign in to save your resume."},{status:401});
  const body = await request.json().catch(()=>null);
  const text = typeof body?.extractedText === "string" ? body.extractedText.trim() : "";
  if (!text || text.length > 30000) return NextResponse.json({error:"Resume text is required and must be under 30,000 characters."},{status:400});
  const {data,error} = await ctx.supabase.from("candidate_resumes").insert({
    user_id:ctx.userId,title:typeof body.title==="string"?body.title.slice(0,120):"My resume",
    target_role:typeof body.targetRole==="string"?body.targetRole.slice(0,120):null,
    content:body.content && typeof body.content==="object"?body.content:{},extracted_text:text
  }).select("id,title,target_role,created_at").single();
  if (error) return NextResponse.json({error:"Could not save the resume."},{status:500});
  return NextResponse.json({resume:data},{status:201});
}
