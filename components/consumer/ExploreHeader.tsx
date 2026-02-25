import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";

const formatHeaderLocation = (
  currentAddress: any,
  userLocation: string | null,
) => {
  let locationString: string | null = null;
  if (currentAddress?.address) locationString = currentAddress.address;
  else if (userLocation) locationString = userLocation;

  if (locationString) {
    const parts = locationString
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return {
      primaryText: parts[0] || "Location Found",
      secondaryText: parts.slice(1).join(", ") || "",
    };
  }
  return {
    primaryText: "Select Location",
    secondaryText: "Tap to set your address",
  };
};

export default function ExploreHeader() {
  const router = useRouter();
  const { userData } = useAuth();
  const {
    currentAddress,
    userLocation,
    loading: locationLoading,
  } = useLocation();
  const insets = useSafeAreaInsets();

  // Breathing animation for orbs
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Orb 1 breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1Scale, {
          toValue: 1.15,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(orb1Scale, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Orb 2 breathe (offset)
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Scale, {
          toValue: 1.2,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Scale, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const { primaryText, secondaryText } = formatHeaderLocation(
    currentAddress,
    userLocation,
  );
  const mainDisplayLabel = locationLoading ? "Locating…" : primaryText;

  const initials = userData?.fullName?.charAt(0).toUpperCase() || "U";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <LinearGradient
      colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 12 }]}
    >
      {/* Animated orbs */}
      <Animated.View
        style={[styles.orb1, { transform: [{ scale: orb1Scale }] }]}
      />
      <Animated.View
        style={[styles.orb2, { transform: [{ scale: orb2Scale }] }]}
      />

      {/* Dot grid texture */}
      <View style={styles.dotGrid} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      <Animated.View style={{ opacity: fadeIn }}>
        {/* ── Top row: location + notification + profile ── */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={() => router.push("/(consumer)/location-selector")}
            activeOpacity={0.75}
          >
            <View style={styles.locationIconWrap}>
              <MaterialIcons name="location-on" size={14} color="#FF9F43" />
            </View>
            <View style={styles.locationTexts}>
              <View style={styles.labelRow}>
                <Text style={styles.primaryText} numberOfLines={1}>
                  {mainDisplayLabel}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
              {secondaryText ? (
                <Text style={styles.secondaryText} numberOfLines={1}>
                  {secondaryText}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            {/* Notification bell */}
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
              <MaterialIcons
                name="notifications-none"
                size={20}
                color="#FFFFFF"
              />
              <View style={styles.notifDot} />
            </TouchableOpacity>

            {/* Profile avatar */}
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => router.push("/(consumer)/profile-menu")}
              activeOpacity={0.8}
            >
              {userData?.profileImage ? (
                <Image
                  source={{ uri: userData.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <LinearGradient
                  colors={["#FF5A5F", "#FF9F43"]}
                  style={styles.profileInitial}
                >
                  <Text style={styles.profileInitialText}>{initials}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting row ── */}
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>
            {greeting}, {userData?.fullName?.split(" ")[0] || "there"} 👋
          </Text>
          <View style={styles.trendingPill}>
            <View style={styles.trendingDot} />
            <Text style={styles.trendingText}>Trending near you</Text>
          </View>
        </View>

        {/* ── Tagline ── */}
        <Text style={styles.tagline1}>Find your perfect</Text>
        <Text style={styles.tagline2}>dining experience</Text>

        {/* ── Stat chips ── */}
        <View style={styles.chipsRow}>
          {[
            { emoji: "🍽️", label: "200+ Restaurants" },
            { emoji: "⭐", label: "Top Rated" },
            { emoji: "🎟️", label: "Free Bookings" },
          ].map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <Text style={styles.chipEmoji}>{chip.emoji}</Text>
              <Text style={styles.chipText}>{chip.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* ── Accent bar ── */}
      <View style={styles.accentBar}>
        <View style={[styles.accentSegment, { backgroundColor: "#FF5A5F" }]} />
        <View style={[styles.accentSegment, { backgroundColor: "#FF9F43" }]} />
        <View style={[styles.accentSegment, { backgroundColor: "#A855F7" }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  // Orbs
  orb1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,90,95,0.18)",
    top: -50,
    right: -30,
  },
  orb2: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,159,67,0.12)",
    top: 30,
    right: 80,
  },

  // Dot grid texture
  dotGrid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 22,
    opacity: 0.15,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },

  // ── Top row ──
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  locationIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,159,67,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  locationTexts: { flex: 1, paddingRight: 6 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  primaryText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  secondaryText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    marginTop: 1,
    fontWeight: "500",
  },

  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF5A5F",
    borderWidth: 1.5,
    borderColor: "#3D1A6E",
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  profileImage: { width: "100%", height: "100%", borderRadius: 11 },
  profileInitial: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitialText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  // ── Greeting ──
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: -0.1,
  },
  trendingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  trendingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FF9F43",
  },
  trendingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.2,
  },

  // ── Tagline ──
  tagline1: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  tagline2: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FF9F43",
    paddingHorizontal: 16,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 18,
  },

  // ── Chips ──
  chipsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chipEmoji: { fontSize: 12 },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 0.1,
  },

  // ── Accent bar ──
  accentBar: { flexDirection: "row", height: 3 },
  accentSegment: { flex: 1 },
});
