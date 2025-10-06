import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#f6f8f7",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
      }}
    >
      <ActivityIndicator size="large" color="#16a34a" />
      <Text variant="titleMedium" style={{ color: "#16a34a" }}>
        Loading TrashTrack...
      </Text>
    </View>
  );
}
