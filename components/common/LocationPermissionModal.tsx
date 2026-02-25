import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onAllow: () => void;
  onSkip: () => void;
}

export default function LocationPermissionModal({
  visible,
  onAllow,
  onSkip,
}: Props) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
            toValue: 1.12,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
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
            style={[styles.iconRing, { transform: [{ scale: pulseAnim }] }]}
          >
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGrad}
            >
              <MaterialIcons name="location-on" size={34} color="#FFF" />
            </LinearGradient>
          </Animated.View>

          {/* Text */}
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>
            We'll show restaurants near you for a better discovery experience.
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Perms list */}
          {[
            { icon: "near-me", text: "Find restaurants nearby" },
            { icon: "star", text: "Personalised recommendations" },
            { icon: "lock-outline", text: "Never shared without consent" },
          ].map((item, i) => (
            <View key={i} style={styles.permRow}>
              <View style={styles.permIcon}>
                <MaterialIcons
                  name={item.icon as any}
                  size={15}
                  color="#FF5A5F"
                />
              </View>
              <Text style={styles.permText}>{item.text}</Text>
            </View>
          ))}

          {/* Buttons */}
          <TouchableOpacity
            onPress={onAllow}
            activeOpacity={0.85}
            style={styles.allowWrap}
          >
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.allowBtn}
            >
              <MaterialIcons name="my-location" size={17} color="#FFF" />
              <Text style={styles.allowText}>Allow Location Access</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSkip}
            activeOpacity={0.7}
            style={styles.skipBtn}
          >
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
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
    paddingBottom: 36,
    alignItems: "center",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },

  // Icon
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
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

  // Text
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F1B2D",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8A95A3",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 8,
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#EEF0F4",
    marginVertical: 20,
  },

  // Perms
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginBottom: 12,
  },
  permIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,90,95,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  permText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F1B2D",
  },

  // Buttons
  allowWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 24,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  allowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  allowText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
  },

  skipBtn: {
    marginTop: 14,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#B0B8C4",
  },
});
