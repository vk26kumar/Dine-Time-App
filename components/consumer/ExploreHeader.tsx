// components/consumer/ExploreHeader.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "../../contexts/LocationContext";
import { notificationService } from "../../services/notificationService";

const { width: SW } = Dimensions.get("window");
const PAGE_BG = "#F5F6F8";

// ─── How deep the wave dips (px) ─────────────────────────────────────────────
const WAVE_DEPTH = 28;
// ─── The white panel is wider than the screen so corners are off-screen ──────
const WAVE_EXTRA = 60; // px added to each side
// ─── Resulting border-radius for the desired wave depth ──────────────────────
// r = (w² + d²) / (2d)  — circle formula, w = half-panel-width, d = depth
const WAVE_W = SW / 2 + WAVE_EXTRA;
const WAVE_R = (WAVE_W * WAVE_W + WAVE_DEPTH * WAVE_DEPTH) / (2 * WAVE_DEPTH);

const THEMES = [
  {
    id: "fresh",
    overlayL: "#052E16",
    overlayR: "#065F46",
    accent: "#34D399",
    orbA: "rgba(52,211,153,0.28)",
    orbB: "rgba(16,185,129,0.18)",
    tag: "🌿  FRESH & HEALTHY",
    headline: "Clean Eating",
    sub: "Wholesome meals curated for a better you",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=85",
    cta: "Find Healthy",
    fx: "shimmer",
  },
  {
    id: "romance",
    overlayL: "#4A0010",
    overlayR: "#881337",
    accent: "#FDA4AF",
    orbA: "rgba(244,63,94,0.24)",
    orbB: "rgba(251,113,133,0.16)",
    tag: "🕯️  DATE NIGHT",
    headline: "Romance Awaits",
    sub: "Candlelit tables for two, just for you",
    image:
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=85",
    cta: "Book for Two",
    fx: "pulse",
  },
  {
    id: "sunrise",
    overlayL: "#431407",
    overlayR: "#9A3412",
    accent: "#FED7AA",
    orbA: "rgba(234,88,12,0.26)",
    orbB: "rgba(251,146,60,0.18)",
    tag: "☀️  MORNING BITES",
    headline: "Rise & Dine",
    sub: "Fresh brunch spots to kickstart your day",
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=85",
    cta: "Find Brunch",
    fx: "glow",
  },
  {
    id: "spring",
    overlayL: "#2E1065",
    overlayR: "#4C1D95",
    accent: "#C4B5FD",
    orbA: "rgba(167,139,250,0.26)",
    orbB: "rgba(124,58,237,0.18)",
    tag: "🌸  SPRING VIBES",
    headline: "Bloom & Dine",
    sub: "Light bites and garden views this season",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=85",
    cta: "Explore",
    fx: "shimmer",
  },
  {
    id: "cafe",
    overlayL: "#1C0A00",
    overlayR: "#451A03",
    accent: "#FDE68A",
    orbA: "rgba(217,119,6,0.26)",
    orbB: "rgba(146,64,14,0.18)",
    tag: "☕  CAFÉ CULTURE",
    headline: "Brew & Bite",
    sub: "Cosy cafés and artisan coffee near you",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=85",
    cta: "Find Cafés",
    fx: "glow",
  },
  {
    id: "summer",
    overlayL: "#0F172A",
    overlayR: "#1E3A5F",
    accent: "#FCD34D",
    orbA: "rgba(252,211,77,0.26)",
    orbB: "rgba(245,158,11,0.18)",
    tag: "🌞  SUMMER ",
    headline: "Hot & Happening",
    sub: "Rooftops, pools & summer menus await",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=85",
    cta: "Beat the Heat",
    fx: "pulse",
  },
  {
    id: "garden",
    overlayL: "#052E16",
    overlayR: "#14532D",
    accent: "#86EFAC",
    orbA: "rgba(34,197,94,0.24)",
    orbB: "rgba(16,185,129,0.16)",
    tag: "🌱  AL FRESCO",
    headline: "Garden Dining",
    sub: "Open-air restaurants with lush green vibes",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=85",
    cta: "Go Outdoors",
    fx: "shimmer",
  },
  {
    id: "cloud",
    overlayL: "#0C1445",
    overlayR: "#1E3A8A",
    accent: "#93C5FD",
    orbA: "rgba(96,165,250,0.26)",
    orbB: "rgba(29,78,216,0.18)",
    tag: "☁️  EASY GOING",
    headline: "Light & Breezy",
    sub: "Casual dining without the fuss or wait",
    image:
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=85",
    cta: "Discover",
    fx: "pulse",
  },
  {
    id: "dessert",
    overlayL: "#4A0020",
    overlayR: "#881337",
    accent: "#F9A8D4",
    orbA: "rgba(219,39,119,0.24)",
    orbB: "rgba(244,114,182,0.16)",
    tag: "🍰  SWEET TOOTH",
    headline: "Sweet Endings",
    sub: "Dessert lounges & pastry bars near you",
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=85",
    cta: "Treat Yourself",
    fx: "shimmer",
  },
  {
    id: "golden",
    overlayL: "#1C0A00",
    overlayR: "#713F12",
    accent: "#FEF08A",
    orbA: "rgba(250,204,21,0.26)",
    orbB: "rgba(180,83,9,0.18)",
    tag: "✨  GOLDEN HOUR",
    headline: "Dine at Dusk",
    sub: "Sunset views and golden-hour menus",
    image:
      "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=85",
    cta: "View Spots",
    fx: "glow",
  },
];

