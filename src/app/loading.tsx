import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={["#16a34a", "#15803d", "#14532d"]}
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
      }}
    >
      <View style={{ alignItems: "center", gap: 12 }}>
        <MaterialCommunityIcons name="recycle" size={80} color="#ffffff" />
        <Text
          variant="headlineLarge"
          style={{
            color: "#ffffff",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          TrashTrack
        </Text>
        <Text
          variant="titleSmall"
          style={{
            color: "#d1fae5",
            textAlign: "center",
            letterSpacing: 2,
          }}
        >
          MAKING RECYCLING REWARDING
        </Text>
      </View>

      <View style={{ marginTop: 32, alignItems: "center", gap: 16 }}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text variant="bodyMedium" style={{ color: "#d1fae5" }}>
          Loading your dashboard...
        </Text>
      </View>
    </LinearGradient>
  );
}
