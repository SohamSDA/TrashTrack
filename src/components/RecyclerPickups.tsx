import { AppPickup, useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import { Button, Card, Chip, FAB, Snackbar, Text } from "react-native-paper";

export default function RecyclerPickups() {
  const { pickups, loadPickups, markCollected } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Filter to show only requested pickups (hide collected ones)
  const activePickups = useMemo(
    () => pickups.filter((p) => p.status === "requested"),
    [pickups]
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await loadPickups();
      } catch (error) {
        setSnackbarMessage("Failed to load pickups");
        setSnackbarVisible(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPickups();
    setRefreshing(false);
  }, [loadPickups]);

  const empty = useMemo(
    () => (
      <Card
        style={{
          borderRadius: 20,
          marginTop: 32,
          backgroundColor: "#ffffff",
          elevation: 2,
        }}
      >
        <Card.Content
          style={{ alignItems: "center", paddingVertical: 48, gap: 16 }}
        >
          <View
            style={{
              backgroundColor: "#f1f5f9",
              borderRadius: 100,
              padding: 32,
            }}
          >
            <MaterialCommunityIcons
              name="recycle-variant"
              size={64}
              color="#0f766e"
            />
          </View>
          <Text
            variant="headlineSmall"
            style={{
              color: "#0f172a",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            No Active Pickups
          </Text>
          <Text
            variant="bodyLarge"
            style={{
              color: "#64748b",
              textAlign: "center",
              paddingHorizontal: 16,
            }}
          >
            You haven't scheduled any pickups yet.{"\n"}
            Start recycling and earn coins!
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push("/pickups/new")}
            buttonColor="#0f766e"
            icon="plus-circle"
            style={{ marginTop: 16, borderRadius: 12 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Schedule First Pickup
          </Button>
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

          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Chip
              compact
              mode="outlined"
              style={{
                borderColor:
                  item.status === "collected" ? "#16a34a" : "#f97316",
              }}
              textStyle={{
                color: item.status === "collected" ? "#16a34a" : "#f97316",
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

          {/* Show contact details for the recycler's own requests */}
          {(item.pickup_address ||
            item.contact_name ||
            item.contact_number) && (
            <View
              style={{
                backgroundColor: "#f1f5f9",
                borderRadius: 12,
                padding: 12,
                marginTop: 8,
                borderLeftWidth: 3,
                borderLeftColor: "#16a34a",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialCommunityIcons
                  name="information"
                  size={16}
                  color="#64748b"
                />
                <Text
                  variant="bodySmall"
                  style={{ color: "#64748b", marginLeft: 6, fontWeight: "600" }}
                >
                  Your Contact Information
                </Text>
              </View>

              {item.contact_name && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={14}
                    color="#16a34a"
                  />
                  <Text
                    variant="bodySmall"
                    style={{ color: "#475569", marginLeft: 6 }}
                  >
                    {item.contact_name}
                  </Text>
                </View>
              )}

              {item.contact_number && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={14}
                    color="#16a34a"
                  />
                  <Text
                    variant="bodySmall"
                    style={{ color: "#475569", marginLeft: 6 }}
                  >
                    {item.contact_number}
                  </Text>
                </View>
              )}

              {item.pickup_address && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={14}
                    color="#16a34a"
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{ color: "#475569", marginLeft: 6, flex: 1 }}
                  >
                    {item.pickup_address}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text variant="bodySmall" style={{ color: "#94a3b8" }}>
            #{item.id}
            {created ? ` • ${created.toLocaleString()}` : ""}
          </Text>
        </Card.Content>

        {item.status === "requested" && (
          <Card.Actions>
            <Button
              onPress={async () => {
                Alert.alert(
                  "Confirm Collection",
                  "Mark this pickup as collected?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Confirm",
                      onPress: async () => {
                        try {
                          setBusyId(item.id);
                          const res = await markCollected(item.id);
                          if (!res.ok) {
                            setSnackbarMessage(
                              res.error ?? "Failed to mark as collected"
                            );
                            setSnackbarVisible(true);
                          } else {
                            setSnackbarMessage("Pickup marked as collected! ✓");
                            setSnackbarVisible(true);
                            await onRefresh();
                            setRefreshKey((p) => p + 1);
                          }
                        } catch (e) {
                          console.error("markCollected error", e);
                          setSnackbarMessage(
                            "Network error. Please try again."
                          );
                          setSnackbarVisible(true);
                        } finally {
                          setBusyId(null);
                        }
                      },
                    },
                  ]
                );
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

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={{ color: "#64748b", marginTop: 16, fontSize: 16 }}>
          Loading your pickups...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc", padding: 16 }}>
      <FlatList
        key={refreshKey}
        data={activePickups}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 96 }}
        ListEmptyComponent={empty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0f766e"]}
          />
        }
      />

      <FAB
        icon="plus"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          backgroundColor: "#0f766e",
        }}
        onPress={() => router.push("/pickups/new")}
        label="New"
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: "#dc2626" }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}
