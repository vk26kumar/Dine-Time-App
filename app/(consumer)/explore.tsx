// app/(consumer)/explore.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  StatusBar,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  ScrollView,
  Image,
  Easing,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { restaurantService } from "../../services/restaurantService";
import { Restaurant } from "../../types";
import ExploreHeader, {
  THEMES,
  LIGHT_ACCENTS,
} from "../../components/consumer/ExploreHeader";
import RestaurantCard, {
  RestaurantCardSkeleton,
} from "../../components/restaurant/RestaurantCard";
import LocationFetchingModal from "../../components/common/LocationFetchingModal";
import { useLocation } from "../../contexts/LocationContext";

const { width: SW } = Dimensions.get("window");
const PAGE_BG = "#F5F6F8";
const STICKY_THRESHOLD = 300;

const COLLECTIONS = [
  {
    id: "c1",
    title: "Rooftop Dining",
    subtitle: "12 places",
    emoji: "🌃",
    image:
      "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80",
  },
  {
    id: "c2",
    title: "Best Buffets",
    subtitle: "8 places",
    emoji: "🍱",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80",
  },
  {
    id: "c3",
    title: "Fine Dining",
    subtitle: "15 places",
    emoji: "🥂",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80",
  },
  {
    id: "c4",
    title: "Family Spots",
    subtitle: "20 places",
    emoji: "👨‍👩‍👧",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80",
  },
  {
    id: "c5",
    title: "Late Night",
    subtitle: "9 places",
    emoji: "🌙",
    image:
      "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=400&q=80",
  },
  {
    id: "c6",
    title: "Quick Bites",
    subtitle: "6 places",
    emoji: "⚡",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80",
  },
];

