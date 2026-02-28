import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const FEATURES = [
  { icon: "search", text: "Explore Restaurants", sub: "200+ venues nearby" },
  { icon: "event", text: "Instant Booking", sub: "Reserve in seconds" },
  { icon: "local-offer", text: "Exclusive Deals", sub: "Members-only offers" },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        }}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Light bottom gradient only — for text readability */}
        <LinearGradient
          colors={[
            "transparent",
            "transparent",
            "rgba(0, 0, 0, 0.2)",
            "rgba(0, 0, 0, 0.72)",
          ]}
          locations={[0, 0.35, 0.65, 1]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.content,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 },
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* ── Logo pill ── */}
          <View style={styles.logoPill}>
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoPillGrad}
            >
              <MaterialIcons name="restaurant" size={18} color="#FFFFFF" />
              <Text style={styles.logoPillText}>DINE TIME</Text>
            </LinearGradient>
          </View>

          {/* ── Title ── */}
          <Text style={styles.title}>Find Your{"\n"}Perfect Table</Text>
          <Text style={styles.subtitle}>
            Discover top restaurants, book instantly,{"\n"}and enjoy exclusive
            dining deals.
          </Text>

          {/* ── Feature cards ── */}
          <View style={styles.featuresWrap}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <LinearGradient
                  colors={["rgba(207, 84, 75, 0.58)", "rgba(255, 158, 67, 0.2)"]}
                  style={styles.featureIconWrap}
                >
                  <MaterialIcons
                    name={f.icon as any}
                    size={20}
                    color="#e96805"
                  />
                </LinearGradient>
                <View>
                  <Text style={styles.featureText}>{f.text}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── CTAs ── */}
          <View style={styles.ctaWrap}>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              activeOpacity={0.88}
              style={styles.primaryBtnWrap}
            >
              <LinearGradient
                colors={["#e94046", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Get Started</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

          </View>

          {/* ── Footer ── */}
          <Text style={styles.footer}>
            By continuing, you agree to our{" "}
            <Text style={styles.footerLink}>Terms</Text> &{" "}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "flex-end",
  },

  logoPill: {
    alignSelf: "flex-start",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 22,
  },
  logoPillGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  logoPillText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    lineHeight: 50,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 22,
    fontWeight: "400",
    marginBottom: 28,
  },

  featuresWrap: { gap: 10, marginBottom: 36 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  featureSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
    fontWeight: "400",
  },

  ctaWrap: { gap: 12, marginBottom: 80 },
  primaryBtnWrap: { borderRadius: 16, overflow: "hidden" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },

  footer: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: { color: "rgba(255,159,67,0.7)", fontWeight: "600" },
});
