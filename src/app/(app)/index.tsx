import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";

const { width } = Dimensions.get("window");

export default function MainDashboard() {
  const {
    user,
    profile,
    pickups,
    requestPickup,
    assignPickup,
    loadAllPickups,
    loadPickups,
    markCollected,
    signOut,
    updateUserCoins,
  } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const currentRole = profile?.role || "recycler";

  useEffect(() => {
    if (currentRole === "collector") {
      loadAllPickups();
    } else {
      loadPickups();
    }
  }, [currentRole]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    if (currentRole === "collector") {
      await loadAllPickups();
    } else {
      await loadPickups();
    }
    setRefreshing(false);
  }, [currentRole]);

  if (currentRole === "collector") {
    return (
      <CollectorDashboard
        user={user}
        pickups={pickups}
        assignPickup={assignPickup}
        loadAllPickups={loadAllPickups}
        updateUserCoins={updateUserCoins}
        markCollected={markCollected}
        signOut={signOut}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <RecyclerDashboard
      user={user}
      pickups={pickups}
      requestPickup={requestPickup}
      loadPickups={loadPickups}
      signOut={signOut}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

function RecyclerDashboard({
  user,
  pickups,
  requestPickup,
  loadPickups,
  signOut,
  refreshing,
  onRefresh,
}: any) {
  const myPickups = pickups;
  const pendingPickups = myPickups.filter(
    (pickup: any) => pickup.status === "requested"
  );
  const assignedPickups = myPickups.filter(
    (pickup: any) => pickup.status === "assigned"
  );
  const completedPickups = myPickups.filter(
    (pickup: any) => pickup.status === "collected"
  );

  const totalCoins = user?.user_metadata?.coins || 0;
  const totalRequests = myPickups.length;
  const completionRate =
    totalRequests > 0
      ? Math.round((completedPickups.length / totalRequests) * 100)
      : 0;

  return (
    <ScrollView
      style={styles.modernContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Modern Header */}
      <LinearGradient
        colors={["#16a34a", "#15803d"]}
        style={styles.modernHeader}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || "Recycler"}
            </Text>
          </View>
          <View style={styles.coinsContainer}>
            <MaterialCommunityIcons
              name="circle-multiple"
              size={24}
              color="#FCD34D"
            />
            <Text style={styles.coinsText}>{totalCoins}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{pendingPickups.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{assignedPickups.length}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedPickups.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Pickups</Text>
        <Text style={styles.sectionSubtitle}>
          {pendingPickups.length} request
          {pendingPickups.length !== 1 ? "s" : ""} waiting for collection
        </Text>

        {pendingPickups.length === 0 ? (
          <Card style={styles.infoCard}>
            <Card.Content style={styles.infoContent}>
              <MaterialCommunityIcons
                name="check-circle"
                size={48}
                color="#10B981"
              />
              <Text style={styles.infoTitle}>All Clear!</Text>
              <Text style={styles.infoDescription}>
                No pending pickup requests at the moment
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.pendingGrid}>
            {pendingPickups.map((pickup: any, index: number) => (
              <Card key={index} style={styles.pendingCard}>
                <Card.Content style={styles.pendingContent}>
                  <View style={styles.pendingHeader}>
                    <View
                      style={[
                        styles.materialIconContainer,
                        {
                          backgroundColor:
                            getMaterialColor(pickup.material_code) + "20",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getMaterialIcon(pickup.material_code)}
                        size={24}
                        color={getMaterialColor(pickup.material_code)}
                      />
                    </View>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingTitle}>
                        {pickup.material_code}
                      </Text>
                      <Text style={styles.pendingWeight}>
                        {pickup.weight_kg}kg
                      </Text>
                    </View>
                    <Chip
                      mode="flat"
                      style={styles.waitingChip}
                      textStyle={styles.waitingChipText}
                    >
                      Waiting
                    </Chip>
                  </View>
                  <Text style={styles.pendingDate}>
                    Requested {formatRelativeTime(pickup.created_at)}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Material Breakdown</Text>
        <Text style={styles.sectionSubtitle}>
          Your recycling activity by material type
        </Text>

        <View style={styles.breakdownGrid}>
          {getMaterialBreakdown(myPickups).map((item: any, index) => (
            <Card key={index} style={styles.breakdownCard}>
              <Card.Content style={styles.breakdownContent}>
                <View
                  style={[
                    styles.breakdownIcon,
                    { backgroundColor: item.color + "20" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={28}
                    color={item.color}
                  />
                </View>
                <Text style={styles.breakdownMaterial}>{item.material}</Text>
                <Text style={styles.breakdownCount}>{item.count} requests</Text>
                <Text style={styles.breakdownWeight}>
                  {item.totalWeight.toFixed(1)}kg total
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          {myPickups.length > 3 && (
            <Button mode="text" compact onPress={() => {}}>
              View All
            </Button>
          )}
        </View>

        {myPickups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons name="leaf" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyDescription}>
                Start by requesting pickup for your recyclable materials
              </Text>
            </Card.Content>
          </Card>
        ) : (
          myPickups.slice(0, 3).map((pickup: any, index: number) => (
            <Card key={index} style={styles.activityCard}>
              <Card.Content style={styles.activityContent}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: getStatusColor(pickup.status) + "20" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getMaterialIcon(pickup.material_code)}
                      size={24}
                      color={getStatusColor(pickup.status)}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      {pickup.material_code} • {pickup.weight_kg}kg
                    </Text>
                    <Text style={styles.activityDate}>
                      {formatDate(pickup.created_at)}
                    </Text>
                  </View>
                </View>
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(pickup.status) + "20" },
                  ]}
                  textStyle={{
                    color: getStatusColor(pickup.status),
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {pickup.status.charAt(0).toUpperCase() +
                    pickup.status.slice(1)}
                </Chip>
              </Card.Content>
            </Card>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Helper functions
function getStatusColor(status: string) {
  switch (status) {
    case "requested":
      return "#F59E0B";
    case "assigned":
      return "#3B82F6";
    case "collected":
      return "#10B981";
    default:
      return "#6B7280";
  }
}

function getMaterialIcon(materialType: string) {
  switch (materialType.toLowerCase()) {
    case "plastic":
      return "bottle-soda";
    case "paper":
      return "newspaper";
    case "metal":
      return "silverware";
    case "glass":
      return "glass-wine";
    case "electronics":
      return "laptop";
    default:
      return "recycle";
  }
}

function getMaterialColor(materialType: string) {
  switch (materialType.toLowerCase()) {
    case "plastic":
      return "#0EA5E9";
    case "paper":
      return "#F59E0B";
    case "metal":
      return "#8B5CF6";
    case "glass":
      return "#EC4899";
    case "electronics":
      return "#10B981";
    default:
      return "#6B7280";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return "just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(dateString);
}

function getMaterialBreakdown(pickups: any[]) {
  const breakdown = pickups.reduce((acc, pickup) => {
    const material = pickup.material_code;
    if (!acc[material]) {
      acc[material] = {
        material,
        count: 0,
        totalWeight: 0,
        icon: getMaterialIcon(material),
        color: getMaterialColor(material),
      };
    }
    acc[material].count += 1;
    acc[material].totalWeight += pickup.weight_kg || 0;
    return acc;
  }, {});

  return Object.values(breakdown);
}

function CollectorDashboard({
  user,
  pickups,
  assignPickup,
  loadAllPickups,
  updateUserCoins,
  markCollected,
  signOut,
  refreshing,
  onRefresh,
}: any) {
  const [busyId, setBusyId] = React.useState<number | null>(null);

  // Filter pickups by status
  const requestedPickups = pickups.filter((p: any) => p.status === "requested");
  const collectedPickups = pickups.filter((p: any) => p.status === "collected");

  const handleMarkCollected = async (pickupId: number, pickup: any) => {
    try {
      setBusyId(pickupId);
      const res = await markCollected(pickupId, {
        coins_awarded: Math.floor(pickup.weight_kg * 10),
        collector_id: user?.id,
      });
      if (!res.ok) {
        Alert.alert("Failed", res.error ?? "Try again.");
      } else {
        Alert.alert("Success", "Pickup request accepted and collected!");
        await loadAllPickups();
      }
    } catch (error) {
      console.error("Exception in collector mark collected:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView
      style={styles.modernContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Modern Header */}
      <LinearGradient
        colors={["#0891b2", "#0e7490"]}
        style={styles.modernHeader}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Collector Dashboard</Text>
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || user?.email || "Collector"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Button
              mode="outlined"
              textColor="white"
              buttonColor="transparent"
              style={{ borderColor: "white" }}
              onPress={() => {
                console.log("Sign out pressed in collector dashboard");
                signOut();
              }}
              icon="logout"
              compact
            >
              Sign Out
            </Button>
          </View>
        </View>

        {/* Collector Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={32}
                color="#f59e0b"
              />
              <Text style={styles.statNumber}>{requestedPickups.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons
                name="check-circle"
                size={32}
                color="#10b981"
              />
              <Text style={styles.statNumber}>{collectedPickups.length}</Text>
              <Text style={styles.statLabel}>Collected</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons
                name="weight-kilogram"
                size={32}
                color="#3b82f6"
              />
              <Text style={styles.statNumber}>
                {pickups
                  .reduce((sum: number, p: any) => sum + p.weight_kg, 0)
                  .toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Total KG</Text>
            </Card.Content>
          </Card>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Pickup Requests</Text>
        </View>

        {requestedPickups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="clipboard-check"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.emptyTitle}>
                No pickup requests available
              </Text>
              <Text style={styles.emptyDescription}>
                Waiting for recyclers to submit pickup requests
              </Text>
            </Card.Content>
          </Card>
        ) : (
          requestedPickups.map((pickup: any, index: number) => (
            <Card key={index} style={styles.pickupCard}>
              <Card.Content>
                <View style={styles.pickupHeader}>
                  <View style={styles.pickupInfo}>
                    <Text style={styles.pickupMaterial}>
                      {pickup.material_code.toUpperCase()} • {pickup.weight_kg}
                      kg
                    </Text>
                    <Text style={styles.pickupDate}>
                      Requested {formatDate(pickup.created_at)}
                    </Text>
                    <Text style={styles.pickupId}>
                      Request #{pickup.id} • Recycler ID:{" "}
                      {pickup.user_id.slice(0, 8)}...
                    </Text>
                  </View>
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, { backgroundColor: "#fef3c7" }]}
                    textStyle={{ color: "#f59e0b", fontWeight: "600" }}
                  >
                    REQUESTED
                  </Chip>
                </View>

                <View style={styles.pickupActions}>
                  <Text style={styles.coinsPreview}>
                    Reward: {Math.floor(pickup.weight_kg * 10)} coins
                  </Text>
                  <Button
                    mode="contained"
                    buttonColor="#10b981"
                    onPress={() => handleMarkCollected(pickup.id, pickup)}
                    loading={busyId === pickup.id}
                    disabled={busyId === pickup.id}
                    icon="check"
                    style={styles.collectButton}
                  >
                    Accept & Collect
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </View>

      {/* Recent Collections */}
      {collectedPickups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Collections</Text>
          </View>

          {collectedPickups.slice(0, 5).map((pickup: any, index: number) => (
            <Card key={index} style={styles.activityCard}>
              <Card.Content style={styles.activityContent}>
                <View style={styles.activityLeft}>
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: "#dcfce7" },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getMaterialIcon(pickup.material_code)}
                      size={24}
                      color="#10b981"
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>
                      {pickup.material_code} • {pickup.weight_kg}kg
                    </Text>
                    <Text style={styles.activityDate}>
                      Collected {formatDate(pickup.updated_at)}
                    </Text>
                  </View>
                </View>
                <Chip
                  mode="flat"
                  style={[styles.statusChip, { backgroundColor: "#dcfce7" }]}
                  textStyle={{
                    color: "#10b981",
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  +{pickup.coins_awarded || 0} coins
                </Chip>
              </Card.Content>
            </Card>
          ))}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modernHeader: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 28,
    color: "white",
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  coinsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  coinsText: {
    fontSize: 20,
    color: "#FBBF24",
    fontWeight: "800",
    marginLeft: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    color: "white",
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    marginTop: 4,
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 20,
  },
  materialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  materialCard: {
    width: (width - 80) / 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderRadius: 16,
  },
  materialCardContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  materialName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  materialDescription: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  activityCard: {
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderRadius: 12,
  },
  activityContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  activityDate: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  statusChip: {
    borderRadius: 16,
  },
  emptyCard: {
    elevation: 1,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  testingCard: {
    backgroundColor: "#f3f4f6",
    elevation: 1,
    borderRadius: 12,
  },
  testingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 16,
  },
  testingButtons: {
    flexDirection: "row",
    gap: 12,
  },
  testButton: {
    flex: 1,
  },
  // New styles for data-focused dashboard
  infoCard: {
    elevation: 1,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
  },
  infoContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#16a34a",
    marginTop: 12,
  },
  infoDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  pendingGrid: {
    gap: 12,
  },
  pendingCard: {
    elevation: 1,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  pendingContent: {
    paddingVertical: 16,
  },
  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  materialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  pendingWeight: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  waitingChip: {
    backgroundColor: "#FEF3C7",
  },
  waitingChipText: {
    color: "#F59E0B",
    fontSize: 12,
    fontWeight: "600",
  },
  pendingDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  breakdownCard: {
    width: (width - 80) / 2,
    elevation: 1,
    borderRadius: 12,
  },
  breakdownContent: {
    alignItems: "center",
    paddingVertical: 20,
  },
  breakdownIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownMaterial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  breakdownCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  breakdownWeight: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  // Collector Dashboard Styles
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 12,
  },
  statContent: {
    alignItems: "center",
    paddingVertical: 16,
  },
  pickupCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
  },
  pickupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  pickupInfo: {
    flex: 1,
  },
  pickupMaterial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  pickupDate: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  pickupId: {
    fontSize: 12,
    color: "#9ca3af",
  },
  pickupActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coinsPreview: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  collectButton: {
    borderRadius: 8,
  },
  collectorStatusChip: {
    alignSelf: "flex-start",
  },
});
