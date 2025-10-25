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
          
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
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
    </Tabs>
  );
}
