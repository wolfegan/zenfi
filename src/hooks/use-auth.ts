import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase-types";
import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        // Session exists → user is authenticated regardless of profile
        setIsAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Profile might not exist yet for new users (PGRST116 = no rows)
        if (error.code === "PGRST116") {
          const { data: authData } = await supabase.auth.getUser();
          const authUser = authData?.user;
          if (authUser) {
            // Try to create profile (best-effort, doesn't block auth)
            const newProfile: Omit<Profile, "id" | "created_at"> = {
              name: authUser.user_metadata?.name || null,
              email: authUser.email || null,
              is_anonymous: authUser.is_anonymous || false,
              monthly_income: null,
              financial_goal: null,
              onboarding_completed: null,
            };
            const { data: created, error: insertError } = await supabase
              .from("profiles")
              .insert({ id: authUser.id, ...newProfile })
              .select()
              .single();

            if (created) {
              setUser(created);
            } else if (insertError) {
              console.warn("Could not create profile:", insertError.message);
            }
          }
        } else {
          console.warn("Error fetching profile:", error.message);
        }
        setIsLoading(false);
        return;
      }

      setUser(data);
      setIsLoading(false);
    } catch (err) {
      console.warn("Error in fetchProfile:", err);
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
