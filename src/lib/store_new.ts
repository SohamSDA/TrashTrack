import { CoinSystem, PickupRequest } from "@/lib/domain/core";
import { MaterialCode, materialFactory } from "@/lib/domain/materials";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AppState = {
  user: { id: string; fullName: string; balance: number };
  currentRole: "recycler" | "collector" | "admin";
  pickups: PickupRequest[];
  nextId: number;
  coinSystem: CoinSystem;
  setName: (name: string) => void;
  setRole: (role: "recycler" | "collector" | "admin") => void;
  addCoins: (amount: number) => void;
  requestPickup: (code: MaterialCode, weightKg: number) => number;
  markCollected: (id: number) => void;
  resetAll: () => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      user: { id: "demo-user", fullName: "Alex Recycler", balance: 150 },
      currentRole: "recycler" as const,
      pickups: [
        new PickupRequest(1, "demo-user", "PAPER", 5, "collected", 10),
        new PickupRequest(2, "demo-user", "PLASTIC", 3, "requested", 0),
        new PickupRequest(3, "demo-user", "IRON", 2, "collected", 12),
      ],
      nextId: 4,
      coinSystem: new CoinSystem(),
      setName: (fullName) => set((s) => ({ user: { ...s.user, fullName } })),
      setRole: (currentRole) => set({ currentRole }),
      addCoins: (amount) =>
        set((s) => ({
          user: { ...s.user, balance: s.user.balance + amount },
        })),
      requestPickup: (code, weightKg) => {
        const s = get();
        const material = materialFactory(code);
        const coins = s.coinSystem.calculate(material, weightKg);
        const pr = new PickupRequest(
          s.nextId,
          s.user.id,
          code,
          weightKg,
          "requested",
          0
        );
        set({ pickups: [pr, ...s.pickups], nextId: s.nextId + 1 });
        set((st) => ({
          user: { ...st.user, balance: st.user.balance + coins },
        }));
        return coins;
      },
      markCollected: (id) =>
        set((s) => ({
          pickups: s.pickups.map((p) =>
            p.id === id ? { ...p, status: "collected" } : p
          ),
        })),
      resetAll: () =>
        set({
          user: { id: "demo-user", fullName: "Recycler", balance: 0 },
          currentRole: "recycler" as const,
          pickups: [],
          nextId: 1,
          coinSystem: new CoinSystem(),
        }),
    }),
    {
      name: "trashtrack-demo",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        user: s.user,
        currentRole: s.currentRole,
        pickups: s.pickups,
        nextId: s.nextId,
      }),
    }
  )
);
