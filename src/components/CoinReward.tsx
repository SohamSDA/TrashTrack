import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Text } from "react-native-paper";

interface CoinRewardProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

export const CoinReward: React.FC<CoinRewardProps> = ({
  amount,
  visible,
  onComplete,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            delay: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onComplete?.();
        // Reset animations
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.5);
        slideAnim.setValue(0);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [
          { translateX: -50 },
          { translateY: -25 },
          { translateY: slideAnim },
          { scale: scaleAnim },
        ],
        opacity: fadeAnim,
        zIndex: 1000,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.8)",
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <MaterialCommunityIcons name="plus-circle" size={24} color="#fbbf24" />
        <Text
          variant="titleLarge"
          style={{ color: "#fbbf24", fontWeight: "bold" }}
        >
          +{amount}
        </Text>
        <MaterialCommunityIcons name="leaf" size={20} color="#16a34a" />
      </View>
    </Animated.View>
  );
};

export default CoinReward;
