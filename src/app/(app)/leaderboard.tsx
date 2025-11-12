import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Card, Text } from "react-native-paper";

type LeaderboardEntry = {
  id: string;
  full_name: string;
  coins_balance: number;
  rank: number;
};

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, coins_balance")
        .eq("role", "recycler")
        .order("coins_balance", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error loading leaderboard:", error);
        return;
      }

      const leaderboardData = (data || []).map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Exception loading leaderboard:", error);
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
                </View>
                <View style={styles.currentUserRight}>
                  <MaterialCommunityIcons
                    name="circle-multiple"
                    size={24}
                    color="#fbbf24"
                  />
                  <Text style={styles.currentUserCoins}>
                    {currentUserEntry.coins_balance}
                  </Text>
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
                        {entry.full_name || "Anonymous"}
                        {isCurrentUser && " (You)"}
                      </Text>
                      <View style={styles.coinsRow}>
                        <MaterialCommunityIcons
                          name="circle-multiple"
                          size={16}
                          color="#fbbf24"
                        />
                        <Text style={styles.coinsText}>
                          {entry.coins_balance} coins
                        </Text>
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
  currentUserRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    marginBottom: 4,
  },
  currentUserName: {
    color: "#16a34a",
    fontWeight: "700",
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
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
