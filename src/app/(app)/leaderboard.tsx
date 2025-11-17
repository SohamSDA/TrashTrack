import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";

type LeaderboardEntry = {
  id: string;
  full_name: string;
  coins_balance: number;
  rank: number;
  total_pickups?: number;
  total_weight?: number;
};

type LeaderboardStats = {
  totalRecyclers: number;
  totalCoins: number;
  totalPickups: number;
};

export default function Leaderboard() {
  const { user, profile, fixExistingPickups } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalRecyclers: 0,
    totalCoins: 0,
    totalPickups: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixingPickups, setFixingPickups] = useState(false);

  // Fix existing pickups (for testing)
  const handleFixPickups = async () => {
    setFixingPickups(true);
    try {
      const result = await fixExistingPickups();
      if (result.ok) {
        console.log("Successfully reset and recalculated all coins");
        // Force reload leaderboard to see changes
        setLeaderboard([]);
        setStats({ totalRecyclers: 0, totalCoins: 0, totalPickups: 0 });
        await loadLeaderboard();
      } else {
        console.error("Failed to reset coins:", result.error);
      }
    } catch (err) {
      console.error("Error resetting coins:", err);
    } finally {
      setFixingPickups(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setError(null);

      // Load leaderboard data with additional stats - ONLY RECYCLERS
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, coins_balance, role")
        .eq("role", "recycler") // Only get recyclers
        .order("coins_balance", { ascending: false, nullsFirst: false })
        .limit(100);

      if (profileError) {
        console.error("Error loading leaderboard:", profileError);
        setError("Failed to load leaderboard data");
        return;
      }

      console.log("Profile data loaded:", profileData?.length, "recyclers");

      // Get pickup statistics for each user
      const { data: pickupData, error: pickupError } = await supabase
        .from("pickups")
        .select("user_id, weight_kg, status")
        .in("status", ["collected", "completed"]);

      if (pickupError) {
        console.warn("Error loading pickup stats:", pickupError);
      }

      // Calculate user statistics
      const userStats = new Map();
      if (pickupData) {
        pickupData.forEach((pickup) => {
          const userId = pickup.user_id;
          const current = userStats.get(userId) || { count: 0, weight: 0 };
          current.count += 1;
          current.weight += Number(pickup.weight_kg) || 0;
          userStats.set(userId, current);
        });
      }

      // Combine profile and pickup data
      const leaderboardData = (profileData || [])
        .map((entry: any) => {
          const userPickupStats = userStats.get(entry.id) || {
            count: 0,
            weight: 0,
          };
          return {
            ...entry,
            total_pickups: userPickupStats.count,
            total_weight: Math.round(userPickupStats.weight * 100) / 100, // Round to 2 decimal places
            coins_balance: entry.coins_balance || 0,
            full_name: entry.full_name || "Anonymous User",
          };
        })
        .filter((entry: any) => {
          const hasCoins = (entry.coins_balance || 0) >= 0;
          const hasPickups = userStats.has(entry.id);
          return hasCoins; // Show all recyclers
        }) // Show all recyclers
        .sort((a: any, b: any) => {
          // Primary sort: coins (higher first)
          const coinsDiff = (b.coins_balance || 0) - (a.coins_balance || 0);
          if (coinsDiff !== 0) return coinsDiff;

          // Secondary sort: total pickups (more first)
          const pickupStatsA = userStats.get(a.id) || { count: 0, weight: 0 };
          const pickupStatsB = userStats.get(b.id) || { count: 0, weight: 0 };
          const pickupsDiff = pickupStatsB.count - pickupStatsA.count;
          if (pickupsDiff !== 0) return pickupsDiff;

          // Tertiary sort: total weight (more first)
          return pickupStatsB.weight - pickupStatsA.weight;
        })
        .map((entry: any, index: number) => ({
          ...entry,
          rank: index + 1,
        }));

      // Calculate overall stats
      const totalCoins = leaderboardData.reduce(
        (sum: number, entry: any) => sum + (entry.coins_balance || 0),
        0
      );
      const totalPickups = pickupData?.length || 0;

      setLeaderboard(leaderboardData);
      setStats({
        totalRecyclers: leaderboardData.length,
        totalCoins,
        totalPickups,
      });

      console.log("Final leaderboard data:", leaderboardData.length, "entries");
    } catch (error) {
      console.error("Exception loading leaderboard:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: "trophy", color: "#fbbf24" };
      case 2:
        return { icon: "medal", color: "#94a3b8" };
      case 3:
        return { icon: "medal", color: "#d97706" };
      default:
        return { icon: "account-circle", color: "#6b7280" };
    }
  };

  const currentUserEntry = leaderboard.find((entry) => entry.id === user?.id);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <MaterialCommunityIcons
                name="trophy-variant"
                size={48}
                color="#16a34a"
              />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Leaderboard</Text>
                <Text style={styles.headerSubtitle}>
                  Top recyclers earning coins!
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Overview */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.statsTitle}>Community Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={24}
                  color="#3b82f6"
                />
                <Text style={styles.statNumber}>{stats.totalRecyclers}</Text>
                <Text style={styles.statLabel}>Recyclers</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="circle-multiple"
                  size={24}
                  color="#fbbf24"
                />
                <Text style={styles.statNumber}>
                  {stats.totalCoins.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Coins</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="package-variant"
                  size={24}
                  color="#10b981"
                />
                <Text style={styles.statNumber}>{stats.totalPickups}</Text>
                <Text style={styles.statLabel}>Pickups Done</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Error Display */}
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <View style={styles.errorContent}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={24}
                  color="#dc2626"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Current User Rank */}
        {currentUserEntry && (
          <Card style={styles.currentUserCard}>
            <Card.Content>
              <View style={styles.currentUserContent}>
                <View style={styles.currentUserLeft}>
                  <Text style={styles.currentUserLabel}>Your Rank</Text>
                  <Text style={styles.currentUserRank}>
                    #{currentUserEntry.rank}
                  </Text>
                  <Text style={styles.currentUserSubtext}>
                    of {leaderboard.length} recyclers
                  </Text>
                </View>
                <View style={styles.currentUserRight}>
                  <View style={styles.currentUserStat}>
                    <MaterialCommunityIcons
                      name="circle-multiple"
                      size={20}
                      color="#fbbf24"
                    />
                    <Text style={styles.currentUserStatValue}>
                      {currentUserEntry.coins_balance || 0}
                    </Text>
                    <Text style={styles.currentUserStatLabel}>coins</Text>
                  </View>
                  <View style={styles.currentUserStat}>
                    <MaterialCommunityIcons
                      name="package-variant"
                      size={20}
                      color="#10b981"
                    />
                    <Text style={styles.currentUserStatValue}>
                      {currentUserEntry.total_pickups || 0}
                    </Text>
                    <Text style={styles.currentUserStatLabel}>pickups</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Leaderboard List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Recyclers</Text>
          <Text style={styles.sectionSubtitle}>
            {leaderboard.length} recyclers competing
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={64}
              color="#9ca3af"
            />
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyText}>
              Start recycling to appear on the leaderboard!
            </Text>
          </View>
        ) : (
          leaderboard.map((entry) => {
            const rankInfo = getRankIcon(entry.rank);
            const isCurrentUser = entry.id === user?.id;

            return (
              <Card
                key={entry.id}
                style={[
                  styles.leaderboardCard,
                  isCurrentUser && styles.currentUserHighlight,
                ]}
              >
                <Card.Content style={styles.leaderboardContent}>
                  {/* Rank */}
                  <View style={styles.rankSection}>
                    {entry.rank <= 3 ? (
                      <MaterialCommunityIcons
                        name={rankInfo.icon as any}
                        size={32}
                        color={rankInfo.color}
                      />
                    ) : (
                      <Text style={styles.rankNumber}>#{entry.rank}</Text>
                    )}
                  </View>

                  {/* User Info */}
                  <View style={styles.userSection}>
                    <View style={styles.userAvatar}>
                      <MaterialCommunityIcons
                        name="account-circle"
                        size={40}
                        color={isCurrentUser ? "#16a34a" : "#6b7280"}
                      />
                    </View>
                    <View style={styles.userInfo}>
                      <Text
                        style={[
                          styles.userName,
                          isCurrentUser && styles.currentUserName,
                        ]}
                      >
                        {entry.full_name}
                        {isCurrentUser && " (You)"}
                      </Text>
                      <View style={styles.userStatsRow}>
                        <View style={styles.coinsRow}>
                          <MaterialCommunityIcons
                            name="circle-multiple"
                            size={16}
                            color="#fbbf24"
                          />
                          <Text style={styles.coinsText}>
                            {entry.coins_balance || 0} coins
                          </Text>
                        </View>
                        {(entry.total_pickups ?? 0) > 0 && (
                          <View style={styles.pickupsRow}>
                            <MaterialCommunityIcons
                              name="package-variant"
                              size={14}
                              color="#10b981"
                            />
                            <Text style={styles.pickupsText}>
                              {entry.total_pickups ?? 0} pickups
                            </Text>
                          </View>
                        )}
                        {(entry.total_weight ?? 0) > 0 && (
                          <View style={styles.weightRow}>
                            <MaterialCommunityIcons
                              name="weight-kilogram"
                              size={14}
                              color="#6366f1"
                            />
                            <Text style={styles.weightText}>
                              {entry.total_weight ?? 0}kg
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Badge for top 3 */}
                  {entry.rank <= 3 && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: `${rankInfo.color}20` },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: rankInfo.color }]}
                      >
                        Top {entry.rank}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}

        {/* Bottom spacing for easier scrolling */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  errorCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
  },
  currentUserCard: {
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  currentUserContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentUserLeft: {
    flex: 1,
  },
  currentUserLabel: {
    fontSize: 13,
    color: "#15803d",
    fontWeight: "600",
    marginBottom: 4,
  },
  currentUserRank: {
    fontSize: 32,
    fontWeight: "800",
    color: "#16a34a",
  },
  currentUserSubtext: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: "500",
    marginTop: 2,
  },
  currentUserRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  currentUserStat: {
    alignItems: "center",
    minWidth: 60,
  },
  currentUserStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  currentUserStatLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  currentUserCoins: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  leaderboardCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
  },
  currentUserHighlight: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
    borderColor: "#16a34a",
  },
  leaderboardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  rankSection: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6b7280",
  },
  userSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  currentUserName: {
    color: "#16a34a",
    fontWeight: "700",
  },
  userStatsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  coinsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coinsText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  pickupsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pickupsText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weightText: {
    fontSize: 12,
    color: "#4338ca",
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  debugCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 12,
  },
  debugButton: {
    backgroundColor: "#ffc107",
  },
});
