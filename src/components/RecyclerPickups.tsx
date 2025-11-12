import { AppPickup, useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
              backgroundColor: "#dcfce7",
              borderRadius: 100,
              padding: 32,
            }}
          >
            <MaterialCommunityIcons
              name="recycle-variant"
              size={64}
              color="#16a34a"
            />
          </View>
          <Text
            variant="headlineSmall"
            style={{
              color: "#111827",
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
            buttonColor="#16a34a"
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

    // Get material icon and color
    const getMaterialIcon = (material: string) => {
      switch (material.toLowerCase()) {
        case "iron":
          return { name: "iron", color: "#6b7280" };
        case "plastic":
          return { name: "bottle-soda", color: "#3b82f6" };
        case "paper":
          return { name: "file-document", color: "#f59e0b" };
        case "glass":
          return { name: "glass-fragile", color: "#06b6d4" };
        default:
          return { name: "recycle", color: "#16a34a" };
      }
    };

    const materialInfo = getMaterialIcon(item.material_code);

    return (
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 16,
          backgroundColor: "#ffffff",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Card.Content style={{ padding: 20 }}>
          {/* Header with Material Icon and Bookmark */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: `${materialInfo.color}15`,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons
                name={materialInfo.name as any}
                size={28}
                color={materialInfo.color}
              />
            </View>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={24}
              color="#9ca3af"
            />
          </View>

          {/* Material Type and Date */}
          <View style={{ marginBottom: 12 }}>
            <Text
              variant="titleLarge"
              style={{
                fontWeight: "700",
                color: "#111827",
                marginBottom: 4,
              }}
            >
              {item.material_code.toUpperCase()}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: "#9ca3af", fontSize: 13 }}
            >
              {created
                ? created.toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent"}
            </Text>
          </View>

          {/* Weight and Status Chips */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Chip
              compact
              style={{
                backgroundColor: "#f3f4f6",
                borderRadius: 8,
              }}
              textStyle={{
                color: "#374151",
                fontWeight: "600",
                fontSize: 12,
              }}
            >
              {item.weight_kg} kg
            </Chip>
            <Chip
              compact
              style={{
                backgroundColor:
                  item.status === "collected" ? "#dcfce7" : "#fff7ed",
                borderRadius: 8,
              }}
              textStyle={{
                color: item.status === "collected" ? "#16a34a" : "#f97316",
                fontWeight: "600",
                fontSize: 12,
                textTransform: "capitalize",
              }}
            >
              {item.status}
            </Chip>
          </View>

          {/* Contact Information */}
          {(item.pickup_address ||
            item.contact_name ||
            item.contact_number) && (
            <View
              style={{
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color="#6b7280"
                />
                <Text
                  variant="bodySmall"
                  style={{
                    color: "#6b7280",
                    marginLeft: 6,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  Your Contact Information
                </Text>
              </View>

              {item.contact_name && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={16}
                    color="#16a34a"
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: "#374151", marginLeft: 8 }}
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
                    marginBottom: 6,
                  }}
                >
                  <MaterialCommunityIcons
                    name="phone"
                    size={16}
                    color="#16a34a"
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: "#374151", marginLeft: 8 }}
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
                  }}
                >
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color="#16a34a"
                    style={{ marginTop: 2 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{ color: "#374151", marginLeft: 8, flex: 1 }}
                  >
                    {item.pickup_address}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom Section: Potential Coins and Status */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="circle-multiple"
                size={20}
                color="#fbbf24"
              />
              <Text
                variant="titleMedium"
                style={{
                  color: "#111827",
                  fontWeight: "700",
                  marginLeft: 6,
                }}
              >
                {Math.floor((item.weight_kg || 0) * 10)} coins
              </Text>
            </View>

            {item.status === "requested" && (
              <Chip
                compact
                style={{
                  backgroundColor: "#fff7ed",
                  borderRadius: 10,
                }}
                textStyle={{
                  color: "#f97316",
                  fontWeight: "600",
                  fontSize: 13,
                }}
                icon="clock-outline"
              >
                Waiting for Collector
              </Chip>
            )}
          </View>
        </Card.Content>
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
          backgroundColor: "#f0fdf4",
        }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ color: "#64748b", marginTop: 16, fontSize: 16 }}>
          Loading your pickups...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f0fdf4", padding: 16 }}>
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
            colors={["#16a34a"]}
          />
        }
      />

      <FAB
        icon="plus"
        style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          backgroundColor: "#16a34a",
          borderRadius: 16,
        }}
        color="#ffffff"
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
