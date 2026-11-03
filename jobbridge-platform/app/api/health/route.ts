import { NextResponse } from "next/server";
import { getAIProviderStatus } from "../../../lib/ai/provider";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json({
    ok:true,service:"selectready-ai",ai:getAIProviderStatus(),
    databaseConfigured:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    timestamp:new Date().toISOString()
  });
}
