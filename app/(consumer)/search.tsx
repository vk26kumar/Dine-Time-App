// app/(consumer)/search.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { restaurantService } from "../../services/restaurantService";
import { Restaurant } from "../../types";

const { width: SW } = Dimensions.get("window");

const CUISINES = [
  { name: "Indian", emoji: "🍛" },
  { name: "Chinese", emoji: "🍜" },
  { name: "Italian", emoji: "🍕" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Thai", emoji: "🍲" },
  { name: "Japanese", emoji: "🍣" },
  { name: "Continental", emoji: "🥩" },
  { name: "Fast Food", emoji: "🍔" },
  { name: "Café", emoji: "☕" },
  { name: "Desserts", emoji: "🍰" },
  { name: "Mughlai", emoji: "🫕" },
  { name: "South Indian", emoji: "🥘" },
];

const POPULAR_SEARCHES = [
  { label: "Near Me", icon: "location-on", color: "#FF5A5F" },
  { label: "Book Table", icon: "event-seat", color: "#6366F1" },
  { label: "Top Rated", icon: "star", color: "#F59E0B" },
  { label: "Free Booking", icon: "local-offer", color: "#10B981" },
  { label: "Rooftop", icon: "roofing", color: "#3B82F6" },
  { label: "Fine Dining", icon: "wine-bar", color: "#EC4899" },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState("");
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(18)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 65,
        friction: 13,
        useNativeDriver: true,
      }),
    ]).start();

    restaurantService
      .getRestaurants()
      .then((d) => {
        setAllRestaurants(d.restaurants);
        setResults(d.restaurants.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() && !selectedCuisine) {
      setResults(allRestaurants.slice(0, 6));
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const q = query.trim().toLowerCase();
      let filtered = [...allRestaurants];
      if (selectedCuisine)
        filtered = filtered.filter((r) => r.cuisine.includes(selectedCuisine));
      if (q) {
        filtered = filtered.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.cuisine.some((c) => c.toLowerCase().includes(q)) ||
            r.address?.city?.toLowerCase().includes(q) ||
            r.address?.state?.toLowerCase().includes(q),
        );
      }
      setResults(filtered);
      setSearching(false);
    }, 350);
  }, [query, selectedCuisine, allRestaurants]);

  const clearQuery = () => {
    setQuery("");
    setSelectedCuisine(null);
    inputRef.current?.focus();
  };

  const isFiltering = query.trim().length > 0 || !!selectedCuisine;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <MaterialIcons name="arrow-back" size={20} color="#0F1B2D" />
          </TouchableOpacity>

          {/* Search input */}
          <Animated.View
            style={[
              styles.inputShell,
              {
                borderColor: inputFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#E8EAEE", "#FF5A5F"],
                }),
              },
            ]}
          >
            <MaterialIcons
              name="search"
              size={17}
              color="#9CA3AF"
              style={{ marginRight: 8 }}
            />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Restaurants, cuisines, cities…"
              placeholderTextColor="#B8BFC9"
              value={query}
              onChangeText={setQuery}
              onFocus={() =>
                Animated.timing(inputFocusAnim, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }).start()
              }
              onBlur={() =>
                Animated.timing(inputFocusAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: false,
                }).start()
              }
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {(query.length > 0 || selectedCuisine) && (
              <TouchableOpacity
                onPress={clearQuery}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.clearBtn}>
                  <MaterialIcons name="close" size={11} color="#6B7280" />
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        <Animated.ScrollView
          style={{
            flex: 1,
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* ── Cuisines ── */}
          <View style={styles.section}>
            <SectionLabel
              title="Cuisines"
              right={
                selectedCuisine ? (
                  <TouchableOpacity
                    onPress={() => setSelectedCuisine(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearFilterText}>Clear</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cuisineScroll}
            >
              {CUISINES.map((c) => (
                <CuisineChip
                  key={c.name}
                  cuisine={c}
                  selected={selectedCuisine === c.name}
                  onPress={() =>
                    setSelectedCuisine(
                      selectedCuisine === c.name ? null : c.name,
                    )
                  }
                />
              ))}
            </ScrollView>
          </View>

          {/* ── Popular (only when not filtering) ── */}
          {!isFiltering && (
            <View style={styles.section}>
              <SectionLabel title="Popular Searches" />
              <View style={styles.popularGrid}>
                {POPULAR_SEARCHES.map((p) => (
                  <PopularChip
                    key={p.label}
                    item={p}
                    onPress={() => setQuery(p.label)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Results ── */}
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <SectionLabel
              title={
                isFiltering
                  ? `${results.length} result${results.length !== 1 ? "s" : ""}`
                  : "Nearby"
              }
            />

            {loading || searching ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color="#FF5A5F" size="small" />
                <Text style={styles.loaderText}>
                  {loading ? "Loading…" : "Searching…"}
                </Text>
              </View>
            ) : results.length === 0 ? (
              <NoResults query={query} />
            ) : (
              <View style={styles.resultsList}>
                {results.map((r, i) => (
                  <SearchResultRow
                    key={r.id}
                    restaurant={r}
                    index={i}
                    isLast={i === results.length - 1}
                    onPress={() =>
                      router.push(`/(consumer)/restaurant/${r.id}`)
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={styles.sectionLabelText}>{title}</Text>
      {right}
    </View>
  );
}

// ─── Cuisine Chip ─────────────────────────────────────────────────────────────
function CuisineChip({
  cuisine,
  selected,
  onPress,
}: {
  cuisine: { name: string; emoji: string };
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.91,
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
        {selected ? (
          <LinearGradient
            colors={["#FF5A5F", "#FF8C42"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chipActive}
          >
            <Text style={styles.chipEmoji}>{cuisine.emoji}</Text>
            <Text style={styles.chipTextActive}>{cuisine.name}</Text>
          </LinearGradient>
        ) : (
          <View style={styles.chip}>
            <Text style={styles.chipEmoji}>{cuisine.emoji}</Text>
            <Text style={styles.chipText}>{cuisine.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Popular Chip ─────────────────────────────────────────────────────────────
function PopularChip({
  item,
  onPress,
}: {
  item: (typeof POPULAR_SEARCHES)[0];
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={[styles.popularChipWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.popularChip}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.95,
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
        <View
          style={[styles.popularIconBg, { backgroundColor: item.color + "14" }]}
        >
          <MaterialIcons name={item.icon as any} size={16} color={item.color} />
        </View>
        <Text style={styles.popularLabel}>{item.label}</Text>
        <MaterialIcons name="north-east" size={12} color="#D1D5DB" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Search Result Row ────────────────────────────────────────────────────────
function SearchResultRow({
  restaurant,
  index,
  isLast,
  onPress,
}: {
  restaurant: Restaurant;
  index: number;
  isLast: boolean;
  onPress: () => void;
}) {
  const price = restaurant?.bookingFeePerPerson ?? 0;
  const isFree = price === 0;
  const hasRating = (restaurant?.averageRating ?? 0) > 0;
  const location = [restaurant?.address?.city, restaurant?.address?.state]
    .filter(Boolean)
    .join(", ");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const delay = Math.min(index * 45, 280);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: pressScale }],
      }}
    >
      <TouchableOpacity
        style={styles.resultRow}
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(pressScale, {
            toValue: 0.98,
            useNativeDriver: true,
            speed: 60,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
          }).start()
        }
        activeOpacity={1}
      >
        {/* Thumbnail */}
        <View style={styles.thumbWrap}>
          <Image
            source={{
              uri:
                restaurant?.images?.coverImage ||
                "https://via.placeholder.com/80x80",
            }}
            style={styles.thumbImg}
            resizeMode="cover"
          />
          {isFree && (
            <View style={styles.thumbFreeBadge}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.thumbFreeBadgeInner}
              >
                <Text style={styles.thumbFreeText}>FREE</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.resultInfo}>
          <Text style={styles.resultName} numberOfLines={1}>
            {restaurant.name}
          </Text>

          {!!location && (
            <View style={styles.resultLocRow}>
              <MaterialIcons name="place" size={11} color="#C4C9D4" />
              <Text style={styles.resultLocText} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}

          <View style={styles.resultTagRow}>
            {restaurant.cuisine.slice(0, 2).map((c, i) => (
              <View key={i} style={styles.resultTag}>
                <Text style={styles.resultTagText}>{c}</Text>
              </View>
            ))}
            {hasRating && (
              <View style={styles.ratingPill}>
                <MaterialIcons name="star" size={9} color="#F59E0B" />
                <Text style={styles.ratingPillText}>
                  {restaurant.averageRating!.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right */}
        <View style={styles.resultRight}>
          {!isFree ? (
            <View style={styles.priceWrap}>
              <Text style={styles.priceValue}>₹{price}</Text>
              <Text style={styles.priceUnit}>/ person</Text>
            </View>
          ) : null}
          <View style={styles.arrowCircle}>
            <MaterialIcons name="chevron-right" size={16} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
}

// ─── No Results ───────────────────────────────────────────────────────────────
function NoResults({ query }: { query: string }) {
  return (
    <View style={styles.noResultsWrap}>
      <View style={styles.noResultsIcon}>
        <Text style={{ fontSize: 32 }}>🔍</Text>
      </View>
      <Text style={styles.noResultsTitle}>
        No results{query ? ` for "${query}"` : ""}
      </Text>
      <Text style={styles.noResultsSub}>
        Try a different name, cuisine or city
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F5",
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECEEF2",
    justifyContent: "center",
    alignItems: "center",
  },
  inputShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 13,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F1B2D",
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ECEEF2",
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Section ──────────────────────────────────────────────────────────────────
  section: {
    paddingTop: 22,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F1F5",
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF5A5F",
  },

  // ── Cuisine Chips ─────────────────────────────────────────────────────────────
  cuisineScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  chipActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chipEmoji: { fontSize: 15 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  chipTextActive: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  // ── Popular ───────────────────────────────────────────────────────────────────
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 9,
    paddingBottom: 6,
  },
  popularChipWrap: {
    width: (SW - 32 - 9) / 2,
  },
  popularChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  popularIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  popularLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "700",
    color: "#1F2937",
  },

  // ── Results List ──────────────────────────────────────────────────────────────
  loaderWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 28,
  },
  loaderText: { fontSize: 13, color: "#9CA3AF", fontWeight: "600" },

  resultsList: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECEEF2",
    overflow: "hidden",
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F5F6F8",
    marginLeft: 100,
  },

  thumbWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F0F0F5",
    flexShrink: 0,
    position: "relative",
  },
  thumbImg: { width: "100%", height: "100%" },
  thumbFreeBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    borderRadius: 5,
    overflow: "hidden",
  },
  thumbFreeBadgeInner: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  thumbFreeText: { fontSize: 7.5, fontWeight: "800", color: "#FFF" },

  resultInfo: { flex: 1, gap: 3 },
  resultName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#0F1B2D",
    letterSpacing: -0.15,
  },
  resultLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  resultLocText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  resultTagRow: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    marginTop: 2,
  },
  resultTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "#F5F6F8",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  resultTagText: { fontSize: 9.5, fontWeight: "600", color: "#6B7280" },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  ratingPillText: { fontSize: 9.5, fontWeight: "700", color: "#92400E" },

  resultRight: {
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0,
  },
  priceWrap: { alignItems: "flex-end" },
  priceValue: { fontSize: 13.5, fontWeight: "800", color: "#0F1B2D" },
  priceUnit: { fontSize: 9.5, color: "#9CA3AF", fontWeight: "500" },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },

  // ── No Results ────────────────────────────────────────────────────────────────
  noResultsWrap: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  noResultsIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#ECEEF2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F1B2D",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.2,
  },
  noResultsSub: {
    fontSize: 12.5,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 19,
  },
});
