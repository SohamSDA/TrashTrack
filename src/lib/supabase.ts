import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

// Web-compatible storage for Supabase
const getStorage = () => {
  if (typeof window !== "undefined") {
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) =>
        Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) =>
        Promise.resolve(localStorage.removeItem(key)),
    };
  }
  return AsyncStorage;
};

/**
 * Database types – mirror your Supabase schema
 * (profiles, pickups). Keep this as the single
 * source of truth for types across the app.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // auth.users.id
          full_name: string | null;
          avatar_url: string | null;
          role: "recycler" | "collector" | "admin" | null;
          coins_balance: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "recycler" | "collector" | "admin" | null;
          coins_balance?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };

      pickups: {
        Row: {
          id: number;
          user_id: string; // FK -> profiles.id
          material_code: string;
          weight_kg: number; // numeric in DB → number in app
          status: "requested" | "collected"; // keep in sync with DB
          coins_awarded: number | null;
          collector_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          material_code: string;
          weight_kg: number;
          status?: "requested" | "collected";
          coins_awarded?: number | null;
          collector_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["pickups"]["Row"]>;
      };
    };
  };
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables:
    EXPO_PUBLIC_SUPABASE_URL: ${!!supabaseUrl}
    EXPO_PUBLIC_SUPABASE_ANON_KEY: ${!!supabaseAnonKey}
    
    Please check your .env file and make sure both values are set.`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
