import { AppPickup, useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, View } from "react-native";
import { Button, Card, Chip, FAB, Text } from "react-native-paper";

export default function PickupsList() {
  const { pickups, loadPickups, markCollected } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key

  // Filter to show only requested pickups (hide collected ones)
  const activePickups = useMemo(
    () => pickups.filter((pickup) => pickup.status === "requested"),
    [pickups]
  );

  useEffect(() => {
    // initial load (no-op if already loaded)
    loadPickups();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPickups();
    setRefreshing(false);
  }, [loadPickups]);

  const empty = useMemo(
    () => (
      <Card style={{ borderRadius: 16 }}>
        <Card.Content style={{ alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons
            name="tray-remove"
            size={28}
            color="#6b7280"
          />
          <Text variant="bodyLarge" style={{ color: "#6b7280" }}>
            No active pickup requests.
          </Text>
          <Text variant="bodyMedium" style={{ color: "#9ca3af" }}>
            Tap the + button to schedule your first pickup.
          </Text>
        </Card.Content>
      </Card>
    ),
    []
  );

  const renderItem = ({ item }: { item: AppPickup }) => {
    const created = item.created_at ? new Date(item.created_at) : null;

    return (
      <Card style={{ borderRadius: 16, marginBottom: 12 }}>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleMedium">
            {item.material_code.toUpperCase()} • {item.weight_kg} kg
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Chip
              compact
              mode="outlined"
              style={{
                borderColor:
                  item.status === "collected" ? "#16a34a" : "#ea580c",
              }}
              textStyle={{
                color: item.status === "collected" ? "#16a34a" : "#ea580c",
                fontWeight: "600",
              }}
            >
              {item.status}
            </Chip>

            {typeof item.coins_awarded === "number" && (
              <Chip compact mode="flat" icon="cash-multiple">
                {item.coins_awarded} coins
              </Chip>
            )}
          </View>

          <Text variant="bodySmall" style={{ color: "#6b7280" }}>
            #{item.id}
            {created ? ` • ${created.toLocaleString()}` : ""}
          </Text>
        </Card.Content>

        {item.status === "requested" && (
          <Card.Actions>
            <Button
              onPress={async () => {
                try {
                  setBusyId(item.id);
                  const res = await markCollected(item.id);
                  if (!res.ok) {
                    Alert.alert("Failed", res.error ?? "Try again.");
                  } else {
                    Alert.alert(
                      "Success",
                      "Pickup marked as collected! Check your dashboard for collected items."
                    );
                    // Force a manual refresh and re-render
                    await onRefresh();
                    setRefreshKey((prev) => prev + 1);
                  }
                } catch (error) {
                  console.error(
                    "Exception in Mark as Collected button:",
                    error
                  );
                  Alert.alert("Error", "An unexpected error occurred");
                } finally {
                  setBusyId(null);
                }
              }}
              loading={busyId === item.id}
              disabled={busyId === item.id}
            >
              Mark as Collected
            </Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f8f7", padding: 16 }}>
      <FlatList
        key={refreshKey} // Force re-render when key changes
        data={activePickups}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={empty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <FAB
        icon="plus"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          backgroundColor: "#16a34a",
        }}
        onPress={() => router.push("/pickups/new")}
        label="New"
      />
    </View>
  );
}
