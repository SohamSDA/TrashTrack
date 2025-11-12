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
    }
  };

  const getHomeTitle = (role: string) => {
    switch (role) {
      case "recycler":
        return "Dashboard";
      case "collector":
        return "Collections";
      default:
        return "Home";
    }
  };

  const getSecondTabTitle = (role: string) => {
    switch (role) {
      case "recycler":
        return "My Pickups";
      case "collector":
        return "Earnings";
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
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
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
              size={focused ? size + 4 : size}
            />
          ),
          tabBarAccessibilityLabel: `${getHomeTitle(currentRole)} tab`,
        }}
      />

      {/* Second Tab - Role-based content */}
      <Tabs.Screen
        name="pickups"
        options={{
          title: getSecondTabTitle(currentRole),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={currentRole === "collector" ? "chart-line" : "recycle"}
              color={color}
              size={focused ? size + 4 : size}
            />
          ),
          tabBarAccessibilityLabel: `${getSecondTabTitle(currentRole)} tab`,
        }}
      />
    </Tabs>
  );
}
