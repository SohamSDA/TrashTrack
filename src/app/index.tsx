import { useAuthStore } from "@/lib/authStore";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import LoadingScreen from "./loading";

export default function Index() {
  const { user, loading } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure component is mounted
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only navigate once we have auth state and component is mounted
    if (!loading && isMounted) {
      // Add a small delay to ensure navigation system is ready
      const timer = setTimeout(() => {
        if (user) {
          router.replace("/(app)");
        } else {
          router.replace("/(auth)/login");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading, isMounted]);

  // Show loading while determining auth state
  return <LoadingScreen />;
}
