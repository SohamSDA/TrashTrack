import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CollectorEarnings() {
  const { pickups, loadAllPickups, user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1) filter for this collector
  const myCollectedPickups = useMemo(
    () =>
      pickups.filter(
        (p) => p.status === "collected" && p.collector_id === user?.id
      ),
    [pickups, user?.id]
  );

  // 2) totals
  const totalEarnings = useMemo(
    () => myCollectedPickups.reduce((s, p) => s + (p.coins_awarded || 0), 0),
    [myCollectedPickups]
  );

  const weeklyEarnings = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return myCollectedPickups
      .filter((p) => new Date(p.updated_at || "") >= oneWeekAgo)
      .reduce((s, p) => s + (p.coins_awarded || 0), 0);
  }, [myCollectedPickups]);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return myCollectedPickups
      .filter((p) => new Date(p.updated_at || "") >= startOfMonth)
      .reduce((s, p) => s + (p.coins_awarded || 0), 0);
  }, [myCollectedPickups]);

  // 3) material breakdown
  const materialBreakdown = useMemo(() => {
    const acc: Record<string, { count: number; earnings: number }> = {};
    for (const p of myCollectedPickups) {
      const material = p.material_code?.toUpperCase() || "UNKNOWN";
      if (!acc[material]) acc[material] = { count: 0, earnings: 0 };
      acc[material].count += 1;
      acc[material].earnings += p.coins_awarded || 0;
    }
    return Object.entries(acc)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.earnings - a.earnings);
  }, [myCollectedPickups]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadAllPickups();
      setLoading(false);
    };
    loadData();
  }, [loadAllPickups]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllPickups();
    setRefreshing(false);
  }, [loadAllPickups]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")?.[0] ||
    "Collector";

  const monthlyTarget = 500;
  const monthlyProgress = Math.min(
    (monthlyEarnings / monthlyTarget) * 100,
    100
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 16 }}>
          Loading your earnings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0f766e"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* HERO SECTION */}
      <LinearGradient colors={["#0f172a", "#0f766e"]} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.userInfo}>
            <Text style={styles.welcome}>Welcome back 👋</Text>
            <Text style={styles.name}>{displayName}</Text>
            <View style={styles.roleChip}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color="#fff"
              />
              <Text style={styles.roleText}>Collector</Text>
            </View>
          </View>

          <View style={styles.totalCard}>
            <View style={styles.walletIconContainer}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={24}
                color="#0f766e"
              />
            </View>
            <Text style={styles.totalLabel}>Total Coins</Text>
            <Text style={styles.totalValue}>{totalEarnings}</Text>
          </View>
        </View>

        {/* METRICS ROW */}
        <View style={styles.metricsRow}>
          <Metric title="This Week" value={weeklyEarnings} icon="trending-up" />
          <Metric
            title="This Month"
            value={monthlyEarnings}
            icon="calendar-month"
          />
          <Metric
            title="Collections"
            value={myCollectedPickups.length}
            icon="recycle"
          />
        </View>
      </LinearGradient>

      {/* BODY (white sheet) */}
      <View style={styles.sheet}>
        {/* monthly card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Monthly Target</Text>
              <Text style={styles.cardSubtitle}>
                Earn at least {monthlyTarget} coins
              </Text>
            </View>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="target" color="#0f766e" size={14} />
              <Text style={styles.badgeText}>
                {monthlyProgress.toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.monthlyBody}>
            <View>
              <Text style={styles.monthlyValue}>{monthlyEarnings}</Text>
              <Text style={styles.monthlyLabel}>
                coins collected this month
              </Text>
            </View>
            <View style={styles.successPill}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={14}
                color="#166534"
              />
              <Text style={styles.successText}>
                {monthlyProgress.toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${monthlyProgress}%` }]}
            />
          </View>
        </View>

        {/* material breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Material Breakdown</Text>
            <MaterialCommunityIcons
              name="chart-donut"
              size={20}
              color="#0f766e"
            />
          </View>

          {materialBreakdown.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="progress-question"
                size={34}
                color="#94a3b8"
              />
              <Text style={styles.emptyText}>
                Collect some pickups to see stats
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {materialBreakdown.map((item, idx) => {
                const pct =
                  totalEarnings > 0 ? (item.earnings / totalEarnings) * 100 : 0;
                const colors = ["#0ea5e9", "#a855f7", "#f97316", "#22c55e"];
                const color = colors[idx % colors.length];

                return (
                  <View key={item.material} style={{ gap: 6 }}>
                    <View style={styles.breakRow}>
                      <View style={styles.breakLeft}>
                        <View
                          style={[
                            styles.breakIcon,
                            { backgroundColor: color + "22" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="leaf"
                            color={color}
                            size={16}
                          />
                        </View>
                        <View>
                          <Text style={styles.breakMaterial}>
                            {item.material}
                          </Text>
                          <Text style={styles.breakSub}>
                            {item.count} collections
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.breakCoins}>
                          {item.earnings} coins
                        </Text>
                        <Text style={styles.breakPct}>{pct.toFixed(0)}%</Text>
                      </View>
                    </View>
                    <View style={styles.progressTrackSm}>
                      <View
                        style={[
                          styles.progressFillSm,
                          { width: `${pct}%`, backgroundColor: color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Metric({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: any;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <View style={styles.metricBottom}>
        <Text style={styles.metricValue}>{value}</Text>
        <MaterialCommunityIcons name={icon} size={18} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  userInfo: {
    flex: 1,
    paddingRight: 16,
  },
  welcome: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 4,
  },
  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
  },
  roleChip: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  roleText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  totalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  walletIconContainer: {
    backgroundColor: "#e6fffa",
    padding: 12,
    borderRadius: 50,
    marginBottom: 8,
  },
  totalLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  totalValue: {
    color: "#0f766e",
    fontSize: 28,
    fontWeight: "700",
  },
  metricsRow: { flexDirection: "row", gap: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.18)",
    borderRadius: 18,
    padding: 10,
  },
  metricTitle: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  metricBottom: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricValue: { color: "#fff", fontSize: 18, fontWeight: "600" },
  sheet: {
    marginTop: -6,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  cardSubtitle: { fontSize: 12, color: "#94a3b8" },
  badge: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "rgba(15,118,110,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: "#0f766e", fontSize: 12, fontWeight: "600" },
  monthlyBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  monthlyValue: { fontSize: 30, fontWeight: "700", color: "#0f172a" },
  monthlyLabel: { fontSize: 11, color: "#94a3b8" },
  successPill: {
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  successText: { color: "#166534", fontSize: 12, fontWeight: "600" },
  progressTrack: {
    height: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0f766e",
    borderRadius: 999,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: { color: "#94a3b8", fontSize: 13 },
  breakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakLeft: { flexDirection: "row", gap: 10, alignItems: "center" },
  breakIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  breakMaterial: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  breakSub: { fontSize: 11, color: "#94a3b8" },
  breakCoins: { fontWeight: "600", color: "#0f172a" },
  breakPct: { fontSize: 11, color: "#94a3b8" },
  progressTrackSm: {
    height: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFillSm: {
    height: "100%",
    borderRadius: 999,
  },
});
