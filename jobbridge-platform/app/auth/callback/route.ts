import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(request:NextRequest) {
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const rawNext=url.searchParams.get("next")||"/dashboard";
  const next=rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  if(code) {
    const supabase=await createSupabaseServerClient();
    const {error}=await supabase.auth.exchangeCodeForSession(code);
    if(!error) return NextResponse.redirect(new URL(next,request.url));
  }
  return NextResponse.redirect(new URL("/login?error=confirmation_failed",request.url));
}
