import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return _client;
}

// Proxy that lazily creates the real client on first access
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string | symbol) {
    if (prop === "then" || prop === "catch") return undefined;
    return (getClient() as any)[prop];
  },
});
