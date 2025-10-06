// src/lib/authStore.ts
import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { authService, Profile } from "./auth";
import { supabase } from "./supabase";

// Simplified types for college project - pragmatic approach
export type AppPickup = {
  id: number;
  user_id: string;
  material_code: string;
  weight_kg: number;
  status: "requested" | "collected" | "completed";
  coins_awarded: number | null;
  collector_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AuthState = {
  // auth + domain
  user: User | null;
  profile: Profile | null;
  loading: boolean;

  pickups: AppPickup[];

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: string
  ) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  loadProfile: () => Promise<void>;

  // Pickup actions (for both recycler and collector)
  requestPickup: (
    materialCode: string,
    weightKg: number
  ) => Promise<{ ok: boolean; error?: string }>;
  loadPickups: () => Promise<void>;
  markCollected: (
    pickupId: number,
    opts?: { coins_awarded?: number | null; collector_id?: string | null }
  ) => Promise<{ ok: boolean; error?: string }>;

  // Collector actions (for future dashboard)
  loadAllPickups: () => Promise<void>;
  assignPickup: (
    pickupId: number,
    collectorId: string
  ) => Promise<{ ok: boolean; error?: string }>;

  // Coin system
  updateUserCoins: (
    userId: string,
    coinsToAdd: number
  ) => Promise<{ ok: boolean; error?: string }>;

  // Testing helper
  switchRole: (
    newRole: "recycler" | "collector" | "admin"
  ) => Promise<{ ok: boolean; error?: string }>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  pickups: [],

  // ---------- Auth ----------
  signIn: async (email, password) => {
    const { data, error } = await authService.signIn(email, password);
    if (!error && data.user) {
      set({ user: data.user });
      // Load profile first, then pickups (sequential to avoid race conditions)
      await get().loadProfile();
      await get().loadPickups();
    }
    return { error };
  },

  signUp: async (email, password, fullName, role) => {
    const { data, error } = await authService.signUp(
      email,
      password,
      fullName,
      role
    );
    if (!error && data.user) {
      set({ user: data.user });
      // Load profile and pickups sequentially
      await get().loadProfile();
      await get().loadPickups();
    }
    return { error };
  },

  signOut: async () => {
    await authService.signOut();
    set({ user: null, profile: null, pickups: [], loading: false });
  },

  // Initialize app - check for existing session
  initialize: async () => {
    try {
      set({ loading: true });
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        set({ user: currentUser });
        await get().loadProfile();
        await get().loadPickups();
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error("Error initializing app:", error);
      set({ loading: false });
    }
  },

  loadProfile: async () => {
    const { user } = get();
    if (!user) {
      set({ loading: false });
      return;
    }

    console.log("Loading profile for user:", user.id);
    set({ loading: true });
    try {
      const profileData = await authService.getProfile(user.id);
      console.log("Loaded profile data:", profileData);
      set({ profile: profileData, loading: false });
    } catch (error) {
      console.error("Error loading profile:", error);
      set({ loading: false });
    }
  },

  // ---------- Pickup Operations ----------
  requestPickup: async (materialCode, weightKg) => {
    const { user, profile } = get();
    if (!user) return { ok: false, error: "Not authenticated" };

    try {
      // Ensure profile exists before creating pickup (only if not already loaded)
      if (!profile) {
        await get().loadProfile();
      }

      const { error } = await supabase.from("pickups").insert({
        user_id: user.id,
        material_code: materialCode,
        weight_kg: weightKg,
        status: "requested",
        coins_awarded: 0,
        collector_id: null,
      } as any); // Pragmatic fix - use any for college project

      if (error) {
        console.error("Error inserting pickup:", error);
        return { ok: false, error: error.message };
      }

      await get().loadPickups();
      return { ok: true };
    } catch (err: any) {
      console.error("Unexpected error:", err);
      return { ok: false, error: "Unexpected error occurred" };
    }
  },

  loadPickups: async () => {
    const { user } = get();
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pickups")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("loadPickups: Error loading pickups:", error);
        return;
      }

      // Cast to our AppPickup type and normalize weight
      const pickups = ((data as any[]) || []).map(
        (p: any): AppPickup => ({
          id: p.id,
          user_id: p.user_id,
          material_code: p.material_code,
          weight_kg:
            typeof p.weight_kg === "string"
              ? parseFloat(p.weight_kg)
              : p.weight_kg,
          status: p.status,
          coins_awarded: p.coins_awarded,
          collector_id: p.collector_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })
      );

      set({ pickups });
    } catch (err: any) {
      console.error("loadPickups: Error loading pickups:", err);
    }
  },

  markCollected: async (pickupId, opts) => {
    const { user } = get();
    const { coins_awarded = null, collector_id = null } = opts || {};

    if (!user) {
      console.error("markCollected: No user authenticated");
      return { ok: false, error: "Not authenticated" };
    }

    try {
      const updateData = {
        status: "collected",
        coins_awarded,
        collector_id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("pickups")
        .update(updateData as any)
        .eq("id", pickupId)
        .select(); // Add select to get back the updated row

      if (error) {
        console.error("markCollected: Supabase error:", error);
        return { ok: false, error: error.message };
      }

      if (!data || data.length === 0) {
        console.error(
          "markCollected: No rows updated - pickup not found or no permission"
        );
        return {
          ok: false,
          error: "Pickup not found or no permission to update",
        };
      }

      console.log("markCollected: Successfully updated pickup", pickupId);
      // Reload user pickups to refresh UI
      await get().loadPickups();
      return { ok: true };
    } catch (err: any) {
      console.error("markCollected: Exception:", err);
      return { ok: false, error: "Failed to update pickup" };
    }
  },

  // ---------- Collector Functions (for future dashboard) ----------
  loadAllPickups: async () => {
    try {
      const { data, error } = await supabase
        .from("pickups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading all pickups:", error);
        return;
      }

      // For now, just store in same pickups array
      // Later can separate into userPickups vs allPickups
      const pickups = ((data as any[]) || []).map(
        (p: any): AppPickup => ({
          id: p.id,
          user_id: p.user_id,
          material_code: p.material_code,
          weight_kg:
            typeof p.weight_kg === "string"
              ? parseFloat(p.weight_kg)
              : p.weight_kg,
          status: p.status,
          coins_awarded: p.coins_awarded,
          collector_id: p.collector_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })
      );

      set({ pickups });
    } catch (err: any) {
      console.error("Error loading all pickups:", err);
    }
  },

  assignPickup: async (pickupId, collectorId) => {
    try {
      const { error } = await supabase
        .from("pickups")
        .update({
          collector_id: collectorId,
          status: "collected",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", pickupId);

      if (error) {
        console.error("Error assigning pickup:", error);
        return { ok: false, error: error.message };
      }

      // Reload pickups to reflect changes
      const { profile } = get();
      if (profile?.role === "collector") {
        await get().loadAllPickups();
      } else {
        await get().loadPickups();
      }

      return { ok: true };
    } catch (err: any) {
      console.error("Error assigning pickup:", err);
      return { ok: false, error: "Failed to assign pickup" };
    }
  },

  // ---------- Coin System ----------
  updateUserCoins: async (userId: string, coinsToAdd: number) => {
    try {
      // First get current balance
      const { data: profileData, error: fetchError } = await supabase
        .from("profiles")
        .select("coins_balance")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Error fetching profile for coin update:", fetchError);
        return { ok: false, error: fetchError.message };
      }

      const currentBalance = profileData?.coins_balance || 0;
      const newBalance = currentBalance + coinsToAdd;

      // Update the balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          coins_balance: newBalance,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating coins:", updateError);
        return { ok: false, error: updateError.message };
      }

      // Refresh profile if it's the current user
      const { user } = get();
      if (user?.id === userId) {
        await get().loadProfile();
      }

      return { ok: true };
    } catch (err: any) {
      console.error("Error in coin update:", err);
      return { ok: false, error: "Failed to update coins" };
    }
  },

  // ---------- Testing Helper ----------
  switchRole: async (newRole: "recycler" | "collector" | "admin") => {
    try {
      const { user } = get();
      if (!user) return { ok: false, error: "Not authenticated" };

      const { error } = await supabase
        .from("profiles")
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", user.id);

      if (error) {
        console.error("Error switching role:", error);
        return { ok: false, error: error.message };
      }

      // Reload profile to get new role
      await get().loadProfile();
      return { ok: true };
    } catch (err: any) {
      console.error("Error switching role:", err);
      return { ok: false, error: "Failed to switch role" };
    }
  },
}));

/** Keep store in sync with auth changes - simplified for college project */
authService.onAuthStateChange(async (user) => {
  useAuthStore.setState({ user, loading: true });

  if (user) {
    // Load profile and pickups when user signs in
    try {
      await Promise.all([
        useAuthStore.getState().loadProfile(),
        useAuthStore.getState().loadPickups(),
      ]);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  } else {
    // Clear data when user signs out
    useAuthStore.setState({
      user: null,
      profile: null,
      pickups: [],
      loading: false,
    });
  }
});