const CURATED = [
  {
    id: "p1",
    label: "Editor's Pick",
    title: "Sky-High Brunch",
    emoji: "🌤️",
    image:
      "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80",
  },
  {
    id: "p2",
    label: "Trending Now",
    title: "Coastal Seafood",
    emoji: "🐟",
    image:
      "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&q=80",
  },
  {
    id: "p3",
    label: "Must Try",
    title: "Garden Bistro",
    emoji: "🌿",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  },
  {
    id: "p4",
    label: "Weekend Special",
    title: "Golden Dusk",
    emoji: "✨",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading: locationLoading } = useLocation();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [activeThemeIdx, setActiveThemeIdx] = useState(0);

  const activeTheme = THEMES[activeThemeIdx];
  const accentColor = activeTheme.accent;
  const isLightAccent = LIGHT_ACCENTS.has(accentColor);

  const stickyY = useRef(new Animated.Value(-100)).current;
  const stickyOpac = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = (await restaurantService.getRestaurants()).restaurants;
      setRestaurants(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = (await restaurantService.getRestaurants()).restaurants;
      setRestaurants(data);
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleThemeChange = useCallback(
    (idx: number) => setActiveThemeIdx(idx),
    [],
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > STICKY_THRESHOLD && !showSticky) {
      setShowSticky(true);
      Animated.parallel([
        Animated.spring(stickyY, {
          toValue: 0,
          tension: 65,
          friction: 13,
          useNativeDriver: true,
        }),
        Animated.timing(stickyOpac, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (y <= STICKY_THRESHOLD && showSticky) {
      setShowSticky(false);
      Animated.parallel([
        Animated.timing(stickyY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(stickyOpac, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const goSearch = () => router.push("/(consumer)/search" as any);
  const listData: (Restaurant | "skeleton")[] = loading
    ? ["skeleton", "skeleton", "skeleton"]
    : restaurants;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* ── Sticky Search Bar ── */}
      <Animated.View
        pointerEvents={showSticky ? "auto" : "none"}
        style={[
          styles.stickyWrap,
          { opacity: stickyOpac, transform: [{ translateY: stickyY }] },
        ]}
      >
        <LinearGradient
          colors={[activeTheme.overlayL + "F8", activeTheme.overlayR + "F0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.stickyShell, { paddingTop: insets.top + 8 }]}
        >
          <StickySearchBar
            accentColor={accentColor}
            isLightAccent={isLightAccent}
            onPress={goSearch}
            theme={activeTheme}
          />
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item === "skeleton" ? `sk-${i}` : (item as Restaurant).id
        }
        renderItem={({ item, index }) => {
          if (item === "skeleton") return <RestaurantCardSkeleton />;
          return (
            <RestaurantCard
              restaurant={item as Restaurant}
              index={index}
              onPress={() =>
                router.push(`/(consumer)/restaurant/${(item as Restaurant).id}`)
              }
            />
          );
        }}
        ListHeaderComponent={
          <ListHeader
            goSearch={goSearch}
            restaurantCount={restaurants.length}
            loading={loading}
            activeThemeIdx={activeThemeIdx}
            onThemeChange={handleThemeChange}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState accentColor={accentColor} theme={activeTheme} />
          ) : null
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[accentColor]}
            tintColor={accentColor}
          />
        }
      />

      <LocationFetchingModal visible={locationLoading} />
    </View>
  );
}

// ─── Sticky Search Bar ────────────────────────────────────────────────────────
function StickySearchBar({
  accentColor,
  isLightAccent,
  onPress,
  theme,
}: {
  accentColor: string;
  isLightAccent: boolean;
  onPress: () => void;
  theme: (typeof THEMES)[0];
}) {
  const shimmerX = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: SW + 200,
          duration: 2400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(3000),
      ]),
    ).start();
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.stickySearchOuter}
    >
      <View style={styles.stickySearchInner}>
        <Animated.View
          style={[
            styles.stickyShimmer,
            { transform: [{ translateX: shimmerX }, { skewX: "-12deg" }] },
          ]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[accentColor, accentColor + "BB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.stickyIconGrad}
        >
          <MaterialIcons
            name="search"
            size={14}
            color={isLightAccent ? "#1a0800" : "#fff"}
          />
        </LinearGradient>
        <Text style={styles.stickyPH} numberOfLines={1}>
          Search restaurants, cuisines…
        </Text>
        <View style={styles.stickyDivider} />
        <View
          style={[
            styles.stickyFilterBtn,
            { backgroundColor: accentColor + "25" },
          ]}
        >
          <MaterialIcons name="tune" size={13} color={accentColor} />
          <Text style={[styles.stickyFilterText, { color: accentColor }]}>
            Filter
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── List Header ──────────────────────────────────────────────────────────────
function ListHeader({
  goSearch,
  restaurantCount,
  loading,
  activeThemeIdx,
  onThemeChange,
}: {
  goSearch: () => void;
  restaurantCount: number;
  loading: boolean;
  activeThemeIdx: number;
  onThemeChange: (idx: number) => void;
}) {
  const activeTheme = THEMES[activeThemeIdx];
  const accentColor = activeTheme.accent;
  return (
    <>
      <ExploreHeader
        onSearchPress={goSearch}
        restaurantCount={restaurantCount}
        onThemeChange={onThemeChange}
      />
      <CollectionsSection accentColor={accentColor} />
      <CuratedSection accentColor={accentColor} />
      <NearYouLabel
        count={restaurantCount}
        loading={loading}
        accentColor={accentColor}
      />
    </>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  accentColor,
}: {
  title: string;
  accentColor: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionDot, { backgroundColor: accentColor }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View
        style={[styles.sectionRule, { backgroundColor: accentColor + "35" }]}
      />
    </View>
  );
}

// ─── Collections ─────────────────────────────────────────────────────────────
function CollectionsSection({ accentColor }: { accentColor: string }) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Collections" accentColor={accentColor} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.collScroll}
      >
        {COLLECTIONS.map((col) => (
          <CollectionCard key={col.id} col={col} />
        ))}
      </ScrollView>
    </View>
  );
}

function CollectionCard({ col }: { col: (typeof COLLECTIONS)[0] }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.93,
          useNativeDriver: true,
          speed: 60,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
        }).start()
      }
    >
      <Animated.View style={[styles.collCard, { transform: [{ scale }] }]}>
        <Image
          source={{ uri: col.image }}
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
        />

        {/* Neutral dark scrim — no color tint */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.68)"]}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill as any}
        />

        {/* Emoji badge */}
        <View style={styles.collEmojiBadge}>
          <Text style={styles.collEmoji}>{col.emoji}</Text>
        </View>

        {/* Bottom text */}
        <View style={styles.collBottom}>
          <Text style={styles.collTitle}>{col.title}</Text>
          <View style={styles.collPill}>
            <MaterialIcons
              name="place"
              size={8}
              color="rgba(255,255,255,0.70)"
            />
            <Text style={styles.collPillText}>{col.subtitle}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Curated ──────────────────────────────────────────────────────────────────
function CuratedSection({ accentColor }: { accentColor: string }) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Curated for You" accentColor={accentColor} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.curatedScroll}
      >
        {CURATED.map((pick) => (
          <CuratedCard key={pick.id} pick={pick} accentColor={accentColor} />
        ))}
      </ScrollView>
    </View>
  );
}

