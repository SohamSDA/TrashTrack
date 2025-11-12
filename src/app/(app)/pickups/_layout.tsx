import { useAuthStore } from "@/lib/authStore";
import { router, Stack } from "expo-router";
import { IconButton } from "react-native-paper";

export default function PickupsLayout() {
  const { profile } = useAuthStore();
  const currentRole = profile?.role || "recycler";

  const getScreenTitle = (role: string) => {
    switch (role) {
      case "recycler":
        return "My Pickups";
      case "collector":
        return "Earnings Dashboard";
      case "admin":
        return "All Pickups";
      default:
        return "Pickups";
    }
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: getScreenTitle(currentRole),
          headerRight: () =>
            currentRole === "recycler" ? (
              <IconButton
                icon="plus"
                onPress={() => router.push("/pickups/new")}
              />
            ) : null,
        }}
      />
      <Stack.Screen name="new" options={{ title: "Schedule Pickup" }} />
    </Stack>
  );
}
