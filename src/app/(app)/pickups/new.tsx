// src/app/(app)/pickups/new.tsx
import { useState } from "react";
import { Alert, View } from "react-native";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";
import { Button, Card, SegmentedButtons, Text } from "react-native-paper";
import { useAuthStore } from "@/lib/authStore";

type MaterialCode = "paper" | "plastic" | "iron";

export default function NewPickup() {
  const { requestPickup } = useAuthStore();

  const [material, setMaterial] = useState<MaterialCode>("paper");
  const [weight, setWeight] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!weight || Number.isNaN(weight) || weight <= 0) {
      Alert.alert("Invalid weight", "Please choose a weight greater than 0.");
      return;
    }
    setSubmitting(true);
    const res = await requestPickup(material, weight);
    setSubmitting(false);

    if (!res.ok) {
      Alert.alert("Failed", res.error ?? "Could not schedule the pickup.");
      return;
    }
    Alert.alert("Scheduled", "Your pickup has been scheduled.", [
      { text: "OK", onPress: () => router.replace("/pickups") },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f8f7", padding: 16, gap: 16 }}>
      <Card style={{ borderRadius: 16 }}>
        <Card.Content style={{ gap: 16 }}>
          <Text variant="titleLarge" style={{ fontWeight: "bold", color: "#16a34a" }}>
            Schedule New Pickup
          </Text>

          <Text variant="titleMedium">Select Material</Text>
          <SegmentedButtons
            value={material}
            onValueChange={(v) => setMaterial(v as MaterialCode)}
            buttons={[
              { value: "paper", label: "Paper", icon: "file-document-outline" },
              { value: "plastic", label: "Plastic", icon: "bottle-soda" },
              { value: "iron", label: "Iron", icon: "weight-kilogram" },
            ]}
          />

          <Text variant="titleMedium" style={{ marginTop: 8 }}>
            Weight: {weight.toFixed(1)} kg
          </Text>
          <Slider
            style={{ height: 40 }}
            value={weight}
            onValueChange={(v) => setWeight(v)}
            minimumValue={0.5}
            maximumValue={20}
            step={0.5}
          />

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={submitting}
            disabled={submitting}
            buttonColor="#16a34a"
            style={{ borderRadius: 12 }}
          >
            Schedule Pickup
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}
