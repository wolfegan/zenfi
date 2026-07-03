import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase-types";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
        setIsAuthenticated(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Profile might not exist yet for new users
        if (error.code === "PGRST116") {
          const authUser = (await supabase.auth.getUser()).data.user;
          if (authUser) {
            // Create profile
            const newProfile: Omit<Profile, "id" | "created_at"> = {
              name: authUser.user_metadata?.name || null,
              email: authUser.email || null,
              is_anonymous: authUser.is_anonymous || false,
              monthly_income: null,
              financial_goal: null,
              onboarding_completed: null,
            };
            const { data: created } = await supabase
              .from("profiles")
              .insert({ id: authUser.id, ...newProfile })
              .select()
              .single();
            if (created) {
              setUser(created);
              setIsAuthenticated(true);
            }
          }
        }
        setIsLoading(false);
        return;
      }

      setUser(data);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInAnonymously() {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setIsAuthenticated(false);
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    signUpWithEmail,
    signInWithEmail,
    signInAnonymously,
    signOut,
  };
}
