import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import LoadingScreen from "../loading";

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

  if (!user) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return <LoadingScreen />;
  }

  useEffect(() => {
    console.log("Dashboard effect - Role:", currentRole);
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
  const { profile } = useAuthStore();
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

  // Calculate total coins from completed pickups (coins_awarded field)
  const totalCoins = completedPickups.reduce(
    (sum: number, p: any) => sum + (p.coins_awarded || 0),
    0
  );
  const totalRequests = myPickups.length;
  const completionRate =
    totalRequests > 0
      ? Math.round((completedPickups.length / totalRequests) * 100)
      : 0;

  // Calculate total weight recycled
  const totalWeightRecycled = completedPickups.reduce(
    (sum: number, p: any) => sum + p.weight_kg,
    0
  );

  // Weekly goal: 50kg
  const weeklyGoal = 50;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyWeight = completedPickups
    .filter((p: any) => new Date(p.updated_at || p.created_at) >= oneWeekAgo)
    .reduce((sum: number, p: any) => sum + p.weight_kg, 0);
  const weeklyProgress = Math.min((weeklyWeight / weeklyGoal) * 100, 100);

  // Streak calculation - count consecutive days with collections
  const calculateStreak = (pickups: any[]) => {
    if (pickups.length === 0) return 0;

    const dates = pickups
      .map((p) => new Date(p.updated_at || p.created_at).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();

    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);
      if (dates.includes(checkDate.toDateString())) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak(completedPickups);

  // Impact stats
  const co2Saved = (totalWeightRecycled * 1.8).toFixed(1); // 1.8kg CO2 per kg recycled
  const treesSaved = (totalWeightRecycled / 15).toFixed(1); // 15kg = 1 tree equivalent

  return (
    <ScrollView
      style={styles.recyclerContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#16a34a"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Beautiful Green Themed Header */}
      <LinearGradient
        colors={["#dcfce7", "#bbf7d0", "#86efac"]}
        style={styles.recyclerHeaderNew}
      >
        <View style={styles.headerTopNew}>
          <View style={styles.userInfoSection}>
            <Text style={styles.welcomeTextNew}>Welcome back!</Text>
            <Text style={styles.userNameNew}>
              {user?.user_metadata?.full_name || "Recycler"}
            </Text>
          </View>
          <View style={styles.headerRightSection}>
            <View style={styles.coinsContainerNew}>
              <MaterialCommunityIcons
                name="circle-multiple"
                size={20}
                color="#fbbf24"
              />
              <Text style={styles.coinsValueNew}>{totalCoins}</Text>
            </View>
            <Button
              mode="contained"
              buttonColor="#16a34a"
              textColor="white"
              style={styles.signOutButton}
              onPress={async () => {
                console.log("Sign out pressed in recycler dashboard");
                await signOut();
              }}
              icon="logout"
              compact
            >
              Sign Out
            </Button>
          </View>
        </View>

        {/* Stats Cards Inside Header */}
        <View style={styles.headerStatsGrid}>
          <View style={styles.headerStatCard}>
            <Text style={styles.headerStatNumber}>{pendingPickups.length}</Text>
            <Text style={styles.headerStatLabel}>Pending</Text>
          </View>
          <View style={styles.headerStatCard}>
            <Text style={styles.headerStatNumber}>
              {assignedPickups.length}
            </Text>
            <Text style={styles.headerStatLabel}>In Progress</Text>
          </View>
          <View style={styles.headerStatCard}>
            <Text style={styles.headerStatNumber}>
              {completedPickups.length}
            </Text>
            <Text style={styles.headerStatLabel}>Completed</Text>
          </View>
          <View style={styles.headerStatCard}>
            <Text style={styles.headerStatNumber}>{completionRate}%</Text>
            <Text style={styles.headerStatLabel}>Success Rate</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Clean Stats Cards Section */}
      <View style={styles.section}>
        <View style={styles.recyclerStatsGrid}>
          {/* Coins Card */}
          <Card
            style={[styles.recyclerStatCard, { backgroundColor: "#fef9e7" }]}
          >
            <Card.Content style={styles.recyclerStatContent}>
              <View style={styles.recyclerStatHeader}>
                <Text style={styles.recyclerStatLabel}>Your Coins</Text>
                <MaterialCommunityIcons
                  name="circle-multiple"
                  size={20}
                  color="#fbbf24"
                />
              </View>
              <Text style={styles.recyclerStatValue}>{totalCoins}</Text>
              <Text style={styles.recyclerStatSubtext}>
                {totalCoins >= 100
                  ? "Gold Tier 🏆"
                  : `${100 - totalCoins} to Gold`}
              </Text>
            </Card.Content>
          </Card>

          {/* Weekly Goal Card */}
          <Card
            style={[styles.recyclerStatCard, { backgroundColor: "#f0fdf4" }]}
          >
            <Card.Content style={styles.recyclerStatContent}>
              <View style={styles.recyclerStatHeader}>
                <Text style={styles.recyclerStatLabel}>Weekly Goal</Text>
                <MaterialCommunityIcons
                  name="target"
                  size={20}
                  color="#16a34a"
                />
              </View>
              <Text style={styles.recyclerStatValue}>
                {weeklyWeight.toFixed(1)}kg
              </Text>
              <Text style={styles.recyclerStatSubtext}>
                {weeklyProgress.toFixed(0)}% of {weeklyGoal}kg
              </Text>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Impact Stats - Row-wise Overview Style */}
      <View style={styles.section}>
        <Text style={styles.overviewTitle}>Your Impact</Text>

        {/* Streak Card */}
        <Card style={[styles.overviewCard, { backgroundColor: "#fff7ed" }]}>
          <Card.Content style={styles.overviewCardContent}>
            <View style={styles.overviewCardHeader}>
              <View
                style={[styles.overviewIconBox, { backgroundColor: "#ffedd5" }]}
              >
                <MaterialCommunityIcons name="fire" size={20} color="#f97316" />
              </View>
              <Text style={styles.overviewCardTitle}>Day Streak</Text>
            </View>
            <Text style={styles.overviewCardValue}>{streak}</Text>
            {streak > 0 && (
              <Text style={styles.overviewCardChange}>🔥 Keep it going!</Text>
            )}
          </Card.Content>
        </Card>

        {/* CO2 Saved Card */}
        <Card style={[styles.overviewCard, { backgroundColor: "#f0fdf4" }]}>
          <Card.Content style={styles.overviewCardContent}>
            <View style={styles.overviewCardHeader}>
              <View
                style={[styles.overviewIconBox, { backgroundColor: "#dcfce7" }]}
              >
                <MaterialCommunityIcons name="leaf" size={20} color="#16a34a" />
              </View>
              <Text style={styles.overviewCardTitle}>CO₂ Saved</Text>
            </View>
            <Text style={styles.overviewCardValue}>{co2Saved}kg</Text>
            <Text style={styles.overviewCardChange}>
              ↑ 17.2% greater than last month
            </Text>
          </Card.Content>
        </Card>

        {/* Trees Saved Card */}
        <Card style={[styles.overviewCard, { backgroundColor: "#ecfdf5" }]}>
          <Card.Content style={styles.overviewCardContent}>
            <View style={styles.overviewCardHeader}>
              <View
                style={[styles.overviewIconBox, { backgroundColor: "#d1fae5" }]}
              >
                <MaterialCommunityIcons name="tree" size={20} color="#059669" />
              </View>
              <Text style={styles.overviewCardTitle}>Trees Saved</Text>
            </View>
            <Text style={styles.overviewCardValue}>{treesSaved}</Text>
            <Text style={styles.overviewCardChange}>
              Equivalent to forest impact
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Active Pickups - Analytics Report Style */}
      {pendingPickups.length > 0 && (
        <View style={styles.section}>
          <Card style={[styles.analyticsCard, { backgroundColor: "#ffffff" }]}>
            <Card.Content style={styles.analyticsContent}>
              <View style={styles.analyticsHeader}>
                <Text style={styles.analyticsTitle}>Active Pickups</Text>
                <Text style={styles.analyticsSubtitle}>
                  {pendingPickups.length} request
                  {pendingPickups.length !== 1 ? "s" : ""} waiting
                </Text>
              </View>

              {/* Graph Visualization */}
              <View style={styles.graphContainer}>
                <View style={styles.graphGrid}>
                  <Text style={styles.graphAxisLabel}>20kg</Text>
                  <Text style={styles.graphAxisLabel}>15kg</Text>
                  <Text style={styles.graphAxisLabel}>10kg</Text>
                  <Text style={styles.graphAxisLabel}>5kg</Text>
                  <Text style={styles.graphAxisLabel}>0</Text>
                </View>

                <View style={styles.barsContainer}>
                  {pendingPickups
                    .slice(0, 3)
                    .map((pickup: any, index: number) => {
                      const maxWeight = 20;
                      const barHeight = Math.min(
                        (pickup.weight_kg / maxWeight) * 100,
                        100
                      );

                      return (
                        <View key={index} style={styles.barColumn}>
                          <View style={styles.barWrapper}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  height: `${barHeight}%`,
                                  backgroundColor: getMaterialColor(
                                    pickup.material_code
                                  ),
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.barLabel}>
                            {pickup.material_code.toUpperCase()}
                          </Text>
                          <Text style={styles.barWeight}>
                            {pickup.weight_kg}kg
                          </Text>
                        </View>
                      );
                    })}

                  {pendingPickups.length === 0 && (
                    <Text style={styles.noDataText}>No active pickups</Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

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
    case "iron":
      return "horseshoe";
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
  markCollected,
  signOut,
  refreshing,
  onRefresh,
}: any) {
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [selectedPickup, setSelectedPickup] = React.useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = React.useState(false);
  const [selectedCollection, setSelectedCollection] = React.useState<any>(null);
  const [collectionModalVisible, setCollectionModalVisible] =
    React.useState(false);

  // Filter pickups for this specific collector
  // Available pickups: status = 'requested' (no collector assigned yet)
  const requestedPickups = pickups.filter(
    (p: any) => p.status === "requested" && !p.collector_id
  );

  // Assigned pickups: status = 'assigned' AND collector_id = current user
  const assignedPickups = pickups.filter(
    (p: any) => p.status === "assigned" && p.collector_id === user?.id
  );

  // Available + Assigned pickups for the main list
  const availablePickups = pickups.filter(
    (p: any) =>
      (p.status === "requested" && !p.collector_id) ||
      (p.status === "assigned" && p.collector_id === user?.id)
  );

  // Collected pickups: status = 'collected' AND collector_id = current user
  const collectedPickups = pickups.filter(
    (p: any) => p.status === "collected" && p.collector_id === user?.id
  );

  // Debug logging
  React.useEffect(() => {
    console.log(
      `[Collector ${user?.id?.slice(0, 8)}] Total pickups:`,
      pickups.length
    );
    console.log(
      `[Collector ${user?.id?.slice(0, 8)}] Available requests:`,
      requestedPickups.length
    );
    console.log(
      `[Collector ${user?.id?.slice(0, 8)}] My collections:`,
      collectedPickups.length
    );
  }, [pickups.length, requestedPickups.length, collectedPickups.length]);

  const handleAssignPickup = async (pickupId: number) => {
    Alert.alert(
      "Accept Pickup Request",
      "Do you want to accept this pickup request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setBusyId(pickupId);
              const res = await assignPickup(pickupId);
              if (!res.ok) {
                Alert.alert("Failed", res.error ?? "Try again.");
              } else {
                Alert.alert(
                  "Assigned! 👍",
                  "The pickup has been assigned to you. Don't forget to mark it as collected when you're done!"
                );
                await loadAllPickups();
              }
            } catch (error) {
              console.error("Exception in assign pickup:", error);
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

  const handleMarkCollected = async (pickupId: number, pickup: any) => {
    Alert.alert(
      "Confirm Collection",
      `Collect ${pickup.weight_kg}kg of ${pickup.material_code.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Collect",
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
                  `You successfully collected ${pickup.weight_kg}kg of ${pickup.material_code.toUpperCase()}!`
                );
                await loadAllPickups();
              }
            } catch (error) {
              console.error("Exception in collector mark collected:", error);
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

  // Calculate total earnings
  const totalEarnings = collectedPickups.reduce(
    (sum: number, p: any) => sum + (p.coins_awarded || 0),
    0
  );

  // Today's collections
  const today = new Date().toDateString();
  const todaysCollections = collectedPickups.filter(
    (p: any) => new Date(p.updated_at || p.created_at).toDateString() === today
  );

  return (
    <ScrollView
      style={styles.modernContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0f766e"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Stunning Modern Header - Dark Blue Theme */}
      <LinearGradient
        colors={["#0d9488", "#0f172a"]}
        style={styles.collectorHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.collectorHeaderTop}>
          <View style={styles.collectorUserSection}>
            <View style={styles.collectorAvatarContainer}>
              <MaterialCommunityIcons name="truck" size={28} color="#0f766e" />
            </View>
            <View>
              <Text style={styles.collectorWelcome}>Welcome back! 👋</Text>
              <Text style={styles.collectorName}>
                {user?.user_metadata?.full_name || user?.email || "Collector"}
              </Text>
            </View>
          </View>
          <Button
            mode="text"
            textColor="#ffffff"
            onPress={signOut}
            icon="logout"
            compact
            labelStyle={{ fontSize: 12 }}
          >
            Sign Out
          </Button>
        </View>

        {/* Total Weight Collected - Transparent Blend */}
        <Pressable
          onPress={() => router.push("/pickups")}
          style={styles.transparentTotalCard}
        >
          <View style={styles.transparentTotalContent}>
            <View style={styles.transparentIconBox}>
              <MaterialCommunityIcons
                name="weight-kilogram"
                size={32}
                color="#14b8a6"
              />
            </View>
            <View style={styles.transparentTotalInfo}>
              <Text style={styles.transparentTotalLabel}>Total Collected</Text>
              <Text style={styles.transparentTotalValue}>
                {collectedPickups
                  .reduce((sum: number, p: any) => sum + (p.weight_kg || 0), 0)
                  .toFixed(1)}{" "}
                kg
              </Text>
              <Text style={styles.transparentTotalSubtext}>
                {todaysCollections.length} collections today
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#5eead4"
            />
          </View>
        </Pressable>

        {/* My Assignments Quick Access */}
        {assignedPickups.length > 0 && (
          <Pressable
            onPress={() => router.push("/assignments")}
            style={styles.assignmentsQuickCard}
          >
            <View style={styles.assignmentsQuickContent}>
              <View style={styles.assignmentsQuickIcon}>
                <MaterialCommunityIcons
                  name="clipboard-check"
                  size={24}
                  color="#14b8a6"
                />
              </View>
              <View style={styles.assignmentsQuickInfo}>
                <Text style={styles.assignmentsQuickLabel}>My Assignments</Text>
                <Text style={styles.assignmentsQuickValue}>
                  {assignedPickups.length} pickup
                  {assignedPickups.length !== 1 ? "s" : ""} ready to collect
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#5eead4"
              />
            </View>
          </Pressable>
        )}
      </LinearGradient>

      {/* Available Requests Section - Dark Theme */}
      <View style={styles.section}>
        <View style={styles.modernSectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modernSectionTitle}>Available Requests</Text>
            <Text style={styles.modernSectionSubtitle}>
              {requestedPickups.length > 0
                ? `${requestedPickups.length} pickup${requestedPickups.length !== 1 ? "s" : ""} waiting`
                : "No new requests right now"}
            </Text>
          </View>
          {assignedPickups.length > 0 && (
            <Button
              mode="contained"
              compact
              onPress={() => router.push("/assignments")}
              buttonColor="#0f766e"
              style={{ borderRadius: 10 }}
              labelStyle={{ fontSize: 12, fontWeight: "700" }}
              icon="clipboard-check"
            >
              My Tasks ({assignedPickups.length})
            </Button>
          )}
          {requestedPickups.length > 0 && assignedPickups.length === 0 && (
            <Chip
              mode="flat"
              style={{ backgroundColor: "#0f766e" }}
              textStyle={{ color: "#ffffff", fontWeight: "700", fontSize: 14 }}
            >
              {requestedPickups.length}
            </Chip>
          )}
        </View>

        {requestedPickups.length === 0 ? (
          <View style={styles.beautifulEmptyCard}>
            <LinearGradient
              colors={["#1e293b", "#334155"]}
              style={styles.beautifulEmptyContent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.emptyIconWrapper}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={64}
                  color="#0f766e"
                />
              </View>
              <Text style={styles.beautifulEmptyTitle}>All Clear! 🎉</Text>
              <Text style={styles.beautifulEmptyText}>
                No pickup requests at the moment.{"\n"}
                Check back soon for new opportunities!
              </Text>
            </LinearGradient>
          </View>
        ) : (
          requestedPickups.map((pickup: any, index: number) => (
            <Pressable
              key={index}
              onPress={() => {
                setSelectedPickup(pickup);
                setDetailsModalVisible(true);
              }}
            >
              <View style={styles.compactRequestCard}>
                <View
                  style={[
                    styles.compactIconBox,
                    {
                      backgroundColor:
                        getMaterialColor(pickup.material_code) + "33",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={getMaterialIcon(pickup.material_code)}
                    size={24}
                    color={getMaterialColor(pickup.material_code)}
                  />
                </View>
                <View style={styles.compactCardContent}>
                  <View style={styles.compactCardHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={styles.compactMaterialTitle}>
                        {pickup.material_code.toUpperCase()}
                      </Text>
                      {pickup.status === "assigned" && (
                        <Chip
                          mode="flat"
                          compact
                          style={{ backgroundColor: "#14b8a6", height: 20 }}
                          textStyle={{
                            color: "#ffffff",
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          ASSIGNED
                        </Chip>
                      )}
                    </View>
                  </View>
                  <View style={styles.compactCardInfo}>
                    <Text style={styles.compactInfoText}>
                      {pickup.weight_kg}kg •{" "}
                      {formatRelativeTime(pickup.created_at)}
                    </Text>
                    {pickup.contact_name && (
                      <View style={styles.compactContactRow}>
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={14}
                          color="#94a3b8"
                        />
                        <Text
                          style={styles.compactContactText}
                          numberOfLines={1}
                        >
                          {pickup.contact_name}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#64748b"
                />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Recent Collections - List with Separators */}
      {collectedPickups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.modernSectionHeader}>
            <View>
              <Text style={styles.modernSectionTitle}>
                📦 My Recent Collections
              </Text>
              <Text style={styles.modernSectionSubtitle}>
                {collectedPickups.length} pickups collected by me
              </Text>
            </View>
          </View>

          <View style={styles.listContainer}>
            {collectedPickups.slice(0, 5).map((pickup: any, index: number) => (
              <React.Fragment key={index}>
                <Pressable
                  style={styles.listItem}
                  onPress={() => {
                    setSelectedCollection(pickup);
                    setCollectionModalVisible(true);
                  }}
                >
                  <View
                    style={[
                      styles.listItemIcon,
                      {
                        backgroundColor:
                          getMaterialColor(pickup.material_code) + "22",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getMaterialIcon(pickup.material_code)}
                      size={24}
                      color={getMaterialColor(pickup.material_code)}
                    />
                  </View>
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemTitle}>
                      {pickup.material_code.toUpperCase()} • {pickup.weight_kg}
                      kg
                    </Text>
                    <Text style={styles.listItemSubtitle}>
                      Collected {formatDate(pickup.updated_at)}
                    </Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#64748b"
                    />
                  </View>
                </Pressable>
                {index < collectedPickups.slice(0, 5).length - 1 && (
                  <View style={styles.listSeparator} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 100 }} />

      {/* Beautiful Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDetailsModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPickup && (
                <View style={styles.detailsContainer}>
                  {/* Header */}
                  <View style={styles.detailsHeader}>
                    <Pressable
                      onPress={() => setDetailsModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={24}
                        color="#94a3b8"
                      />
                    </Pressable>
                  </View>

                  {/* Material Icon and Title */}
                  <View style={styles.detailsHero}>
                    <View
                      style={[
                        styles.detailsIconCircle,
                        {
                          backgroundColor:
                            getMaterialColor(selectedPickup.material_code) +
                            "22",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getMaterialIcon(selectedPickup.material_code)}
                        size={48}
                        color={getMaterialColor(selectedPickup.material_code)}
                      />
                    </View>
                    <Text style={styles.detailsMaterialTitle}>
                      {selectedPickup.material_code.toUpperCase()}
                    </Text>
                    <View style={styles.detailsMetaRow}>
                      <Chip
                        mode="flat"
                        style={styles.detailsChip}
                        textStyle={styles.detailsChipText}
                        icon="weight-kilogram"
                      >
                        {selectedPickup.weight_kg}kg
                      </Chip>
                      <Chip
                        mode="flat"
                        style={styles.detailsChip}
                        textStyle={styles.detailsChipText}
                        icon="clock-outline"
                      >
                        {formatRelativeTime(selectedPickup.created_at)}
                      </Chip>
                    </View>
                  </View>

                  {/* Contact Information Card */}
                  {(selectedPickup.contact_name ||
                    selectedPickup.contact_number ||
                    selectedPickup.pickup_address) && (
                    <View style={styles.detailsSection}>
                      <Text style={styles.detailsSectionTitle}>
                        📞 Contact Information
                      </Text>
                      <View style={styles.detailsContactCard}>
                        {selectedPickup.contact_name && (
                          <View style={styles.detailsContactRow}>
                            <View style={styles.detailsContactIconBox}>
                              <MaterialCommunityIcons
                                name="account"
                                size={20}
                                color="#0f766e"
                              />
                            </View>
                            <View style={styles.detailsContactInfo}>
                              <Text style={styles.detailsContactLabel}>
                                Name
                              </Text>
                              <Text style={styles.detailsContactValue}>
                                {selectedPickup.contact_name}
                              </Text>
                            </View>
                          </View>
                        )}

                        {selectedPickup.contact_number && (
                          <View style={styles.detailsContactRow}>
                            <View style={styles.detailsContactIconBox}>
                              <MaterialCommunityIcons
                                name="phone"
                                size={20}
                                color="#0f766e"
                              />
                            </View>
                            <View style={styles.detailsContactInfo}>
                              <Text style={styles.detailsContactLabel}>
                                Phone
                              </Text>
                              <Text style={styles.detailsContactValue}>
                                {selectedPickup.contact_number}
                              </Text>
                            </View>
                            <Button
                              mode="contained"
                              compact
                              onPress={() => {
                                const phoneNumber =
                                  selectedPickup.contact_number.replace(
                                    /[\s\-\(\)\+]/g,
                                    ""
                                  );
                                Linking.openURL(`tel:${phoneNumber}`).catch(
                                  () => {
                                    Alert.alert("Error", "Unable to make call");
                                  }
                                );
                              }}
                              buttonColor="#0f766e"
                              style={styles.detailsActionButton}
                              labelStyle={{ fontWeight: "600", fontSize: 12 }}
                              icon="phone"
                            >
                              Call
                            </Button>
                          </View>
                        )}

                        {selectedPickup.pickup_address && (
                          <View style={styles.detailsContactRow}>
                            <View style={styles.detailsContactIconBox}>
                              <MaterialCommunityIcons
                                name="map-marker"
                                size={20}
                                color="#0f766e"
                              />
                            </View>
                            <View style={styles.detailsContactInfo}>
                              <Text style={styles.detailsContactLabel}>
                                Address
                              </Text>
                              <Text
                                style={styles.detailsContactValue}
                                numberOfLines={2}
                              >
                                {selectedPickup.pickup_address}
                              </Text>
                            </View>
                            <Button
                              mode="contained"
                              compact
                              onPress={() => {
                                const encodedAddress = encodeURIComponent(
                                  selectedPickup.pickup_address
                                );
                                Linking.openURL(
                                  `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
                                ).catch(() => {
                                  Alert.alert("Error", "Unable to open maps");
                                });
                              }}
                              buttonColor="#0f766e"
                              style={styles.detailsActionButton}
                              labelStyle={{ fontWeight: "600", fontSize: 12 }}
                              icon="navigation"
                            >
                              Navigate
                            </Button>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.detailsActions}>
                    <Button
                      mode="outlined"
                      onPress={() => setDetailsModalVisible(false)}
                      style={styles.detailsCancelButton}
                      textColor="#94a3b8"
                      labelStyle={{ fontWeight: "600" }}
                    >
                      Close
                    </Button>
                    {selectedPickup.status === "requested" ? (
                      <Button
                        mode="contained"
                        buttonColor="#0f766e"
                        onPress={() => {
                          setDetailsModalVisible(false);
                          handleAssignPickup(selectedPickup.id);
                        }}
                        loading={busyId === selectedPickup.id}
                        disabled={busyId === selectedPickup.id}
                        style={styles.detailsAcceptButton}
                        labelStyle={{ fontWeight: "700" }}
                        icon="hand-okay"
                      >
                        Accept & Assign
                      </Button>
                    ) : (
                      <Button
                        mode="contained"
                        buttonColor="#0f766e"
                        onPress={() => {
                          setDetailsModalVisible(false);
                          handleMarkCollected(
                            selectedPickup.id,
                            selectedPickup
                          );
                        }}
                        loading={busyId === selectedPickup.id}
                        disabled={busyId === selectedPickup.id}
                        style={styles.detailsAcceptButton}
                        labelStyle={{ fontWeight: "700" }}
                        icon="check-circle"
                      >
                        Mark Collected
                      </Button>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Collection Details Modal */}
      <Modal
        visible={collectionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCollectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setCollectionModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCollection && (
                <View style={styles.detailsContainer}>
                  <View style={styles.detailsHeader}>
                    <Pressable
                      onPress={() => setCollectionModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={24}
                        color="#94a3b8"
                      />
                    </Pressable>
                  </View>

                  <View style={styles.detailsHero}>
                    <View
                      style={[
                        styles.detailsIconCircle,
                        {
                          backgroundColor:
                            getMaterialColor(selectedCollection.material_code) +
                            "33",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getMaterialIcon(selectedCollection.material_code)}
                        size={48}
                        color={getMaterialColor(
                          selectedCollection.material_code
                        )}
                      />
                    </View>
                    <Text style={styles.detailsMaterialTitle}>
                      {selectedCollection.material_code.toUpperCase()}
                    </Text>
                    <View style={styles.detailsMetaRow}>
                      <Chip
                        mode="flat"
                        style={styles.detailsChip}
                        textStyle={styles.detailsChipText}
                        icon="weight"
                      >
                        {selectedCollection.weight_kg} kg
                      </Chip>
                      <Chip
                        mode="flat"
                        style={styles.detailsChip}
                        textStyle={styles.detailsChipText}
                        icon="clock-outline"
                      >
                        {formatDate(selectedCollection.updated_at)}
                      </Chip>
                    </View>
                  </View>

                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>
                      Requester Information
                    </Text>
                    <View style={styles.detailsContactCard}>
                      <View style={styles.detailsContactRow}>
                        <View style={styles.detailsContactIconBox}>
                          <MaterialCommunityIcons
                            name="account"
                            size={20}
                            color="#14b8a6"
                          />
                        </View>
                        <View style={styles.detailsContactInfo}>
                          <Text style={styles.detailsContactLabel}>Name</Text>
                          <Text style={styles.detailsContactValue}>
                            {selectedCollection.contact_name || "Not available"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailsContactRow}>
                        <View style={styles.detailsContactIconBox}>
                          <MaterialCommunityIcons
                            name="phone"
                            size={20}
                            color="#14b8a6"
                          />
                        </View>
                        <View style={styles.detailsContactInfo}>
                          <Text style={styles.detailsContactLabel}>Phone</Text>
                          <Text style={styles.detailsContactValue}>
                            {selectedCollection.contact_number ||
                              "Not available"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailsContactRow}>
                        <View style={styles.detailsContactIconBox}>
                          <MaterialCommunityIcons
                            name="map-marker"
                            size={20}
                            color="#14b8a6"
                          />
                        </View>
                        <View style={styles.detailsContactInfo}>
                          <Text style={styles.detailsContactLabel}>
                            Address
                          </Text>
                          <Text style={styles.detailsContactValue}>
                            {selectedCollection.pickup_address ||
                              "Not available"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailsActions}>
                    <Button
                      mode="outlined"
                      onPress={() => setCollectionModalVisible(false)}
                      style={styles.detailsCancelButton}
                      textColor="#94a3b8"
                      labelStyle={{ fontWeight: "600" }}
                    >
                      Close
                    </Button>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Recycler Theme - White/Light Green
  recyclerContainer: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  recyclerHeader: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  recyclerHeaderNew: {
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTopNew: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  userInfoSection: {
    flex: 1,
  },
  welcomeTextNew: {
    fontSize: 13,
    color: "#16a34a",
    fontWeight: "500",
    marginBottom: 4,
    opacity: 0.8,
  },
  userNameNew: {
    fontSize: 26,
    fontWeight: "700",
    color: "#15803d",
  },
  headerRightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  coinsContainerNew: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coinsValueNew: {
    fontSize: 16,
    fontWeight: "700",
    color: "#15803d",
  },
  signOutButton: {
    borderRadius: 20,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  headerStatsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  headerStatCard: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerStatNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#15803d",
    marginBottom: 4,
  },
  headerStatLabel: {
    fontSize: 10,
    color: "#16a34a",
    fontWeight: "600",
    textAlign: "center",
  },
  // Collector Theme - Dark Blue
  modernContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "black",
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 13,
    color: "rgba(0, 0, 0, 0.95)",
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
    color: "#15803d",
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
  // Contact Section Styles
  contactSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 8,
    lineHeight: 20,
  },
  contactButton: {
    marginLeft: 8,
    borderColor: "#10b981",
    borderRadius: 20,
  },
  // New Dashboard Styles
  rewardsCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
  },
  rewardsGradient: {
    padding: 24,
  },
  rewardsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardsLabel: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.9,
    marginBottom: 8,
  },
  rewardsCoins: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rewardsAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  rewardsSubtext: {
    fontSize: 13,
    color: "#ffffff",
    opacity: 0.8,
  },
  goalCard: {
    borderRadius: 16,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  goalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  goalProgress: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16a34a",
  },
  progressBar: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 6,
  },
  goalSubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
  },
  miniCardContent: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  miniIconContainer: {
    marginBottom: 4,
  },
  miniCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  miniCardLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  miniCardSubtext: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  // Recycler Clean Stats Cards
  recyclerStatsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  recyclerStatCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: "#ffffff",
  },
  recyclerStatContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  recyclerStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recyclerStatLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  recyclerStatValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  recyclerStatSubtext: {
    fontSize: 12,
    color: "#9ca3af",
  },
  // Impact Cards - Clean Design
  impactCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: "#ffffff",
  },
  impactCardContent: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  impactIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  impactCardValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  impactCardLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
    textAlign: "center",
  },
  impactCardSubtext: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  // Overview Style Cards (Row-wise)
  overviewTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#15803d",
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  overviewCardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  overviewCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  overviewIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  overviewCardTitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  overviewCardValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  overviewCardChange: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "500",
  },
  // Analytics Report Style (Graph)
  analyticsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  analyticsContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  analyticsHeader: {
    marginBottom: 20,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#15803d",
    marginBottom: 4,
  },
  analyticsSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  graphContainer: {
    flexDirection: "row",
    height: 200,
    marginTop: 10,
  },
  graphGrid: {
    justifyContent: "space-between",
    paddingVertical: 10,
    marginRight: 12,
    width: 40,
  },
  graphAxisLabel: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "right",
    fontWeight: "500",
  },
  barsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingLeft: 20,
    paddingBottom: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  barWrapper: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "80%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    textAlign: "center",
  },
  barWeight: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    fontWeight: "500",
  },
  noDataText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 40,
  },
  // Collector Dashboard New Styles
  collectorHeader: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 28,
  },
  collectorHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  collectorUserSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  collectorAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  collectorWelcome: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
  },
  collectorName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  earningsHighlight: {
    backgroundColor: "#334155",
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  earningsContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  earningsLeft: {
    marginRight: 16,
  },
  earningsCenter: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 2,
  },
  earningsSubtext: {
    fontSize: 12,
    color: "#94a3b8",
  },
  // Transparent Total Collected Card
  transparentTotalCard: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  transparentTotalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transparentIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(15, 118, 110, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  transparentTotalInfo: {
    flex: 1,
  },
  transparentTotalLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
  },
  transparentTotalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },
  transparentTotalSubtext: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  // My Assignments Quick Card
  assignmentsQuickCard: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  assignmentsQuickContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
  },
  assignmentsQuickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(20, 184, 166, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  assignmentsQuickInfo: {
    flex: 1,
  },
  assignmentsQuickLabel: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 2,
  },
  assignmentsQuickValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#14b8a6",
  },
  // Row-wise Stats Column
  quickStatsColumn: {
    gap: 12,
  },
  rowStatCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.15)",
  },
  rowStatLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowStatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  rowStatLabel: {
    color: "#cbd5e1",
    fontSize: 15,
    fontWeight: "600",
  },
  rowStatValue: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },
  quickStatsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    elevation: 1,
  },
  quickStatContent: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  gradientStatCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginTop: 4,
  },
  quickStatNumberLight: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 8,
  },
  quickStatLabelLight: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    marginTop: 4,
  },
  modernSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  modernSectionSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
  },
  beautifulEmptyCard: {
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  beautifulEmptyContent: {
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(15, 118, 110, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  beautifulEmptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  beautifulEmptyText: {
    fontSize: 15,
    color: "#cbd5e1",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  // Compact Request Card
  compactRequestCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  compactIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  compactCardContent: {
    flex: 1,
  },
  compactCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  compactMaterialTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
  compactNewBadge: {
    backgroundColor: "#fef3c7",
    height: 24,
  },
  compactNewBadgeText: {
    color: "#f59e0b",
    fontWeight: "700",
    fontSize: 10,
  },
  compactCardInfo: {
    gap: 4,
  },
  compactInfoText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  compactContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactContactText: {
    fontSize: 13,
    color: "#cbd5e1",
    fontWeight: "500",
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  detailsContainer: {
    padding: 24,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsHero: {
    alignItems: "center",
    marginBottom: 32,
  },
  detailsIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  detailsMaterialTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
  },
  detailsMetaRow: {
    flexDirection: "row",
    gap: 12,
  },
  detailsChip: {
    backgroundColor: "rgba(15, 118, 110, 0.15)",
  },
  detailsChipText: {
    color: "#5eead4",
    fontWeight: "600",
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 16,
  },
  detailsContactCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
  },
  detailsContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailsContactIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(15, 118, 110, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContactInfo: {
    flex: 1,
  },
  detailsContactLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
  },
  detailsContactValue: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "600",
  },
  detailsActionButton: {
    borderRadius: 10,
  },
  detailsActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  detailsCancelButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: "#334155",
  },
  detailsAcceptButton: {
    flex: 2,
    borderRadius: 12,
  },
  // Professional Request Card (Monthly Target Style)
  professionalRequestCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
  },
  requestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  requestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  requestTitleSection: {
    marginBottom: 12,
  },
  requestMaterialTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  requestTimeText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  requestChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  requestChip: {
    backgroundColor: "rgba(15, 118, 110, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  requestChipText: {
    color: "#5eead4",
    fontWeight: "600",
    fontSize: 12,
  },
  newBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 20,
  },
  newBadgeText: {
    color: "#f59e0b",
    fontWeight: "700",
    fontSize: 11,
  },
  requestContactBox: {
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
  },
  requestContactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  requestContactLabel: {
    color: "#94a3b8",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 12,
  },
  requestContactName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  requestContactText: {
    color: "#cbd5e1",
    fontSize: 14,
    flex: 1,
  },
  requestContactAction: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  requestBottomSection: {
    marginTop: 4,
  },
  requestCollectButton: {
    borderRadius: 10,
  },
  modernPickupCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  pickupGradient: {
    padding: 20,
  },
  modernPickupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  pickupMaterialSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modernMaterialIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  pickupMaterialInfo: {
    flex: 1,
  },
  modernPickupMaterial: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  pickupMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pickupWeight: {
    fontSize: 14,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  pickupDot: {
    fontSize: 14,
    color: "#64748b",
  },
  pickupTime: {
    fontSize: 14,
    color: "#94a3b8",
  },
  modernStatusChip: {
    backgroundColor: "#fef3c7",
    height: 32,
  },
  modernStatusText: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "700",
  },
  modernContactCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0f766e",
  },
  contactDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  modernContactLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  contactInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  contactInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#cbd5e1",
    lineHeight: 20,
  },
  modernActionButton: {
    marginLeft: "auto",
    borderRadius: 16,
    borderColor: "#0f766e",
    minWidth: 70,
  },
  modernPickupFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fffbeb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f59e0b",
  },
  modernCollectButton: {
    borderRadius: 16,
    elevation: 2,
    flex: 1,
  },
  // Recent Collections - Dark Theme with Gradient
  recentCollectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  recentCollectionGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  recentCollectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  recentCollectionInfo: {
    flex: 1,
  },
  recentCollectionMaterial: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  recentCollectionDate: {
    fontSize: 13,
    color: "#cbd5e1",
  },
  recentCollectionChip: {
    backgroundColor: "rgba(15, 118, 110, 0.15)",
    height: 32,
  },
  recentCollectionChipText: {
    color: "#5eead4",
    fontSize: 13,
    fontWeight: "600",
  },
  // List Style for Recent Collections
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 12,
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  listItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listItemChip: {
    backgroundColor: "rgba(15, 118, 110, 0.15)",
    height: 28,
    paddingBottom: 2,
  },
  listItemChipText: {
    color: "#5eead4",
    fontSize: 11,
    fontWeight: "600",
  },
  listSeparator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: 60,
  },
  // Collection Details Modal Styles
  collectionDetailsCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
  },
  collectionDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  collectionDetailLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
    flex: 1,
  },
  collectionDetailValue: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "right",
  },
});
