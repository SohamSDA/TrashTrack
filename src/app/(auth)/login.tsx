import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email.toLowerCase().trim(), password);

      if (error) {
        Alert.alert(
          "Login Failed",
          error.message || "Invalid email or password"
        );
      } else {
        router.replace("/(app)");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#16a34a", "#059669", "#047857"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <MaterialCommunityIcons name="recycle" size={80} color="white" />
            <Text
              variant="headlineLarge"
              style={{
                color: "white",
                fontWeight: "bold",
                marginTop: 16,
                textAlign: "center",
              }}
            >
              TrashTrack
            </Text>
            <Text
              variant="titleMedium"
              style={{
                color: "rgba(255,255,255,0.8)",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Track. Collect. Earn.
            </Text>
          </View>

          <Card style={{ marginBottom: 20 }}>
            <Card.Content style={{ padding: 24, gap: 16 }}>
              <Text
                variant="headlineSmall"
                style={{ textAlign: "center", marginBottom: 8 }}
              >
                Welcome Back
              </Text>

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                left={<TextInput.Icon icon="email" />}
                disabled={loading}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoComplete="password"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                disabled={loading}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={{ marginTop: 8, paddingVertical: 8 }}
                labelStyle={{ fontSize: 16 }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </Card.Content>
          </Card>

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
              Don't have an account?
            </Text>
            <Button
              mode="outlined"
              textColor="white"
              style={{ borderColor: "white" }}
              disabled={loading}
              onPress={() => {
                router.push("./signup" as any);
              }}
            >
              Create Account
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
