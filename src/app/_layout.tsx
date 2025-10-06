import { useAuthStore } from "@/lib/authStore";
import { theme } from "@/lib/ui/theme";
import { Stack } from "expo-router";
import { useEffect } from "react";
import "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import LoadingScreen from "./loading";

export default function RootLayout() {
  const { loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <PaperProvider theme={theme}>
        <LoadingScreen />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="loading" />
        <Stack.Screen name="modal" />
      </Stack>
    </PaperProvider>
  );
}
