import { createSupabaseServerClient } from "../supabase/server";

export async function getUserContext() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || !userId) return null;
  return { supabase, userId };
}
