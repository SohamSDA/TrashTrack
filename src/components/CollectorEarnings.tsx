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

  // 2) totals - WEIGHT BASED (no coins!)
  const totalWeight = useMemo(
    () => myCollectedPickups.reduce((s, p) => s + (p.weight_kg || 0), 0),
    [myCollectedPickups]
  );

  const weeklyWeight = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return myCollectedPickups
      .filter((p) => new Date(p.updated_at || "") >= oneWeekAgo)
      .reduce((s, p) => s + (p.weight_kg || 0), 0);
  }, [myCollectedPickups]);

  const monthlyWeight = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return myCollectedPickups
      .filter((p) => new Date(p.updated_at || "") >= startOfMonth)
      .reduce((s, p) => s + (p.weight_kg || 0), 0);
  }, [myCollectedPickups]);

  const weeklyCollections = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return myCollectedPickups.filter(
      (p) => new Date(p.updated_at || "") >= oneWeekAgo
    ).length;
  }, [myCollectedPickups]);

  const monthlyCollections = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return myCollectedPickups.filter(
      (p) => new Date(p.updated_at || "") >= startOfMonth
    ).length;
  }, [myCollectedPickups]);

  // 3) material breakdown - WEIGHT AND COUNT (no coins!)
  const materialBreakdown = useMemo(() => {
    const acc: Record<string, { count: number; weight: number }> = {};
    for (const p of myCollectedPickups) {
      const material = p.material_code?.toUpperCase() || "UNKNOWN";
      if (!acc[material]) acc[material] = { count: 0, weight: 0 };
      acc[material].count += 1;
      acc[material].weight += p.weight_kg || 0;
    }
    return Object.entries(acc)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.weight - a.weight);
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

  // Monthly target: 50kg of materials
  const monthlyTarget = 50;
  const monthlyProgress = Math.min((monthlyWeight / monthlyTarget) * 100, 100);

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
        <Text style={styles.compactName}>{displayName}</Text>
        <View style={styles.compactRoleChip}>
          <MaterialCommunityIcons
            name="shield-check"
            size={14}
            color="#14b8a6"
          />
          <Text style={styles.compactRoleText}>Collector</Text>
        </View>

        {/* Compact Stats Grid - 2x2 */}
        <View style={styles.compactStatsGrid}>
          {/* Total Collected */}
          <View style={styles.compactStatCard}>
            <View style={styles.compactStatIcon}>
              <MaterialCommunityIcons
                name="weight-kilogram"
                size={20}
                color="#14b8a6"
              />
            </View>
            <Text style={styles.compactStatLabel}>Total Collected</Text>
            <Text style={styles.compactStatValue}>
              {totalWeight.toFixed(1)} kg
            </Text>
          </View>

          {/* This Week */}
          <View style={styles.compactStatCard}>
            <View style={styles.compactStatIcon}>
              <MaterialCommunityIcons
                name="trending-up"
                size={20}
                color="#14b8a6"
              />
            </View>
            <Text style={styles.compactStatLabel}>This Week</Text>
            <Text style={styles.compactStatValue}>
              {weeklyWeight.toFixed(1)} kg
            </Text>
          </View>

          {/* This Month */}
          <View style={styles.compactStatCard}>
            <View style={styles.compactStatIcon}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={20}
                color="#14b8a6"
              />
            </View>
            <Text style={styles.compactStatLabel}>This Month</Text>
            <Text style={styles.compactStatValue}>
              {monthlyWeight.toFixed(1)} kg
            </Text>
          </View>

          {/* Collections */}
          <View style={styles.compactStatCard}>
            <View style={styles.compactStatIcon}>
              <MaterialCommunityIcons
                name="recycle"
                size={20}
                color="#14b8a6"
              />
            </View>
            <Text style={styles.compactStatLabel}>Collections</Text>
            <Text style={styles.compactStatValue}>
              {myCollectedPickups.length}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* BODY (dark theme) */}
      <View style={styles.sheet}>
        {/* monthly card */}
        <View style={styles.professionalCard}>
          {/* Header with Icon */}
          <View style={styles.professionalCardHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="target" size={28} color="#14b8a6" />
            </View>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={24}
              color="#94a3b8"
            />
          </View>

          {/* Title and Date */}
          <View style={styles.cardTitleSection}>
            <Text style={styles.professionalCardTitle}>Monthly Target</Text>
            <Text style={styles.professionalCardDate}>
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>

          {/* Chips */}
          <View style={styles.chipsRow}>
            <View style={styles.chipDark}>
              <Text style={styles.chipTextDark}>
                {monthlyWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.chipSuccess}>
              <Text style={styles.chipTextSuccess}>
                {monthlyProgress.toFixed(0)}%
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBoxDark}>
            <View style={styles.infoRowDark}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color="#94a3b8"
              />
              <Text style={styles.infoTextLabelDark}>Target Details</Text>
            </View>
            <Text style={styles.infoTextDark}>
              Collect at least {monthlyTarget} kg this month
            </Text>
            <Text style={styles.infoTextDark}>
              {monthlyCollections} collections completed
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrackDark}>
            <View
              style={[
                styles.progressFillDark,
                { width: `${monthlyProgress}%` },
              ]}
            />
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#14b8a6"
              />
              <Text style={styles.bottomValueDark}>
                {monthlyProgress.toFixed(0)}% Complete
              </Text>
            </View>
          </View>
        </View>

        {/* material breakdown */}
        <View style={styles.professionalCard}>
          {/* Header with Icon */}
          <View style={styles.professionalCardHeader}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons
                name="chart-donut"
                size={28}
                color="#c084fc"
              />
            </View>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={24}
              color="#94a3b8"
            />
          </View>

          {/* Title and Date */}
          <View style={styles.cardTitleSection}>
            <Text style={styles.professionalCardTitle}>Material Breakdown</Text>
            <Text style={styles.professionalCardDate}>All time statistics</Text>
          </View>

          {materialBreakdown.length === 0 ? (
            <View style={styles.emptyBoxDark}>
              <MaterialCommunityIcons
                name="progress-question"
                size={34}
                color="#64748b"
              />
              <Text style={styles.emptyTextDark}>
                Collect some pickups to see stats
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14, marginTop: 16 }}>
              {materialBreakdown.map((item, idx) => {
                const pct =
                  totalWeight > 0 ? (item.weight / totalWeight) * 100 : 0;
                const colors = ["#0ea5e9", "#a855f7", "#f97316", "#22c55e"];
                const color = colors[idx % colors.length];

                return (
                  <View key={item.material} style={{ gap: 6 }}>
                    <View style={styles.breakRowDark}>
                      <View style={styles.breakLeft}>
                        <View
                          style={[
                            styles.breakIconDark,
                            { backgroundColor: color + "22" },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name="leaf"
                            color={color}
                            size={18}
                          />
                        </View>
                        <View>
                          <Text style={styles.breakMaterialDark}>
                            {item.material}
                          </Text>
                          <Text style={styles.breakSubDark}>
                            {item.count} collections
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.breakWeightDark}>
                          {item.weight.toFixed(1)} kg
                        </Text>
                        <Text style={styles.breakPctDark}>
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressTrackSmDark}>
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
  value: number | string;
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
  },
  // Compact Header Styles
  compactName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  compactRoleChip: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.3)",
    marginBottom: 20,
  },
  compactRoleText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  // Compact Stats Grid (2x2)
  compactStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  compactStatCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.2)",
  },
  compactStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(20, 184, 166, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  compactStatLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  compactStatValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
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
  // Total Card Blended (No White Background)
  totalCardBlended: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.2)",
  },
  totalCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  totalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(20, 184, 166, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  totalTextSection: {
    flex: 1,
  },
  totalLabelBlended: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  totalValueBlended: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
  },
  // Row-wise Metric Cards
  metricsColumn: {
    gap: 12,
  },
  metricRowCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.15)",
  },
  metricRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  metricIconBoxRow: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(20, 184, 166, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  metricRowTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
  metricRowValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
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
    backgroundColor: "#0f172a",

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
  professionalCard: {
    backgroundColor: "#1e293b",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
  },
  professionalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(15, 118, 110, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleSection: {
    marginBottom: 12,
  },
  professionalCardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  professionalCardDate: {
    fontSize: 13,
    color: "#94a3b8",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  chipDark: {
    backgroundColor: "rgba(15, 118, 110, 0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipTextDark: {
    color: "#5eead4",
    fontWeight: "600",
    fontSize: 12,
  },
  chipSuccess: {
    backgroundColor: "rgba(5, 150, 105, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipTextSuccess: {
    color: "#6ee7b7",
    fontWeight: "600",
    fontSize: 12,
  },
  infoBoxDark: {
    backgroundColor: "rgba(15, 118, 110, 0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.2)",
  },
  infoRowDark: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoTextLabelDark: {
    color: "#94a3b8",
    marginLeft: 6,
    fontWeight: "600",
    fontSize: 12,
  },
  infoTextDark: {
    color: "#cbd5e1",
    fontSize: 14,
    marginBottom: 4,
  },
  progressTrackDark: {
    height: 10,
    backgroundColor: "rgba(15, 118, 110, 0.2)",
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFillDark: {
    height: "100%",
    backgroundColor: "#14b8a6",
    borderRadius: 999,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomValueDark: {
    color: "#ffffff",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 16,
  },
  emptyBoxDark: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
  },
  emptyTextDark: {
    color: "#64748b",
    fontSize: 13,
  },
  breakRowDark: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakIconDark: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  breakMaterialDark: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  breakSubDark: {
    fontSize: 11,
    color: "#94a3b8",
  },
  breakWeightDark: {
    fontWeight: "700",
    color: "#ffffff",
    fontSize: 16,
  },
  breakPctDark: {
    fontSize: 11,
    color: "#94a3b8",
  },
  progressTrackSmDark: {
    height: 6,
    backgroundColor: "rgba(15, 118, 110, 0.2)",
    borderRadius: 999,
    overflow: "hidden",
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
  breakWeight: { fontWeight: "600", color: "#0f172a" },
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
