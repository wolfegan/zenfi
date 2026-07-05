import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

function createMockSupabaseClient(): any {
  let session: any = null;
  const listeners = new Set<(event: string, session: any) => void>();

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session }, error: null }),
      getUser: () => Promise.resolve({ data: { user: session?.user ?? null }, error: null }),
      onAuthStateChange: (callback: any) => {
        listeners.add(callback);
        // Call it immediately with current session to resolve loading states
        setTimeout(() => callback(session ? "SIGNED_IN" : "SIGNED_OUT", session), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(callback);
              },
            },
          },
        };
      },
      signInAnonymously: () => {
        session = {
          user: {
            id: "guest-user",
            is_anonymous: true,
            email: "convidado@financas.com",
            user_metadata: { name: "Convidado" }
          }
        };
        listeners.forEach(cb => cb("SIGNED_IN", session));
        return Promise.resolve({ data: session, error: null });
      },
      signInWithPassword: ({ email }: any) => {
        session = {
          user: {
            id: "guest-user",
            is_anonymous: false,
            email,
            user_metadata: { name: email.split("@")[0] }
          }
        };
        listeners.forEach(cb => cb("SIGNED_IN", session));
        return Promise.resolve({ data: session, error: null });
      },
      signUp: ({ email }: any) => {
        session = {
          user: {
            id: "guest-user",
            is_anonymous: false,
            email,
            user_metadata: { name: email.split("@")[0] }
          }
        };
        listeners.forEach(cb => cb("SIGNED_IN", session));
        return Promise.resolve({ data: session, error: null });
      },
      signOut: () => {
        session = null;
        listeners.forEach(cb => cb("SIGNED_OUT", null));
        return Promise.resolve({ error: null });
      },
    },
    from: () => {
      const builder = {
        select: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        eq: () => builder,
        order: () => builder,
        single: () => Promise.resolve({ data: null, error: { code: "PGRST116", message: "No rows" } }),
        then: (resolve: any) => resolve({ data: [], error: null }),
      };
      return builder;
    },
  };
}

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    if (!_client) {
      _client = createMockSupabaseClient() as SupabaseClient;
    }
    return _client;
  }
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
