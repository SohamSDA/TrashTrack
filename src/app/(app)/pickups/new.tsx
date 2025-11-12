import { useAuthStore } from "@/lib/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
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
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";

type MaterialCode = "paper" | "plastic" | "iron";

export default function NewPickup() {
  const { requestPickup } = useAuthStore();

  const [material, setMaterial] = useState<MaterialCode>("paper");
  const [weight, setWeight] = useState<number>(2);
  const [pickupAddress, setPickupAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Error states for inline validation
  const [addressError, setAddressError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  // Success snackbar
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const validateIndianPhoneNumber = (phone: string): boolean => {
    // Remove all spaces, hyphens, and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "");

    // Check for Indian mobile number patterns
    // Indian mobile numbers: 10 digits starting with 6, 7, 8, 9
    // With country code: +91 followed by 10 digits
    const patterns = [
      /^[6789]\d{9}$/, // 10-digit mobile number
      /^91[6789]\d{9}$/, // With country code 91
      /^0[6789]\d{9}$/, // With leading 0
    ];

    return patterns.some((pattern) => pattern.test(cleanPhone));
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // Format as +91 XXXXX XXXXX if it's a valid Indian number
    if (digits.length === 10 && /^[6789]/.test(digits)) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
    }

    return phone;
  };

  const onSubmit = async () => {
    // Clear previous errors
    setAddressError("");
    setPhoneError("");
    setNameError("");

    let hasError = false;

    // Validate required fields with inline errors
    if (!weight || Number.isNaN(weight) || weight <= 0) {
      setSnackbarMessage("Please choose a weight greater than 0");
      setSnackbarVisible(true);
      return;
    }

    if (!pickupAddress.trim()) {
      setAddressError("Pickup address is required");
      hasError = true;
    }

    if (!contactNumber.trim()) {
      setPhoneError("Contact number is required");
      hasError = true;
    } else if (!validateIndianPhoneNumber(contactNumber)) {
      setPhoneError(
        "Invalid Indian mobile number (10 digits, starting with 6/7/8/9)"
      );
      hasError = true;
    }

    if (!contactName.trim()) {
      setNameError("Contact name is required");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Confirm Pickup Request",
      `Schedule pickup for ${weight}kg of ${material}?\n\nContact: ${contactName}\nPhone: ${contactNumber}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSubmitting(true);
            try {
              const formattedPhone = formatPhoneNumber(contactNumber);
              const res = await requestPickup(
                material,
                weight,
                pickupAddress.trim(),
                formattedPhone,
                contactName.trim()
              );

              if (!res.ok) {
                setSnackbarMessage(
                  res.error ?? "Could not schedule the pickup"
                );
                setSnackbarVisible(true);
                return;
              }

              // Success - show snackbar and navigate
              setSnackbarMessage("Pickup scheduled successfully! 🎉");
              setSnackbarVisible(true);

              setTimeout(() => {
                router.replace("/pickups");
              }, 1500);
            } catch (error) {
              setSnackbarMessage("Network error. Please try again.");
              setSnackbarVisible(true);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f6f8f7" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card style={{ borderRadius: 16, marginBottom: 16 }}>
          <Card.Content style={{ alignItems: "center", paddingVertical: 20 }}>
            <MaterialCommunityIcons name="truck" size={48} color="#16a34a" />
            <Text
              variant="headlineSmall"
              style={{ fontWeight: "bold", color: "#16a34a", marginTop: 8 }}
            >
              Schedule New Pickup
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: "#6b7280", textAlign: "center" }}
            >
              Provide details for your recyclable material collection
            </Text>
          </Card.Content>
        </Card>

        {/* Material Selection */}
        <Card style={{ borderRadius: 16, marginBottom: 16 }}>
          <Card.Content style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="recycle"
                size={24}
                color="#16a34a"
              />
              <Text
                variant="titleMedium"
                style={{ marginLeft: 8, fontWeight: "600" }}
              >
                Material Type
              </Text>
            </View>

            <SegmentedButtons
              value={material}
              onValueChange={(v) => setMaterial(v as MaterialCode)}
              buttons={[
                {
                  value: "paper",
                  label: "Paper",
                  icon: "file-document-outline",
                },
                { value: "plastic", label: "Plastic", icon: "bottle-soda" },
                { value: "iron", label: "Iron", icon: "weight-kilogram" },
              ]}
            />

            <View style={{ marginTop: 8 }}>
              <Text
                variant="titleMedium"
                style={{ marginBottom: 8, fontWeight: "600" }}
              >
                Weight: {weight.toFixed(1)} kg
              </Text>
              <Slider
                style={{ height: 40 }}
                value={weight}
                onValueChange={(v) => setWeight(v)}
                minimumValue={0.5}
                maximumValue={20}
                step={0.5}
                minimumTrackTintColor="#16a34a"
                maximumTrackTintColor="#d1d5db"
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <Text variant="bodySmall" style={{ color: "#6b7280" }}>
                  0.5 kg
                </Text>
                <Text variant="bodySmall" style={{ color: "#6b7280" }}>
                  20 kg
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card style={{ borderRadius: 16, marginBottom: 16 }}>
          <Card.Content style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="account-circle"
                size={24}
                color="#16a34a"
              />
              <Text
                variant="titleMedium"
                style={{ marginLeft: 8, fontWeight: "600" }}
              >
                Contact Details
              </Text>
            </View>

            <TextInput
              label="Contact Name"
              value={contactName}
              onChangeText={(text) => {
                setContactName(text);
                if (text.trim()) setNameError("");
              }}
              mode="outlined"
              placeholder="Your full name"
              left={<TextInput.Icon icon="account" />}
              disabled={submitting}
              autoCapitalize="words"
              error={!!nameError}
            />
            {nameError ? (
              <Text
                variant="bodySmall"
                style={{ color: "#dc2626", marginTop: -8 }}
              >
                {nameError}
              </Text>
            ) : null}

            <TextInput
              label="Contact Number"
              value={contactNumber}
              onChangeText={(text) => {
                setContactNumber(text);
                if (text.trim()) setPhoneError("");
              }}
              mode="outlined"
              placeholder="9876543210 or +91 98765 43210"
              keyboardType="phone-pad"
              left={<TextInput.Icon icon="phone" />}
              disabled={submitting}
              error={!!phoneError}
            />
            {phoneError ? (
              <Text
                variant="bodySmall"
                style={{ color: "#dc2626", marginTop: -8 }}
              >
                {phoneError}
              </Text>
            ) : (
              <Text
                variant="bodySmall"
                style={{ color: "#6b7280", marginTop: -8 }}
              >
                Enter 10-digit Indian mobile number
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Pickup Address */}
        <Card style={{ borderRadius: 16, marginBottom: 24 }}>
          <Card.Content style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color="#16a34a"
              />
              <Text
                variant="titleMedium"
                style={{ marginLeft: 8, fontWeight: "600" }}
              >
                Pickup Location
              </Text>
            </View>

            <TextInput
              label="Pickup Address"
              value={pickupAddress}
              onChangeText={(text) => {
                setPickupAddress(text);
                if (text.trim()) setAddressError("");
              }}
              mode="outlined"
              placeholder="House/Flat No., Street, Area, City, Pincode"
              multiline
              numberOfLines={3}
              left={<TextInput.Icon icon="home" />}
              disabled={submitting}
              error={!!addressError}
            />
            {addressError ? (
              <Text
                variant="bodySmall"
                style={{ color: "#dc2626", marginTop: -8 }}
              >
                {addressError}
              </Text>
            ) : (
              <Text
                variant="bodySmall"
                style={{ color: "#6b7280", marginTop: -8 }}
              >
                Provide complete address for pickup
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={submitting}
          disabled={submitting}
          buttonColor="#16a34a"
          style={{
            borderRadius: 12,
            paddingVertical: 8,
            elevation: 2,
            shadowColor: "#16a34a",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
          contentStyle={{ paddingVertical: 4 }}
          labelStyle={{ fontSize: 16, fontWeight: "600" }}
          icon={submitting ? undefined : "check-circle"}
        >
          {submitting ? "Scheduling Pickup..." : "Schedule Pickup"}
        </Button>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{
          backgroundColor: snackbarMessage.includes("🎉")
            ? "#16a34a"
            : "#dc2626",
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}
