import { useAuthStore } from "@/lib/authStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import LoadingScreen from "./loading";

// Store navigation state outside component to persist across re-mounts
let hasNavigatedGlobally = false;
let lastUserState: boolean | null = null;

// Export function to reset navigation state (for logout)
export const resetNavigation = () => {
  console.log("Resetting navigation state for logout");
  hasNavigatedGlobally = false;
  lastUserState = null;
};

export default function Index() {
  const { user, loading } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only navigate once we have auth state and component is mounted
    // Also check if user state has actually changed to prevent unnecessary navigation
    const userExists = !!user;
    const userStateChanged = lastUserState !== userExists;

    if (!loading && isMounted && (!hasNavigatedGlobally || userStateChanged)) {
      console.log("Navigating based on auth state - User exists:", userExists);

      hasNavigatedGlobally = true;
      lastUserState = userExists;

      // Navigate based on user state
      if (!user) {
        router.replace("/(auth)/login");
      } else {
        router.replace("/(app)");
      }
    }
  }, [user, loading, isMounted]);

  // Show loading only while determining auth state and before navigation
  if (loading || !isMounted || !hasNavigatedGlobally) {
    return <LoadingScreen />;
  }

  // After navigation, this component should not render anything
  return null;
}
