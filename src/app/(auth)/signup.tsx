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
import {
  Button,
  Card,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";

export default function SignupScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"recycler" | "collector">("recycler");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signUp } = useAuthStore();

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Email is required");
      return false;
    }
    if (!fullName.trim()) {
      Alert.alert("Error", "Full name is required");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await signUp(
        email.toLowerCase().trim(),
        password,
        fullName.trim(),
        role
      );

      if (error) {
        Alert.alert(
          "Signup Failed",
          error.message || "Failed to create account"
        );
      } else {
        Alert.alert(
          "Account Created!",
          "Please check your email to verify your account before signing in.",
          [
            {
              text: "OK",
              onPress: () => router.push("/"),
            },
          ]
        );
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
            <MaterialCommunityIcons
              name="account-plus"
              size={80}
              color="white"
            />
            <Text
              variant="headlineLarge"
              style={{
                color: "white",
                fontWeight: "bold",
                marginTop: 16,
                textAlign: "center",
              }}
            >
              Join TrashTrack
            </Text>
            <Text
              variant="titleMedium"
              style={{
                color: "rgba(255,255,255,0.8)",
                textAlign: "center",
                marginTop: 8,
              }}
            >
              Start your recycling journey
            </Text>
          </View>

          <Card style={{ marginBottom: 20 }}>
            <Card.Content style={{ padding: 24, gap: 16 }}>
              <Text
                variant="headlineSmall"
                style={{ textAlign: "center", marginBottom: 8 }}
              >
                Create Account
              </Text>

              <TextInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                mode="outlined"
                autoCapitalize="words"
                autoComplete="name"
                left={<TextInput.Icon icon="account" />}
                disabled={loading}
              />

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
                autoComplete="new-password"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                disabled={loading}
              />

              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                left={<TextInput.Icon icon="lock-check" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                disabled={loading}
              />

              <View>
                <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                  I am a:
                </Text>
                <SegmentedButtons
                  value={role}
                  onValueChange={(value: any) => setRole(value)}
                  buttons={[
                    {
                      value: "recycler",
                      label: "Recycler",
                      icon: "recycle",
                    },
                    {
                      value: "collector",
                      label: "Collector",
                      icon: "truck",
                    },
                  ]}
                />
              </View>

              <Button
                mode="contained"
                onPress={handleSignup}
                loading={loading}
                disabled={loading}
                style={{ marginTop: 8, paddingVertical: 8 }}
                labelStyle={{ fontSize: 16 }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </Card.Content>
          </Card>

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
              Already have an account?
            </Text>
            <Button
              mode="outlined"
              textColor="white"
              style={{ borderColor: "white" }}
              disabled={loading}
              onPress={() => {
                router.push("./login" as any);
              }}
            >
              Sign In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
