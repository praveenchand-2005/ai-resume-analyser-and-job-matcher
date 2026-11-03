import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("SelectReady Supabase preview configuration is missing.");
  if (!browserClient) browserClient = createBrowserClient(url, key);
  return browserClient;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, property) {
    const client = getSupabaseBrowserClient() as any;
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
