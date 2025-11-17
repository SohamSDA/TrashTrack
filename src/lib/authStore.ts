import { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { authService, Profile } from "./auth";
import { supabase } from "./supabase";

export type AppPickup = {
  id: number;
  user_id: string;
  material_code: string;
  weight_kg: number;
  status: "requested" | "assigned" | "collected" | "completed";
  coins_awarded: number | null;
  collector_id: string | null;
  collector_name: string | null;
  collector_phone: string | null;
  pickup_address: string | null;
  contact_number: string | null;
  contact_name: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AuthState = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;

  pickups: AppPickup[];

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

  requestPickup: (
    materialCode: string,
    weightKg: number,
    pickupAddress?: string,
    contactNumber?: string,
    contactName?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  loadPickups: () => Promise<void>;
  markCollected: (
    pickupId: number,
    opts?: { coins_awarded?: number | null; collector_id?: string | null }
  ) => Promise<{ ok: boolean; error?: string }>;

  loadAllPickups: () => Promise<void>;
  assignPickup: (
    pickupId: number,
    collectorId?: string
  ) => Promise<{ ok: boolean; error?: string }>;

  updateUserCoins: (
    userId: string,
    coinsToAdd: number
  ) => Promise<{ ok: boolean; error?: string }>;

  // Testing helper
  switchRole: (
    newRole: "recycler" | "collector" | "admin"
  ) => Promise<{ ok: boolean; error?: string }>;

  // Fix existing pickups - award coins retroactively
  fixExistingPickups: () => Promise<{ ok: boolean; error?: string }>;
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
    try {
      // Set loading state immediately to prevent showing empty dashboard
      set({ loading: true });

      await authService.signOut();
      set({ user: null, profile: null, pickups: [], loading: false });
      console.log("User successfully signed out");

      // Reset navigation state so the index can navigate again after logout
      const { resetNavigation } = await import("../app/index");
      resetNavigation();

      // Import router dynamically to avoid circular dependency
      const { router } = await import("expo-router");
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still clear local state even if there's an error
      set({ user: null, profile: null, pickups: [], loading: false });

      // Reset navigation state
      const { resetNavigation } = await import("../app/index");
      resetNavigation();

      // Still try to navigate even on error
      const { router } = await import("expo-router");
      router.replace("/(auth)/login");
    }
  }, // Initialize app - check for existing session
  initialize: async () => {
    try {
      set({ loading: true });
      const currentUser = await authService.getCurrentUser();
      console.log("👤 Current user from auth:", {
        exists: !!currentUser,
        id: currentUser?.id?.slice(0, 8),
        email: currentUser?.email,
      });

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

    set({ loading: true });
    try {
      const profileData = await authService.getProfile(user.id);
      set({ profile: profileData, loading: false });
    } catch (error) {
      console.error("Error loading profile:", error);
      set({ loading: false });
    }
  },

  // ---------- Pickup Operations ----------
  requestPickup: async (
    materialCode,
    weightKg,
    pickupAddress,
    contactNumber,
    contactName
  ) => {
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
        pickup_address: pickupAddress || null,
        contact_number: contactNumber || null,
        contact_name: contactName || null,
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
          collector_name: p.collector_name || null,
          collector_phone: p.collector_phone || null,
          pickup_address: p.pickup_address,
          contact_number: p.contact_number,
          contact_name: p.contact_name,
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
      // First get the pickup details to calculate coins
      const { data: pickupData, error: fetchError } = await supabase
        .from("pickups")
        .select("*")
        .eq("id", pickupId)
        .single();

      if (fetchError || !pickupData) {
        console.error("markCollected: Error fetching pickup:", fetchError);
        return { ok: false, error: "Pickup not found" };
      }

      // Calculate coins using material classes
      let calculatedCoins = 0;
      try {
        const { materialFactory } = await import("./domain/materials");
        const materialCode = pickupData.material_code.toUpperCase() as
          | "PAPER"
          | "PLASTIC"
          | "IRON";
        const material = materialFactory(materialCode);
        calculatedCoins = material.coinsFor(pickupData.weight_kg);
        console.log(
          `Calculated ${calculatedCoins} coins for ${materialCode} ${pickupData.weight_kg}kg`
        );
      } catch (err) {
        console.error("Error calculating coins:", err);
        // Fallback calculation
        const rates = { paper: 2, plastic: 3, iron: 6 };
        const rate = rates[pickupData.material_code as keyof typeof rates] || 2;
        calculatedCoins = Math.round(rate * pickupData.weight_kg);
      }

      const finalCoins =
        coins_awarded !== null ? coins_awarded : calculatedCoins;

      const updateData = {
        status: "collected",
        coins_awarded: finalCoins,
        collector_id,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("pickups")
        .update(updateData as any)
        .eq("id", pickupId)
        .select();

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

      // Award coins to the user
      if (finalCoins > 0 && pickupData.user_id) {
        console.log(
          `Awarding ${finalCoins} coins to user ${pickupData.user_id}`
        );
        const coinResult = await get().updateUserCoins(
          pickupData.user_id,
          finalCoins
        );
        if (!coinResult.ok) {
          console.error("Failed to award coins:", coinResult.error);
        }
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

  // ---------- Collector Functions ----------
  loadAllPickups: async () => {
    try {
      const { user } = get();
      if (!user) {
        console.error("No user found for loadAllPickups");
        return;
      }

      // For collectors, only load:
      // 1. Available pickups (status = 'requested', no collector assigned)
      // 2. Assigned pickups (status = 'assigned', collector_id = their id)
      // 3. Pickups they have collected (status = 'collected', collector_id = their id)
      const { data, error } = await supabase
        .from("pickups")
        .select("*")
        .or(
          `and(status.eq.requested,collector_id.is.null),and(status.eq.assigned,collector_id.eq.${user.id}),and(status.eq.collected,collector_id.eq.${user.id})`
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading collector-specific pickups:", error);
        return;
      }

      // Transform the data
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
          collector_name: p.collector_name || null,
          collector_phone: p.collector_phone || null,
          pickup_address: p.pickup_address,
          contact_number: p.contact_number,
          contact_name: p.contact_name,
          created_at: p.created_at,
          updated_at: p.updated_at,
        })
      );

      set({ pickups });
      console.log(
        `Loaded ${pickups.length} collector-specific pickups for user ${user.id}`
      );
    } catch (err: any) {
      console.error("Error loading collector-specific pickups:", err);
    }
  },

  assignPickup: async (pickupId, collectorId) => {
    try {
      const { user, profile } = get();

      // If collectorId not provided, use current user
      const targetCollectorId = collectorId || user?.id;

      if (!targetCollectorId) {
        return { ok: false, error: "No collector ID available" };
      }

      console.log("[assignPickup] Starting assignment:", {
        pickupId,
        collectorId: targetCollectorId,
      });
      console.log("[assignPickup] Current user:", {
        id: user?.id,
        email: user?.email,
      });
      console.log("[assignPickup] Current profile:", {
        full_name: profile?.full_name,
        role: profile?.role,
      });

      // Get collector's profile info (if not current user, fetch it)
      let collectorName = null;
      let collectorPhone = null;

      if (targetCollectorId === user?.id) {
        // Use current user's info
        collectorName =
          profile?.full_name ||
          user?.user_metadata?.full_name ||
          user?.email ||
          null;
        collectorPhone = user?.phone || user?.user_metadata?.phone || null;

        console.log("[assignPickup] Using current user's info:", {
          collectorName,
          collectorPhone,
        });
      } else {
        // Fetch other collector's info
        const { data: collectorProfile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", targetCollectorId)
          .single();

        if (!profileError && collectorProfile) {
          collectorName = collectorProfile.full_name;
        }

        console.log("[assignPickup] Fetched collector info:", {
          collectorName,
          error: profileError,
        });
      }

      console.log("[assignPickup] Updating pickup with:", {
        collector_id: targetCollectorId,
        collector_name: collectorName,
        collector_phone: collectorPhone,
        status: "assigned",
      });

      const { error } = await supabase
        .from("pickups")
        .update({
          collector_id: targetCollectorId,
          collector_name: collectorName,
          collector_phone: collectorPhone,
          status: "assigned",
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", pickupId);

      if (error) {
        console.error("Error assigning pickup:", error);
        return { ok: false, error: error.message };
      }

      console.log("[assignPickup] Successfully updated pickup in database");

      // Reload pickups to reflect changes
      if (profile?.role === "collector") {
        await get().loadAllPickups();
        console.log("[assignPickup] Reloaded pickups for collector");
      } else {
        await get().loadPickups();
        console.log("[assignPickup] Reloaded pickups for recycler");
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

  // Fix existing pickups - award coins retroactively
  fixExistingPickups: async () => {
    try {
      console.log("Starting fixExistingPickups...");

      // First, reset all user coins to 0 to recalculate properly
      const { error: resetError } = await supabase
        .from("profiles")
        .update({ coins_balance: 0 })
        .eq("role", "recycler");

      if (resetError) {
        console.error("Error resetting coins:", resetError);
        return { ok: false, error: resetError.message };
      }

      console.log("Reset all recycler coins to 0");

      // Get all collected pickups (regardless of coins_awarded status)
      const { data: pickups, error: fetchError } = await supabase
        .from("pickups")
        .select("*")
        .eq("status", "collected");

      if (fetchError) {
        console.error("Error fetching pickups for fix:", fetchError);
        return { ok: false, error: fetchError.message };
      }

      if (!pickups || pickups.length === 0) {
        console.log("No collected pickups found");
        return { ok: true };
      }

      console.log(`Found ${pickups.length} collected pickups to process`);

      // Group pickups by user to calculate total coins per user
      const userCoins = new Map<string, number>();

      // Process each pickup and calculate coins
      for (const pickup of pickups) {
        try {
          // Calculate coins using material classes
          const { materialFactory } = await import("./domain/materials");
          const materialCode = pickup.material_code.toUpperCase() as
            | "PAPER"
            | "PLASTIC"
            | "IRON";
          const material = materialFactory(materialCode);
          const calculatedCoins = material.coinsFor(pickup.weight_kg);

          console.log(
            `Processing pickup ${pickup.id}: ${materialCode} ${pickup.weight_kg}kg = ${calculatedCoins} coins`
          );

          // Update pickup with calculated coins (if not already set)
          if (pickup.coins_awarded !== calculatedCoins) {
            const { error: updateError } = await supabase
              .from("pickups")
              .update({
                coins_awarded: calculatedCoins,
                updated_at: new Date().toISOString(),
              })
              .eq("id", pickup.id);

            if (updateError) {
              console.error(`Error updating pickup ${pickup.id}:`, updateError);
              continue;
            }
          }

          // Add to user's total coins
          const currentTotal = userCoins.get(pickup.user_id) || 0;
          userCoins.set(pickup.user_id, currentTotal + calculatedCoins);
        } catch (err) {
          console.error(`Error processing pickup ${pickup.id}:`, err);
        }
      }

      // Update each user's total coins in profiles table
      for (const [userId, totalCoins] of userCoins.entries()) {
        console.log(`Setting user ${userId} total coins to ${totalCoins}`);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            coins_balance: totalCoins,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error(
            `Failed to update coins for user ${userId}:`,
            updateError
          );
        } else {
          console.log(
            `Successfully set ${totalCoins} coins for user ${userId}`
          );
        }
      }

      console.log("Finished recalculating all coins correctly");
      return { ok: true };
    } catch (err: any) {
      console.error("Error in fixExistingPickups:", err);
      return { ok: false, error: "Failed to fix existing pickups" };
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
