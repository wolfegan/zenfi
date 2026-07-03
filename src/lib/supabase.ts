import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

function makeClient(): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!);
}

// Build a query builder proxy that returns noop results for every chained call
function noopQuery() {
  const terminal = { data: null as any, error: null, count: null };
  const chain = new Proxy({} as any, {
    get(_target, prop: string) {
      if (prop === "then") {
        // Make the chain thenable so `await chain` resolves
        return (resolve: any) => resolve(terminal);
      }
      if (prop === "data" || prop === "error" || prop === "count") {
        return (terminal as any)[prop];
      }
      if (prop === "single" || prop === "maybeSingle") {
        return async () => terminal;
      }
      return () => chain;
    },
  });
  return chain;
}

// Mock Supabase client for when env vars are missing
function makeMockClient(): SupabaseClient {
  const noopAsync = async () => ({ data: null, error: null });
  const noopFn = () => {};

  return new Proxy({} as SupabaseClient, {
    get(_target, prop: string | symbol) {
      if (prop === "then" || prop === "catch") return undefined;

      // auth namespace
      if (prop === "auth") {
        return new Proxy({} as any, {
          get(_a, authProp: string) {
            if (authProp === "getSession") {
              return async () => ({ data: { session: null }, error: null });
            }
            if (authProp === "onAuthStateChange") {
              return () => ({
                data: { subscription: { unsubscribe: noopFn } },
              });
            }
            if (authProp === "getUser") {
              return async () => ({ data: { user: null }, error: null });
            }
            if (authProp === "signUp") return noopAsync;
            if (authProp === "signInWithPassword") return noopAsync;
            if (authProp === "signInAnonymously") return noopAsync;
            if (authProp === "signOut") return noopAsync;
            return noopAsync;
          },
        });
      }

      // from() → query builder
      if (prop === "from") return () => noopQuery();

      return noopAsync;
    },
  });
}

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? makeClient()
  : makeMockClient();
