import { useAuthStore } from "@/lib/authStore";
import { Stack } from "expo-router";

export default function PickupsLayout() {
  const { profile } = useAuthStore();
  const currentRole = profile?.role || "recycler";

  const getScreenTitle = (role: string) => {
    switch (role) {
      case "recycler":
        return "My Pickups";
      case "collector":
        return "Earnings";
      case "admin":
        return "All Pickups";
    }
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
