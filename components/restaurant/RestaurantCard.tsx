import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Restaurant } from "../../types";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
  loading?: boolean; // skeleton mode
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

// ─── Shimmer skeleton ────────────────────────────────────────────────────────
export function RestaurantCardSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 1],
  });

  const Bone = ({ style }: { style: any }) => (
    <Animated.View style={[styles.bone, style, { opacity }]} />
  );

  return (
    <View style={styles.card}>
      {/* Image placeholder */}
      <Bone style={styles.skelImage} />

      <View style={styles.content}>
        {/* Cuisine row */}
        <View style={styles.skelRow}>
          <Bone style={styles.skelChipSm} />
          <Bone style={styles.skelChipMd} />
          <Bone style={styles.skelChipSm} />
        </View>

        {/* Price row */}
        <View style={[styles.skelRow, { marginBottom: 14 }]}>
          <Bone style={styles.skelPriceLine} />
          <Bone style={styles.skelChipSm} />
        </View>

        <View style={styles.skelDivider} />

        {/* Amenities */}
        <View style={[styles.skelRow, { marginTop: 12, marginBottom: 12 }]}>
          <Bone style={styles.skelChipSm} />
          <Bone style={styles.skelChipMd} />
          <Bone style={styles.skelChipSm} />
        </View>

        {/* CTA */}
        <Bone style={styles.skelCta} />
      </View>
    </View>
  );
}

// ─── Real card ───────────────────────────────────────────────────────────────
export default function RestaurantCard({
  restaurant,
  onPress,
}: RestaurantCardProps) {
  const price = restaurant?.bookingFeePerPerson ?? 0;
  const isFree = price === 0;
  const hasRating = (restaurant?.averageRating ?? 0) > 0;

  // Fade-in on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.95}
      >
        {/* HERO IMAGE */}
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
          <LinearGradient
            colors={["transparent", "rgba(15,27,45,0.85)"]}
            style={styles.imageGradient}
          />

          {isFree && (
            <View style={styles.freeBadge}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={styles.freeBadgeInner}
              >
                <MaterialIcons name="local-offer" size={11} color="#FFF" />
                <Text style={styles.freeBadgeText}>FREE</Text>
              </LinearGradient>
            </View>
          )}

          {hasRating && (
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={13} color="#FF9F43" />
              <Text style={styles.ratingText}>
                {restaurant.averageRating!.toFixed(1)}
              </Text>
            </View>
          )}

          <View style={styles.imageOverlay}>
            <Text style={styles.nameOnImage} numberOfLines={1}>
              {restaurant?.name}
            </Text>
            <View style={styles.locationRow}>
              <MaterialIcons
                name="place"
                size={12}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {[restaurant?.address?.city, restaurant?.address?.state]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {/* Cuisines */}
          <View style={styles.cuisineRow}>
            {restaurant?.cuisine?.slice(0, 3).map((c, i) => (
              <View key={i} style={styles.cuisineTag}>
                <Text style={styles.cuisineText}>{c}</Text>
              </View>
            ))}
          </View>

          {/* Price + bookings */}
          <View style={styles.infoRow}>
            <View style={styles.priceSection}>
              <MaterialIcons name="event-seat" size={16} color="#FF5A5F" />
              {isFree ? (
                <Text style={styles.freeText}>Free Booking</Text>
              ) : (
                <View style={styles.priceWrap}>
                  <Text style={styles.currency}>₹</Text>
                  <Text style={styles.price}>{price}</Text>
                  <Text style={styles.priceLabel}>/ person</Text>
                </View>
              )}
            </View>

            {(restaurant?.totalBookings ?? 0) > 0 && (
              <View style={styles.bookingsChip}>
                <MaterialIcons name="people" size={13} color="#8A95A3" />
                <Text style={styles.bookingsText}>
                  {restaurant.totalBookings}+ booked
                </Text>
              </View>
            )}
          </View>

          {/* Amenities */}
          {(restaurant?.amenities?.length ?? 0) > 0 && (
            <View style={styles.amenitiesRow}>
              {restaurant.amenities.slice(0, 4).map((a, i) => (
                <View key={i} style={styles.amenityChip}>
                  <MaterialIcons
                    name={(AMENITY_ICONS[a] ?? "check-circle") as any}
                    size={12}
                    color="#6B7280"
                  />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          )}

          {/* CTA */}
          <View style={styles.ctaBar}>
            <View style={styles.ctaLeft}>
              <MaterialIcons
                name="table-restaurant"
                size={14}
                color="#FF5A5F"
              />
              <Text style={styles.ctaText}>Book a Table</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={16} color="#FF5A5F" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 5,
  },

  // Image
  imageWrap: { width: "100%", height: 200, position: "relative" },
  image: { width: "100%", height: "100%" },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
  },

  freeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 7,
    overflow: "hidden",
  },
  freeBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  freeBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFF" },

  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,27,45,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 12, fontWeight: "700", color: "#FFF" },

  imageOverlay: { position: "absolute", bottom: 12, left: 14, right: 14 },
  nameOnImage: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12, color: "rgba(255,255,255,0.85)" },

  // Content
  content: { padding: 14 },

  cuisineRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  cuisineTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,90,95,0.07)",
    borderRadius: 6,
  },
  cuisineText: { fontSize: 11, fontWeight: "600", color: "#FF5A5F" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  priceSection: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceWrap: { flexDirection: "row", alignItems: "center" },
  currency: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 2,
    color: "#0F1B2D",
  },
  price: { fontSize: 18, fontWeight: "800", marginRight: 4, color: "#0F1B2D" },
  priceLabel: { fontSize: 12, color: "#6B7280" },
  freeText: { fontSize: 14, fontWeight: "800", color: "#10B981" },

  bookingsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F5F6F8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookingsText: { fontSize: 11, fontWeight: "600", color: "#8A95A3" },

  amenitiesRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  amenityText: { fontSize: 11, fontWeight: "600", color: "#6B7280" },

  ctaBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,90,95,0.06)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  ctaLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  ctaText: { fontSize: 13, fontWeight: "700", color: "#FF5A5F" },

  // ── Skeleton ──
  bone: { backgroundColor: "#EEF0F4", borderRadius: 8 },
  skelImage: { width: "100%", height: 200, borderRadius: 0 },
  skelRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  skelChipSm: { height: 22, width: 60, borderRadius: 6 },
  skelChipMd: { height: 22, width: 90, borderRadius: 6 },
  skelPriceLine: { height: 24, width: 120, borderRadius: 6 },
  skelDivider: { height: 1, backgroundColor: "#F3F4F6" },
  skelCta: { height: 38, borderRadius: 10 },
});
