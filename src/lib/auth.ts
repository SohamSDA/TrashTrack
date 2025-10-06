// src/lib/auth.ts
import { User } from "@supabase/supabase-js";
import { Database, supabase } from "./supabase";

/** Row type from the DB */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = "recycler" | "collector" | "admin";

export class AuthService {
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: string
  ) {
    console.log("SignUp called with:", { email, fullName, role });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // user_metadata: this is fine; you can read it later via auth.getUser()
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    console.log("SignUp result:", { data: data?.user?.user_metadata, error });

    // If you do NOT have a DB trigger to create profiles, you can eagerly upsert:
    // if (!error && data.user) {
    //   await supabase.from("profiles").upsert({
    //     id: data.user.id,
    //     full_name: fullName,
    //     role: "recycler",
    //     coins_balance: 0,
    //   });
    // }

    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  }

  /**
   * Returns the profile row or creates one if not found.
   * Uses upsert to handle race conditions safely.
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      // First try to get existing profile
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      // If profile exists, return it
      if (data) {
        return data as Profile;
      }

      // If no profile exists, use upsert to create one safely
      console.log("No profile found, creating one for user:", userId);
      const { data: upsertData, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: userId,
            full_name: "User", // Default name
            role: "recycler" as UserRole,
            coins_balance: 0,
          },
          {
            onConflict: "id", // Handle conflicts on the id field
          }
        )
        .select()
        .single();

      if (upsertError) {
        console.error("Error upserting profile:", upsertError);

        // If upsert fails, try one more time to fetch (profile might have been created by another request)
        const { data: retryData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        return (retryData as Profile) ?? null;
      }

      return upsertData as Profile;
    } catch (err) {
      console.error("Unexpected error in getProfile:", err);
      return null;
    }
  }

  /**
   * Partial update to profiles. Handles nullable timestamps.
   */
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    return { data: data as Profile, error };
  }

  async updateUserRole(userId: string, role: UserRole) {
    return this.updateProfile(userId, { role });
  }

  async getAllUsers(): Promise<Profile[]> {
    // Note: This requires RLS policy permitting the caller to read others' profiles.
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return (data as Profile[]) ?? [];
  }

  /**
   * Safely increments coins_balance (null-safe).
   * If you truly don’t use coins anymore, you can delete this.
   */
  async updateCoinsBalance(userId: string, amount: number) {
    const profile = await this.getProfile(userId);
    if (!profile) return { error: "Profile not found" };

    const current = profile.coins_balance ?? 0;
    const next = current + amount;

    return this.updateProfile(userId, {
      coins_balance: Math.max(0, next),
    });
  }

  /**
   * Auth state listener that returns an unsubscribe function.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }
}

export const authService = new AuthService();
