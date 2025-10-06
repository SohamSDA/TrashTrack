import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function AppTabs() {
  const { profile } = useAuthStore();
  const currentRole = profile?.role || "recycler";

  const getRoleColor = (role: string) => {
    switch (role) {
      case "recycler":
        return "#16a34a";
      case "collector":
        return "#0891b2";
      case "admin":
        return "#dc2626";
      default:
        return "#16a34a";
    }
  };

  const getHomeTitle = (role: string) => {
    switch (role) {
      case "recycler":
        return "Dashboard";
      case "collector":
        return "Collections";
      case "admin":
        return "Admin Panel";
      default:
        return "Home";
    }
  };

  const getPickupsTitle = (role: string) => {
    switch (role) {
      case "recycler":
        return "My Pickups";
      case "collector":
        return "Collection Routes";
      case "admin":
        return "All Pickups";
      default:
        return "Pickups";
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerTitle: `TrashTrack - ${
          currentRole.charAt(0).toUpperCase() + currentRole.slice(1)
        }`,
        headerTitleStyle: {
          color: getRoleColor(currentRole),
          fontWeight: "bold",
        },
        tabBarActiveTintColor: getRoleColor(currentRole),
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* Main Dashboard - Role-based content */}
      <Tabs.Screen
        name="index"
        options={{
          title: getHomeTitle(currentRole),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={currentRole === "collector" ? "truck" : "home-variant"}
              color={color}
              size={focused ? size + 2 : size}
            />
          ),
        }}
      />

      {/* Pickups Tab - Role-based content */}
      <Tabs.Screen
        name="pickups"
        options={{
          title: getPickupsTitle(currentRole),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={currentRole === "collector" ? "truck-delivery" : "recycle"}
              color={color}
              size={focused ? size + 2 : size}
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={
                currentRole === "collector"
                  ? "account-hard-hat"
                  : "account-circle"
              }
              color={color}
              size={focused ? size + 2 : size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
