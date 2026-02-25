import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
}

const Dot = ({ delay }: { delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(800 - delay),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          }),
          transform: [
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default function LocationFetchingModal({ visible }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const barAnim = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(barAnim, {
            toValue: width,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(barAnim, {
            toValue: -160,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Icon */}
          <Animated.View
            style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}
          >
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGrad}
            >
              <MaterialIcons name="my-location" size={34} color="#FFF" />
            </LinearGradient>
          </Animated.View>

          {/* Text */}
          <Text style={styles.title}>Finding you…</Text>
          <Text style={styles.subtitle}>
            Locating nearby restaurants for you
          </Text>

          {/* Dots */}
          <View style={styles.dotsRow}>
            <Dot delay={0} />
            <Dot delay={180} />
            <Dot delay={360} />
          </View>

          {/* Progress bar */}
          <View style={styles.barTrack}>
            <Animated.View
              style={[styles.barFill, { transform: [{ translateX: barAnim }] }]}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },

  iconWrap: {
    marginBottom: 20,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  iconGrad: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F1B2D",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A95A3",
    marginBottom: 24,
  },

  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF5A5F",
  },

  barTrack: {
    width: width - 80,
    height: 4,
    backgroundColor: "#EEF0F4",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    width: 140,
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#FF5A5F",
  },
});
