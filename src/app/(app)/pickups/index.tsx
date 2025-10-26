import { AppPickup, useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, RefreshControl, View, ScrollView, Dimensions } from "react-native";
import { Button, Card, Chip, FAB, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function PickupsList() {
  const { pickups, loadPickups, markCollected, profile } = useAuthStore();
  
  // Check user role and render appropriate component
  if (profile?.role === "collector") {
    return <CollectorEarnings />;
  }
  
  return <RecyclerPickups />;
}

// Collector Earnings Dashboard Component
function CollectorEarnings() {
  const { pickups, loadAllPickups, profile, user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Filter pickups for this collector
  const myCollectedPickups = useMemo(
    () => pickups.filter((p) => p.status === "collected" && p.collector_id === user?.id),
    [pickups, user?.id]
  );

  // Calculate earnings
  const totalEarnings = useMemo(
    () => myCollectedPickups.reduce((sum, pickup) => sum + (pickup.coins_awarded || 0), 0),
    [myCollectedPickups]
  );

  // This week's earnings (last 7 days)
  const weeklyEarnings = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return myCollectedPickups
      .filter((p) => new Date(p.updated_at || "") >= oneWeekAgo)
      .reduce((sum, pickup) => sum + (pickup.coins_awarded || 0), 0);
  }, [myCollectedPickups]);

  // This month's earnings
  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return myCollectedPickups
      .filter((p) => new Date(p.updated_at || "") >= startOfMonth)
      .reduce((sum, pickup) => sum + (pickup.coins_awarded || 0), 0);
  }, [myCollectedPickups]);

  // Material breakdown
  const materialBreakdown = useMemo(() => {
    const breakdown = myCollectedPickups.reduce((acc, pickup) => {
      const material = pickup.material_code.toUpperCase();
      if (!acc[material]) {
        acc[material] = { count: 0, earnings: 0 };
      }
      acc[material].count += 1;
      acc[material].earnings += pickup.coins_awarded || 0;
      return acc;
    }, {} as Record<string, { count: number; earnings: number }>);

    return Object.entries(breakdown)
      .map(([material, data]) => ({ material, ...data }))
      .sort((a, b) => b.earnings - a.earnings);
  }, [myCollectedPickups]);

  useEffect(() => {
    loadAllPickups();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllPickups();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#0891b2", "#0e7490", "#155e75"]}
        className="px-6 pt-8 pb-6 rounded-b-3xl"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-white/80 text-sm font-medium">Collector Earnings</Text>
            <Text className="text-white text-2xl font-bold">
              {user?.user_metadata?.full_name || "Collector"}
            </Text>
          </View>
          <View className="bg-white/20 rounded-full p-3">
            <MaterialCommunityIcons name="chart-line" size={28} color="white" />
          </View>
        </View>

        {/* Earnings Stats Cards */}
        <View className="flex-row gap-3">
          <Card className="flex-1 bg-white/95">
            <Card.Content className="items-center py-4">
              <MaterialCommunityIcons name="coins" size={32} color="#f59e0b" />
              <Text className="text-2xl font-bold text-gray-800 mt-2">{totalEarnings}</Text>
              <Text className="text-sm text-gray-600">Total Earned</Text>
            </Card.Content>
          </Card>
          
          <Card className="flex-1 bg-white/95">
            <Card.Content className="items-center py-4">
              <MaterialCommunityIcons name="calendar-week" size={32} color="#10b981" />
              <Text className="text-2xl font-bold text-gray-800 mt-2">{weeklyEarnings}</Text>
              <Text className="text-sm text-gray-600">This Week</Text>
            </Card.Content>
          </Card>
        </View>
      </LinearGradient>

      <View className="px-6 py-6 space-y-6">
        {/* Monthly Progress */}
        <Card className="bg-white shadow-sm">
          <Card.Content className="p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-800">Monthly Progress</Text>
              <MaterialCommunityIcons name="target" size={24} color="#3b82f6" />
            </View>
            
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-3xl font-bold text-blue-600">{monthlyEarnings}</Text>
              <Text className="text-sm text-gray-500">coins this month</Text>
            </View>
            
            <View className="bg-gray-200 rounded-full h-3 mb-2">
              <View 
                className="bg-blue-500 h-3 rounded-full"
                style={{ width: `${Math.min((monthlyEarnings / 500) * 100, 100)}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500">Goal: 500 coins/month</Text>
          </Card.Content>
        </Card>

        {/* Material Breakdown */}
        {materialBreakdown.length > 0 && (
          <Card className="bg-white shadow-sm">
            <Card.Content className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">Material Breakdown</Text>
                <MaterialCommunityIcons name="chart-pie" size={24} color="#8b5cf6" />
              </View>
              
              <View className="space-y-3">
                {materialBreakdown.map((item, index) => {
                  const percentage = totalEarnings > 0 ? (item.earnings / totalEarnings) * 100 : 0;
                  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
                  const color = colors[index % colors.length];
                  
                  return (
                    <View key={item.material} className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: color }}
                        />
                        <View className="flex-1">
                          <Text className="font-semibold text-gray-800">{item.material}</Text>
                          <Text className="text-sm text-gray-500">{item.count} pickups</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-gray-800">{item.earnings} coins</Text>
                        <Text className="text-sm text-gray-500">{percentage.toFixed(1)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Recent Collections */}
        {myCollectedPickups.length > 0 && (
          <Card className="bg-white shadow-sm">
            <Card.Content className="p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-gray-800">Recent Collections</Text>
                <MaterialCommunityIcons name="history" size={24} color="#6b7280" />
              </View>
              
              <View className="space-y-3">
                {myCollectedPickups.slice(0, 5).map((pickup, index) => (
                  <View key={pickup.id} className="flex-row items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-green-100 rounded-full p-2 mr-3">
                        <MaterialCommunityIcons name="check" size={16} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">
                          {pickup.material_code.toUpperCase()} • {pickup.weight_kg}kg
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {new Date(pickup.updated_at || "").toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <Chip 
                      mode="flat" 
                      className="bg-green-100"
                      textStyle={{ color: "#10b981", fontSize: 12, fontWeight: "600" }}
                    >
                      +{pickup.coins_awarded || 0}
                    </Chip>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {myCollectedPickups.length === 0 && (
          <Card className="bg-white shadow-sm">
            <Card.Content className="items-center py-12">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <MaterialCommunityIcons name="chart-line-variant" size={48} color="#6b7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-800 mb-2">No Collections Yet</Text>
              <Text className="text-gray-500 text-center">
                Start collecting pickups to see your earnings and statistics here!
              </Text>
              <Button 
                mode="contained" 
                className="mt-4 bg-blue-500"
                onPress={() => router.push("/(app)/")}
              >
                View Available Pickups
              </Button>
            </Card.Content>
          </Card>
        )}
        
        {/* Bottom Padding */}
        <View className="h-6" />
      </View>
    </ScrollView>
  );
}

// Original Recycler Pickups Component
function RecyclerPickups() {
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
