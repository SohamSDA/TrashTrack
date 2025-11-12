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

  // Role-based theme colors
  const getTheme = (role: string) => {
    if (role === "collector") {
      return {
        headerBg: "#0f172a",
        headerText: "#ffffff",
        tabBarBg: "#1e293b",
        tabBarBorder: "#334155",
        activeColor: "#0f766e",
        inactiveColor: "#64748b",
      };
    }
    // Recycler theme - white/light green
    return {
      headerBg: "#ffffff",
      headerText: "#16a34a",
      tabBarBg: "#ffffff",
      tabBarBorder: "#e5e7eb",
      activeColor: "#16a34a",
      inactiveColor: "#9ca3af",
    };
  };

  const theme = getTheme(currentRole);

  return (
    <Tabs
      screenOptions={{
        headerTitle: `TrashTrack - ${
          currentRole.charAt(0).toUpperCase() + currentRole.slice(1)
        }`,
        headerStyle: {
          backgroundColor: theme.headerBg,
        },
        headerTitleStyle: {
          color: theme.headerText,
          fontWeight: "bold",
          fontSize: 18,
        },
        tabBarActiveTintColor: theme.activeColor,
        tabBarInactiveTintColor: theme.inactiveColor,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
          backgroundColor: theme.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: theme.tabBarBorder,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
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
