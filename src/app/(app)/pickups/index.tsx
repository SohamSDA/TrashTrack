import CollectorEarnings from "@/components/CollectorEarnings";
import RecyclerPickups from "@/components/RecyclerPickups";
import { useAuthStore } from "@/lib/authStore";

export default function PickupsList() {
  const { profile } = useAuthStore();

  if (profile?.role === "collector") {
    return <CollectorEarnings />;
  }

  return <RecyclerPickups />;
}
