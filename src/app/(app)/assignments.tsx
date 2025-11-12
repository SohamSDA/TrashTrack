import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

export default function MyAssignments() {
  const { user, pickups, loadAllPickups, markCollected } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Filter for pickups assigned to current user
  const assignedPickups = pickups.filter(
    (p: any) => p.status === "assigned" && p.collector_id === user?.id
  );

  useEffect(() => {
    loadAllPickups();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadAllPickups();
    setRefreshing(false);
  }, []);

  const handleMarkCollected = async (pickupId: number, pickup: any) => {
    Alert.alert(
      "Confirm Collection",
      `Mark ${pickup.weight_kg}kg of ${pickup.material_code.toUpperCase()} as collected?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setBusyId(pickupId);
              const res = await markCollected(pickupId, {
                coins_awarded: Math.floor(pickup.weight_kg * 10),
                collector_id: user?.id,
              });
              if (!res.ok) {
                Alert.alert("Failed", res.error ?? "Try again.");
              } else {
                Alert.alert(
                  "Success! 🎉",
                  `You collected ${pickup.weight_kg}kg of ${pickup.material_code.toUpperCase()}!\n\nRecycler earned ${Math.floor(
                    pickup.weight_kg * 10
                  )} coins.`
                );
                await loadAllPickups();
              }
            } catch (error) {
              console.error("Exception in mark collected:", error);
              Alert.alert(
                "Network Error",
                "Please check your connection and try again."
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const getMaterialIcon = (material: string) => {
    switch (material.toLowerCase()) {
      case "iron":
        return { name: "horseshoe", color: "#6b7280" };
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Summary */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="clipboard-text"
              size={32}
              color="#14b8a6"
            />
            <Text style={styles.statValue}>{assignedPickups.length}</Text>
            <Text style={styles.statLabel}>Assigned to Me</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="weight-kilogram"
              size={32}
              color="#5eead4"
            />
            <Text style={styles.statValue}>
              {assignedPickups
                .reduce((sum: number, p: any) => sum + (p.weight_kg || 0), 0)
                .toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Total kg</Text>
          </View>
        </View>

        {/* Assigned Pickups List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {assignedPickups.length > 0
              ? "Ready to Collect"
              : "No Assignments Yet"}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {assignedPickups.length > 0
              ? "Complete these pickups to help recyclers earn coins"
              : "Accept pickup requests to see them here"}
          </Text>
        </View>

        {assignedPickups.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="clipboard-alert-outline"
              size={64}
              color="#64748b"
            />
            <Text style={styles.emptyTitle}>No Assignments</Text>
            <Text style={styles.emptySubtitle}>
              Go to the dashboard and accept pickup requests to see them here
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/")}
              style={styles.emptyButton}
              buttonColor="#0f766e"
            >
              View Available Requests
            </Button>
          </View>
        ) : (
          assignedPickups.map((pickup: any, index: number) => {
            const materialInfo = getMaterialIcon(pickup.material_code);
            return (
              <Card key={index} style={styles.pickupCard}>
                <Card.Content style={styles.cardContent}>
                  {/* Header with Icon and Status */}
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.materialIconBox,
                        { backgroundColor: `${materialInfo.color}20` },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={materialInfo.name as any}
                        size={28}
                        color={materialInfo.color}
                      />
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.materialTitle}>
                        {pickup.material_code.toUpperCase()}
                      </Text>
                      <Text style={styles.timeText}>
                        Assigned{" "}
                        {formatRelativeTime(
                          pickup.updated_at || pickup.created_at
                        )}
                      </Text>
                    </View>
                    <Chip
                      mode="flat"
                      compact
                      style={styles.assignedChip}
                      textStyle={styles.assignedChipText}
                    >
                      ASSIGNED
                    </Chip>
                  </View>

                  {/* Weight and Coins */}
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <MaterialCommunityIcons
                        name="weight"
                        size={18}
                        color="#94a3b8"
                      />
                      <Text style={styles.infoText}>{pickup.weight_kg} kg</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <MaterialCommunityIcons
                        name="circle-multiple"
                        size={18}
                        color="#fbbf24"
                      />
                      <Text style={styles.infoText}>
                        {Math.floor(pickup.weight_kg * 10)} coins
                      </Text>
                    </View>
                  </View>

                  {/* Recycler Contact Info */}
                  <View style={styles.contactCard}>
                    <View style={styles.contactHeader}>
                      <MaterialCommunityIcons
                        name="account-circle"
                        size={16}
                        color="#0f766e"
                      />
                      <Text style={styles.contactHeaderText}>
                        Recycler Contact
                      </Text>
                    </View>

                    {pickup.contact_name && (
                      <View style={styles.contactRow}>
                        <MaterialCommunityIcons
                          name="account"
                          size={16}
                          color="#64748b"
                        />
                        <Text style={styles.contactText}>
                          {pickup.contact_name}
                        </Text>
                      </View>
                    )}

                    {pickup.contact_number && (
                      <View style={styles.contactRow}>
                        <MaterialCommunityIcons
                          name="phone"
                          size={16}
                          color="#64748b"
                        />
                        <Text style={styles.contactText}>
                          {pickup.contact_number}
                        </Text>
                        <Button
                          mode="text"
                          compact
                          onPress={() =>
                            Linking.openURL(`tel:${pickup.contact_number}`)
                          }
                          textColor="#0f766e"
                          style={{ marginLeft: "auto" }}
                        >
                          Call
                        </Button>
                      </View>
                    )}

                    {pickup.pickup_address && (
                      <View style={styles.contactRow}>
                        <MaterialCommunityIcons
                          name="map-marker"
                          size={16}
                          color="#64748b"
                        />
                        <Text style={styles.contactText} numberOfLines={2}>
                          {pickup.pickup_address}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Button */}
                  <Button
                    mode="contained"
                    buttonColor="#0f766e"
                    onPress={() => handleMarkCollected(pickup.id, pickup)}
                    loading={busyId === pickup.id}
                    disabled={busyId === pickup.id}
                    style={styles.collectButton}
                    labelStyle={styles.collectButtonLabel}
                    icon="check-circle"
                  >
                    Mark as Collected
                  </Button>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#334155",
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  emptyCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
  },
  pickupCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  materialIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  materialTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  timeText: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  assignedChip: {
    backgroundColor: "#14b8a6",
    height: 24,
  },
  assignedChipText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#e2e8f0",
    fontWeight: "600",
  },
  contactCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  contactHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f766e",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  contactText: {
    fontSize: 14,
    color: "#e2e8f0",
    flex: 1,
  },
  collectButton: {
    borderRadius: 12,
  },
  collectButtonLabel: {
    fontWeight: "700",
    fontSize: 15,
  },
});
