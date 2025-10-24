import { Stack } from "expo-router";
import { IconButton } from "react-native-paper";
import { router } from "expo-router";

export default function PickupsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "My Pickups",
          headerRight: () => (
            <IconButton
              icon="plus"
              onPress={() => router.push("/pickups/new")}
            />
          ),
        }}
      />
      <Stack.Screen name="new" options={{ title: "Schedule Pickup" }} />
    </Stack>
  );
}