function CuratedCard({
  pick,
  accentColor,
}: {
  pick: (typeof CURATED)[0];
  accentColor: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.96,
          useNativeDriver: true,
          speed: 60,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
        }).start()
      }
    >
      <Animated.View style={[styles.curatedCard, { transform: [{ scale }] }]}>
        <Image
          source={{ uri: pick.image }}
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
        />

        {/* Neutral cinematic scrim — no color tint */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          start={{ x: 0, y: 0.1 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill as any}
        />
        {/* Subtle top dark */}
        <LinearGradient
          colors={["rgba(0,0,0,0.22)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.4 }}
          style={StyleSheet.absoluteFill as any}
        />

        {/* Label chip — only accent color retained here for identity */}
        <View style={[styles.curatedChip, { backgroundColor: accentColor }]}>
          <Text
            style={[
              styles.curatedChipText,
              { color: LIGHT_ACCENTS.has(accentColor) ? "#1a0800" : "#fff" },
            ]}
          >
            {pick.label}
          </Text>
        </View>

        {/* Bottom */}
        <View style={styles.curatedBottom}>
          <Text style={styles.curatedEmoji}>{pick.emoji}</Text>
          <View style={styles.curatedTextCol}>
            <Text style={styles.curatedTitle}>{pick.title}</Text>
            <View
              style={[
                styles.curatedAccentBar,
                { backgroundColor: accentColor },
              ]}
            />
          </View>
          <View style={styles.curatedArrowBtn}>
            <MaterialIcons
              name="arrow-forward"
              size={13}
              color="rgba(255,255,255,0.85)"
            />
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Near You ─────────────────────────────────────────────────────────────────
function NearYouLabel({
  count,
  loading,
  accentColor,
}: {
  count: number;
  loading: boolean;
  accentColor: string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading)
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }).start();
  }, [loading]);

  return (
    <Animated.View style={[styles.nearYouRow, { opacity: fadeAnim }]}>
      <SectionHeader title="Near You" accentColor={accentColor} />
    </Animated.View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({
  accentColor,
  theme,
}: {
  accentColor: string;
  theme: (typeof THEMES)[0];
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.emptyWrap}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <View
          style={[styles.emptyIconWrap, { borderColor: accentColor + "40" }]}
        >
          <Text style={{ fontSize: 38 }}>🍽️</Text>
        </View>
      </Animated.View>
      <Text style={styles.emptyTitle}>No restaurants found</Text>
      <Text style={styles.emptySub}>
        Pull down to refresh or check back soon
      </Text>
      <View style={styles.emptyHints}>
        {[
          "Try a different location",
          "Check your internet",
          "Come back later",
        ].map((hint, i) => (
          <View
            key={i}
            style={[
              styles.emptyHintRow,
              { borderColor: accentColor + (i === 0 ? "30" : "18") },
            ]}
          >
            <View
              style={[
                styles.emptyHintDot,
                {
                  backgroundColor:
                    accentColor + (i === 0 ? "FF" : i === 1 ? "AA" : "55"),
                },
              ]}
            />
            <Text style={styles.emptyHintText}>{hint}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAGE_BG },

  // ── Sticky ──────────────────────────────────────────────────────────────────
  stickyWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 999 },
  stickyShell: { paddingHorizontal: 16, paddingBottom: 14 },
  stickySearchOuter: { borderRadius: 18, overflow: "hidden" },
  stickySearchInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 18,
    height: 50,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    overflow: "hidden",
  },
  stickyShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  stickyIconGrad: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  stickyPH: {
    flex: 1,
    fontSize: 13.5,
    color: "rgba(255,255,255,0.52)",
    fontWeight: "500",
  },
  stickyDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  stickyFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 22,
  },
  stickyFilterText: { fontSize: 11.5, fontWeight: "800", letterSpacing: 0.2 },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: { paddingTop: 26, paddingBottom: 6 },
  sectionHead: { paddingHorizontal: 16, marginBottom: 16, gap: 7 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F1B2D",
    letterSpacing: -0.4,
  },
  sectionRule: { height: 1, marginLeft: 16, borderRadius: 1 },

  // ── Collections ───────────────────────────────────────────────────────────────
  collScroll: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  collCard: {
    width: 136,
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  collEmojiBadge: {
    position: "absolute",
    top: 12,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },
  collEmoji: { fontSize: 16 },
  collBottom: { position: "absolute", bottom: 12, left: 10, right: 10, gap: 5 },
  collTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  collPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  collPillText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.80)",
  },

  // ── Curated ────────────────────────────────────────────────────────────────────
  curatedScroll: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  curatedCard: {
    width: SW - 72,
    height: 170,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1C1C1E",
  },
  curatedChip: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  curatedChipText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  curatedBottom: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  curatedEmoji: { fontSize: 24 },
  curatedTextCol: { flex: 1, gap: 5 },
  curatedTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  curatedAccentBar: { height: 2.5, width: 26, borderRadius: 2 },
  curatedArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Near You ──────────────────────────────────────────────────────────────────
  nearYouRow: { paddingTop: 28, paddingBottom: 4 },

  // ── Empty ─────────────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    backgroundColor: "#fff",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F1B2D",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyHints: { gap: 8, alignSelf: "stretch" },
  emptyHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyHintDot: { width: 7, height: 7, borderRadius: 4 },
  emptyHintText: { fontSize: 13, color: "#4B5563", fontWeight: "500" },
});
