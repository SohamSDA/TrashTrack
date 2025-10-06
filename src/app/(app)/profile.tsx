import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, ScrollView, View } from "react-native";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";

import { authService } from "@/lib/auth";
import { useAuthStore } from "@/lib/authStore";
import { router } from "expo-router";

export default function Profile() {
  const { user, profile, pickups, loadProfile, loadPickups, signOut } =
    useAuthStore();

  // local edit state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  // entrance animation (kept)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // ensure fresh data
    (async () => {
      await Promise.all([loadProfile(), loadPickups()]);
      setFullName((prev) => profile?.full_name ?? prev ?? "");
      setAvatarUrl((prev) => profile?.avatar_url ?? prev ?? "");
    })();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // keep inputs in sync if profile updates
    setFullName(profile?.full_name || "");
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile?.full_name, profile?.avatar_url]);

  // derived stats
  const completed = pickups.filter((p) => p.status === "collected").length;
  const pending = pickups.filter((p) => p.status === "requested").length;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await authService.updateProfile(user.id, {
      full_name: fullName || null,
      avatar_url: avatarUrl || null,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      return;
    }
    setIsEditing(false);
    await loadProfile();
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || "");
    setAvatarUrl(profile?.avatar_url || "");
    setIsEditing(false);
  };

  const initials = (fullName || user?.email || "U")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f6f8f7" }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          gap: 16,
        }}
      >
        {/* Header */}
        <Card style={{ borderRadius: 20, overflow: "hidden" }}>
          <Card.Content
            style={{ alignItems: "center", gap: 16, paddingVertical: 24 }}
          >
            {avatarUrl ? (
              <Avatar.Image size={96} source={{ uri: avatarUrl }} />
            ) : (
              <Avatar.Text size={96} label={initials} />
            )}
            <View style={{ alignItems: "center" }}>
              <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
                {profile?.full_name || user?.email || "Recycler"}
              </Text>
              {!!user?.email && (
                <Text
                  variant="bodyLarge"
                  style={{ color: "#6b7280", marginTop: 4 }}
                >
                  {user.email}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Enhanced Stats */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Card style={{ flex: 1, borderRadius: 16 }}>
            <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="check-circle"
                size={28}
                color="#16a34a"
              />
              <Text
                variant="headlineSmall"
                style={{ color: "#16a34a", fontWeight: "bold", marginTop: 6 }}
              >
                {completed}
              </Text>
              <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                Completed
              </Text>
            </Card.Content>
          </Card>

          <Card style={{ flex: 1, borderRadius: 16 }}>
            <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={28}
                color="#ea580c"
              />
              <Text
                variant="headlineSmall"
                style={{ color: "#ea580c", fontWeight: "bold", marginTop: 6 }}
              >
                {pending}
              </Text>
              <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                Pending
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Additional User Information */}
        <Card style={{ borderRadius: 16 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons
                name="information"
                size={24}
                color="#16a34a"
              />
              <Text
                variant="titleLarge"
                style={{ color: "#16a34a", fontWeight: "bold" }}
              >
                Account Information
              </Text>
            </View>
            <Divider style={{ marginBottom: 16 }} />

            <View style={{ gap: 12 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color="#6b7280"
                />
                <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                  Role:
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ fontWeight: "600", textTransform: "capitalize" }}
                >
                  {profile?.role || "Recycler"}
                </Text>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color="#6b7280"
                />
                <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                  Email:
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                  {user?.email || "Not provided"}
                </Text>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MaterialCommunityIcons
                  name="calendar"
                  size={20}
                  color="#6b7280"
                />
                <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                  Member since:
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "Recently"}
                </Text>
              </View>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MaterialCommunityIcons name="star" size={20} color="#6b7280" />
                <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                  Total Requests:
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                  {pickups.length}
                </Text>
              </View>

              {pickups.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <MaterialCommunityIcons
                    name="weight-kilogram"
                    size={20}
                    color="#6b7280"
                  />
                  <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
                    Total Weight:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                    {pickups
                      .reduce((sum, p) => sum + p.weight_kg, 0)
                      .toFixed(1)}{" "}
                    kg
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Profile Settings (real edit only) */}
        <Card style={{ borderRadius: 16 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons name="cog" size={24} color="#16a34a" />
              <Text
                variant="titleLarge"
                style={{ color: "#16a34a", fontWeight: "bold" }}
              >
                Profile Settings
              </Text>
            </View>
            <Divider style={{ marginBottom: 16 }} />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <MaterialCommunityIcons
                  name="account-edit"
                  size={24}
                  color="#6b7280"
                />
                <Text variant="bodyLarge">Edit profile details</Text>
              </View>
              <Switch value={isEditing} onValueChange={setIsEditing} />
            </View>

            {isEditing && (
              <>
                <Divider style={{ marginVertical: 16 }} />
                <TextInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  mode="outlined"
                  style={{ borderRadius: 12, marginBottom: 12 }}
                />
                <TextInput
                  label="Avatar URL (optional)"
                  value={avatarUrl}
                  onChangeText={setAvatarUrl}
                  mode="outlined"
                  autoCapitalize="none"
                  style={{ borderRadius: 12 }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    justifyContent: "flex-end",
                    marginTop: 16,
                  }}
                >
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={{ borderRadius: 12 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor="#16a34a"
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={{ borderRadius: 12 }}
                  >
                    Save
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Sign Out Section */}
        <Card style={{ borderRadius: 16 }}>
          <Card.Content>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons name="logout" size={24} color="#dc2626" />
              <Text
                variant="titleLarge"
                style={{ color: "#dc2626", fontWeight: "bold" }}
              >
                Account Actions
              </Text>
            </View>
            <Divider style={{ marginBottom: 16 }} />

            <Button
              mode="contained"
              buttonColor="#dc2626"
              icon="logout"
              onPress={() => {
                Alert.alert(
                  "Sign Out",
                  "Are you sure you want to sign out of your account?",
                  [
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                    {
                      text: "Sign Out",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await signOut();
                          router.replace("/(auth)/login");
                        } catch (error) {
                          console.error("Sign out error:", error);
                          Alert.alert(
                            "Error",
                            "Failed to sign out. Please try again."
                          );
                        }
                      },
                    },
                  ]
                );
              }}
              style={{ borderRadius: 12 }}
              contentStyle={{ paddingVertical: 8 }}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>

      {/* Bottom spacing */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}
