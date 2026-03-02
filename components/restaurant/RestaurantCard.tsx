// components/restaurant/RestaurantCard.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { Restaurant } from "../../types";
import { favouritesService } from "../../services/favouritesService";

const { width: SW } = Dimensions.get("window");

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  index?: number;
  loading?: boolean;
}

const AMENITY_ICONS: Record<string, string> = {
  WiFi: "wifi",
  Parking: "local-parking",
  AC: "ac-unit",
  Bar: "local-bar",
  "Live Music": "music-note",
  Rooftop: "roofing",
  Valet: "directions-car",
  "Pet Friendly": "pets",
  Wheelchair: "accessible",
  Takeaway: "takeout-dining",
  Delivery: "delivery-dining",
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function RestaurantCardSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });
  const Bone = ({ style }: { style: any }) => (
    <Animated.View style={[sk.bone, style, { opacity }]} />
  );

  return (
    <View style={styles.card}>
      <Bone style={sk.image} />
      <View style={styles.content}>
        <View style={sk.row}>
          <Bone style={sk.chipSm} />
          <Bone style={sk.chipMd} />
          <Bone style={sk.chipSm} />
        </View>
        <View style={[sk.row, { marginBottom: 14 }]}>
          <Bone style={sk.priceLine} />
          <Bone style={sk.chipSm} />
        </View>
        <View style={sk.divider} />
        <View style={[sk.row, { marginTop: 12 }]}>
          <Bone style={sk.chipSm} />
          <Bone style={sk.chipMd} />
          <Bone style={sk.chipSm} />
        </View>
      </View>
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export default function RestaurantCard({
  restaurant,
  onPress,
  index = 0,
}: RestaurantCardProps) {
  const price = restaurant?.bookingFeePerPerson ?? 0;
  const isFree = price === 0;
  const hasRating = (restaurant?.averageRating ?? 0) > 0;

  const [isSaved, setIsSaved] = useState(false);
  const [toggling, setToggling] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const heartOpacity = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 340,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 340,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      favouritesService
        .isSaved(restaurant.id)
        .then(setIsSaved)
        .catch(() => {});
    }, [restaurant.id]),
  );

  const handleHeartPress = async () => {
    if (toggling) return;
    setToggling(true);
    setIsSaved((prev) => !prev);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1.55,
          useNativeDriver: true,
          speed: 60,
          bounciness: 16,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0.5,
          duration: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 55,
        }),
        Animated.timing(heartOpacity, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      const nowSaved = await favouritesService.toggle(restaurant);
      setIsSaved(nowSaved);
    } catch {
      setIsSaved((prev) => !prev);
      Alert.alert("Error", "Could not update favourites. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  const cuisines = restaurant?.cuisine?.slice(0, 3) ?? [];
  const amenities = restaurant?.amenities?.slice(0, 4) ?? [];
  const location = [restaurant?.address?.city, restaurant?.address?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.96}
      >
        {/* ── Hero Image ─────────────────────────────────────────────────────── */}
        <View style={styles.imageWrap}>
          <Image
            source={{
              uri:
                restaurant?.images?.coverImage ||
                "https://via.placeholder.com/400x200?text=No+Image",
            }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Bottom gradient scrim */}
          <LinearGradient
            colors={["transparent", "rgba(10,15,30,0.90)"]}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill as any}
          />

          {/* FREE badge */}
          {isFree && (
            <View style={styles.freeBadge}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.freeBadgeInner}
              >
                <MaterialIcons name="local-offer" size={10} color="#fff" />
                <Text style={styles.freeBadgeText}>FREE</Text>
              </LinearGradient>
            </View>
          )}

          {/* Rating badge */}
          {hasRating && (
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={12} color="#FF9F43" />
              <Text style={styles.ratingText}>
                {restaurant.averageRating!.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Heart */}
          <TouchableOpacity
            style={[styles.heartBtn, isSaved && styles.heartBtnSaved]}
            onPress={handleHeartPress}
            activeOpacity={0.85}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View
              style={{
                transform: [{ scale: heartScale }],
                opacity: heartOpacity,
              }}
            >
              <MaterialIcons
                name={isSaved ? "favorite" : "favorite-border"}
                size={18}
                color={isSaved ? "#FF3B5C" : "#FFFFFF"}
              />
            </Animated.View>
          </TouchableOpacity>

          {/* Name + location overlay */}
          <View style={styles.imageOverlay}>
            <Text style={styles.nameOnImage} numberOfLines={1}>
              {restaurant?.name}
            </Text>
            {!!location && (
              <View style={styles.locationRow}>
                <MaterialIcons
                  name="place"
                  size={11}
                  color="rgba(255,255,255,0.75)"
                />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Content ────────────────────────────────────────────────────────── */}
        <View style={styles.content}>
          {/* Cuisine tags */}
          {cuisines.length > 0 && (
            <View style={styles.cuisineRow}>
              {cuisines.map((c, i) => (
                <View key={i} style={styles.cuisineTag}>
                  <Text style={styles.cuisineText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Price row */}
          <View style={styles.metaRow}>
            <View style={styles.priceSection}>
              <View style={styles.priceIconWrap}>
                <MaterialIcons name="event-seat" size={13} color="#FF5A5F" />
              </View>
              {isFree ? (
                <Text style={styles.freeText}>Free to Book</Text>
              ) : (
                <View style={styles.priceWrap}>
                  <Text style={styles.priceCurrency}>₹</Text>
                  <Text style={styles.priceValue}>{price}</Text>
                  <Text style={styles.priceUnit}> / person</Text>
                </View>
              )}
            </View>

            {/* Open now indicator */}
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Amenities */}
          {amenities.length > 0 && (
            <View style={styles.amenitiesRow}>
              {amenities.map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <MaterialIcons
                    name={(AMENITY_ICONS[a] ?? "check-circle") as any}
                    size={11}
                    color="#9CA3AF"
                  />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },

  // ── Image ─────────────────────────────────────────────────────────────────
  imageWrap: { width: "100%", height: 205, position: "relative" },
  image: { width: "100%", height: "100%" },

  freeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  freeBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },

  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(10,15,30,0.65)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ratingText: { fontSize: 11.5, fontWeight: "700", color: "#fff" },

  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(10,15,30,0.42)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  heartBtnSaved: {
    backgroundColor: "rgba(255,59,92,0.20)",
    borderColor: "rgba(255,59,92,0.50)",
  },

  imageOverlay: { position: "absolute", bottom: 13, left: 14, right: 52 },
  nameOnImage: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
    marginBottom: 3,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: { paddingHorizontal: 14, paddingTop: 13, paddingBottom: 14 },

  cuisineRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  cuisineTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,90,95,0.07)",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,90,95,0.14)",
  },
  cuisineText: { fontSize: 11, fontWeight: "600", color: "#FF5A5F" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  priceSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,90,95,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  priceWrap: { flexDirection: "row", alignItems: "baseline" },
  priceCurrency: { fontSize: 13, fontWeight: "700", color: "#0F1B2D" },
  priceValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F1B2D",
    marginHorizontal: 1,
  },
  priceUnit: { fontSize: 11.5, color: "#9CA3AF", fontWeight: "500" },
  freeText: { fontSize: 14, fontWeight: "800", color: "#10B981" },

  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.20)",
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  openText: { fontSize: 11, fontWeight: "700", color: "#10B981" },

  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },

  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  amenityText: { fontSize: 10.5, fontWeight: "600", color: "#6B7280" },
});

// ─── Skeleton styles ──────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  bone: { backgroundColor: "#ECEEF2", borderRadius: 8 },
  image: { width: "100%", height: 205, borderRadius: 0 },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  chipSm: { height: 22, width: 60, borderRadius: 6 },
  chipMd: { height: 22, width: 90, borderRadius: 6 },
  priceLine: { height: 26, width: 130, borderRadius: 7 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 4 },
});