const LIGHT_ACCENTS = new Set([
  "#FED7AA",
  "#FDE68A",
  "#FCD34D",
  "#FEF08A",
  "#86EFAC",
  "#C4B5FD",
]);

export { THEMES, LIGHT_ACCENTS };

interface Props {
  onSearchPress: () => void;
  restaurantCount?: number;
  onThemeChange?: (themeIdx: number) => void;
}

export default function ExploreHeader({
  onSearchPress,
  restaurantCount = 0,
  onThemeChange,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();
  const {
    currentAddress,
    userLocation,
    loading: locationLoading,
  } = useLocation();

  const [themeIdx, setThemeIdx] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const themeIdxRef = useRef(0);
  const theme = THEMES[themeIdx];
  const ctaTextDark = LIGHT_ACCENTS.has(theme.accent);

  const BANNER_H = insets.top + 320;

  // ── Anim refs ─────────────────────────────────────────────────────────────
  const imgOpacities = useRef(
    THEMES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;
  const contentSlide = useRef(new Animated.Value(0)).current;
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;
  const orb1X = useRef(new Animated.Value(0)).current;
  const orb1Y = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-SW)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  // ── Mount entrance ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(headerFade, {
      toValue: 1,
      tension: 45,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Per-theme FX ──────────────────────────────────────────────────────────
  useEffect(() => {
    shimmerX.stopAnimation();
    glowPulse.stopAnimation();
    pulse1.stopAnimation();
    pulse2.stopAnimation();
    orb1Scale.stopAnimation();
    orb2Scale.stopAnimation();
    orb1X.stopAnimation();
    orb1Y.stopAnimation();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orb1Scale, {
            toValue: 1.35,
            duration: 4200,
            useNativeDriver: true,
          }),
          Animated.timing(orb1Scale, {
            toValue: 1,
            duration: 4200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb1X, {
            toValue: 18,
            duration: 5200,
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: -10,
            duration: 5200,
            useNativeDriver: true,
          }),
          Animated.timing(orb1X, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(orb1Y, {
            toValue: 14,
            duration: 4600,
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: -8,
            duration: 4600,
            useNativeDriver: true,
          }),
          Animated.timing(orb1Y, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2Scale, {
          toValue: 1.4,
          duration: 3600,
          useNativeDriver: true,
        }),
        Animated.timing(orb2Scale, {
          toValue: 1,
          duration: 3600,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    switch (theme.fx) {
      case "shimmer":
        shimmerX.setValue(-SW * 0.5);
        Animated.loop(
          Animated.sequence([
            Animated.timing(shimmerX, {
              toValue: SW * 1.6,
              duration: 1900,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(3200),
          ]),
        ).start();
        break;
      case "glow":
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowPulse, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(glowPulse, {
              toValue: 0.35,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ).start();
        break;
      case "pulse":
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse1, {
              toValue: 1,
              duration: 1800,
              useNativeDriver: true,
            }),
            Animated.timing(pulse1, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.delay(400),
          ]),
        ).start();
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulse2, {
                toValue: 1,
                duration: 1800,
                useNativeDriver: true,
              }),
              Animated.timing(pulse2, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
              Animated.delay(400),
            ]),
          ).start();
        }, 900);
        break;
    }
  }, [themeIdx]);

  // ── 5-second auto-transition ──────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const cur = themeIdxRef.current;
      const next = (cur + 1) % THEMES.length;
      runTransition(cur, next);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const runTransition = (cur: number, next: number) => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: -24,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(imgOpacities[cur], {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(imgOpacities[next], {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();
      themeIdxRef.current = next;
      setThemeIdx(next);
      onThemeChange?.(next);
      contentSlide.setValue(24);
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(contentSlide, {
          toValue: 0,
          tension: 58,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const jumpTo = (next: number) => {
    const cur = themeIdxRef.current;
    if (cur === next) return;
    runTransition(cur, next);
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (!userData?.uid) return;
      notificationService
        .getUnreadCount(userData.uid)
        .then(setUnreadCount)
        .catch(() => {});
    }, [userData?.uid]),
  );

  // ── Location ──────────────────────────────────────────────────────────────
  const loc = (() => {
    const src = currentAddress?.address || userLocation;
    if (!src) return { primary: "Select Location", secondary: "" };
    const p = src
      .split(",")
      .map((x: string) => x.trim())
      .filter(Boolean);
    return { primary: p[0] || "Location", secondary: p.slice(1, 3).join(", ") };
  })();

  const p1Scale = pulse1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.8],
  });
  const p1Opacity = pulse1.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.5, 0.14, 0],
  });
  const p2Scale = pulse2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.8],
  });
  const p2Opacity = pulse2.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.5, 0.14, 0],
  });

  return (
    <Animated.View style={[styles.root, { opacity: headerFade }]}>
      {/* ══════ BANNER ══════ */}
      <View style={[styles.banner, { height: BANNER_H }]}>
        {/* All images, only opacity toggles */}
        {THEMES.map((t, i) => (
          <Animated.View
            key={t.id}
            style={[StyleSheet.absoluteFill, { opacity: imgOpacities[i] }]}
            pointerEvents="none"
          >
            <Image
              source={{ uri: t.image }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </Animated.View>
        ))}

        {/* Bottom vignette */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.80)"]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Top vignette */}
        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "rgba(0,0,0,0.15)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Themed colour wash */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: theme.fx === "glow" ? glowPulse : 0.32 },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              theme.overlayL + "EE",
              theme.overlayR + "99",
              "transparent",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Shimmer */}
        {theme.fx === "shimmer" && (
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerX }, { skewX: "-10deg" }] },
            ]}
            pointerEvents="none"
          />
        )}

        {/* Orbs */}
        <Animated.View
          style={[
            styles.orb1,
            {
              backgroundColor: theme.orbA,
              transform: [
                { scale: orb1Scale },
                { translateX: orb1X },
                { translateY: orb1Y },
              ],
            },
          ]}
          pointerEvents="none"
        />
        <Animated.View
          style={[
            styles.orb2,
            { backgroundColor: theme.orbB, transform: [{ scale: orb2Scale }] },
          ]}
          pointerEvents="none"
        />

        {/* Pulse rings */}
        {theme.fx === "pulse" && (
          <>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: theme.accent + "66",
                  transform: [{ scale: p1Scale }],
                  opacity: p1Opacity,
                },
              ]}
              pointerEvents="none"
            />
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: theme.accent + "44",
                  transform: [{ scale: p2Scale }],
                  opacity: p2Opacity,
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}

        {/* ── NAV ROW ── */}
        <View style={[styles.navRow, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.locPill}
            onPress={() => router.push("/(consumer)/location-selector")}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.locIconWrap,
                {
                  backgroundColor: theme.accent + "2A",
                  borderColor: theme.accent + "55",
                },
              ]}
            >
              <MaterialIcons
                name="location-on"
                size={12}
                color={theme.accent}
              />
            </View>
            <View style={styles.locTexts}>
              <View style={styles.locRow}>
                <Text style={styles.locPrimary} numberOfLines={1}>
                  {locationLoading ? "Locating…" : loc.primary}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={13}
                  color="rgba(255,255,255,0.60)"
                />
              </View>
              {loc.secondary ? (
                <Text style={styles.locSub} numberOfLines={1}>
                  {loc.secondary}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={styles.navRight}>
            <TouchableOpacity
              style={styles.navIconBtn}
              onPress={() => router.push("/(consumer)/notifications" as any)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={unreadCount > 0 ? "notifications" : "notifications-none"}
                size={20}
                color="#FFF"
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoBtn}
              onPress={() => router.push("/(consumer)/profile" as any)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FF5A5F", "#FF8C42"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGrad}
              >
                <MaterialIcons name="restaurant" size={14} color="#FFF" />
              </LinearGradient>
              <View style={styles.logoTextRow}>
                <Text style={styles.logoWordDine}>dine</Text>
                <Text style={[styles.logoWordTime, { color: theme.accent }]}>
                  time
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SEARCH BAR ── */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={onSearchPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.accent, theme.accent + "BB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchIconGrad}
          >
            <MaterialIcons name="search" size={14} color="#FFF" />
          </LinearGradient>
          <Text style={styles.searchPH}>Search restaurants, cuisines…</Text>
          <View style={styles.searchRight}>
            <View style={styles.searchDiv} />
            <View
              style={[
                styles.filterBtn,
                { backgroundColor: theme.accent + "22" },
              ]}
            >
              <MaterialIcons name="tune" size={15} color={theme.accent} />
            </View>
          </View>
        </TouchableOpacity>

        {/* ── ANIMATED TEXT CARD ── */}
        <Animated.View
          style={[
            styles.themeCard,
            { opacity: contentFade, transform: [{ translateX: contentSlide }] },
          ]}
        >
          <View
            style={[
              styles.tagPill,
              {
                backgroundColor: theme.accent + "22",
                borderColor: theme.accent + "55",
              },
            ]}
          >
            <Text style={[styles.tagText, { color: theme.accent }]}>
              {theme.tag}
            </Text>
          </View>
          <Text style={styles.headline}>{theme.headline}</Text>
          <Text style={styles.subText}>{theme.sub}</Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: theme.accent }]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.ctaText,
                { color: ctaTextDark ? "#1a0800" : "#FFF" },
              ]}
            >
              {theme.cta}
            </Text>
            <MaterialIcons
              name="arrow-forward"
              size={12}
              color={ctaTextDark ? "#1a0800" : "#FFF"}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* ── PROGRESS DOTS ── */}
        <View style={styles.dotsRow}>
          {THEMES.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => jumpTo(i)}
              hitSlop={{ top: 8, bottom: 8, left: 5, right: 5 }}
            >
              <View
                style={[
                  styles.dotPip,
                  {
                    width: i === themeIdx ? 22 : 6,
                    backgroundColor:
                      i === themeIdx ? theme.accent : "rgba(255,255,255,0.35)",
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════════
            WAVE CURVE — rendered INSIDE the banner so it clips
            against banner overflow:hidden, giving a clean edge.
            The white pill is wider than the screen; only its top
            arc pokes into view, creating the concave wave.
        ══════════════════════════════════════════════════════════ */}
        <View style={styles.waveContainer} pointerEvents="none">
          <View style={[styles.wavePill, { backgroundColor: PAGE_BG }]} />
        </View>
      </View>
      {/* ══════ END BANNER ══════ */}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: PAGE_BG },

  banner: {
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 110,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  orb1: {
    position: "absolute",
    width: 290,
    height: 290,
    borderRadius: 145,
    top: -100,
    right: -80,
  },
  orb2: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    bottom: 60,
    left: -65,
  },
  pulseRing: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 1.5,
    top: -25,
    right: -25,
  },

  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  locPill: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  locIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  locTexts: { flex: 1, paddingRight: 6 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  locPrimary: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFF",
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  locSub: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
    marginTop: 1,
  },

  navRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#FF5A5F",
    borderWidth: 1.5,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: { fontSize: 8, fontWeight: "800", color: "#FFF" },

  logoBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoGrad: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoTextRow: { flexDirection: "row" },
  logoWordDine: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  logoWordTime: { fontSize: 13, fontWeight: "900", letterSpacing: -0.3 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 13,
    height: 44,
    paddingHorizontal: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIconGrad: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  searchPH: { flex: 1, fontSize: 13, color: "#9CA3AF", fontWeight: "500" },
  searchRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchDiv: { width: 1, height: 16, backgroundColor: "#E5E7EB" },
  filterBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },

  themeCard: { paddingHorizontal: 18, paddingBottom: 14 },
  tagPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tagText: { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.7 },
  headline: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  subText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.70)",
    marginBottom: 14,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },
  ctaText: { fontSize: 12, fontWeight: "800" },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    // Leave room for the wave — dots sit above it
    paddingBottom: WAVE_DEPTH + 10,
  },
  dotPip: { height: 5, borderRadius: 3 },

  // ── Wave curve ────────────────────────────────────────────────────────────
  // waveContainer sits at the very bottom of the banner
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: WAVE_DEPTH, // only this many px visible
    overflow: "hidden", // clips the huge pill
  },
  wavePill: {
    position: "absolute",
    // Extend past both sides so corner arcs are off-screen
    left: -WAVE_EXTRA,
    right: -WAVE_EXTRA,
    // The pill itself is taller than needed — we only show the top arc
    height: WAVE_R * 2,
    // Align the circle so its very top touches the top of waveContainer
    top: 0,
    borderTopLeftRadius: WAVE_R,
    borderTopRightRadius: WAVE_R,
  },
});
