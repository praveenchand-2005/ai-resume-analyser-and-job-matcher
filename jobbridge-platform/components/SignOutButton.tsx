"use client";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../lib/supabase";
export default function SignOutButton(){const router=useRouter();return <button className="rounded-xl border border-[#ded8cd] px-4 py-2 text-sm font-semibold" onClick={async()=>{await getSupabaseBrowserClient().auth.signOut();router.push("/login");router.refresh();}}>Sign out</button>;}
