// app/(consumer)/restaurant/[id].tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
  Share,
  Alert,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Restaurant } from "../../../types";

const { width, height } = Dimensions.get("window");
const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const snap = await getDoc(doc(db, "restaurants", id as string));
      if (snap.exists()) {
        const data = snap.data();
        setRestaurant({
          ...data,
          id: snap.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
        } as Restaurant);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isOpenNow = () => {
    if (!restaurant) return false;
    const now = new Date();
    const dayName = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase() as keyof typeof restaurant.operatingHours;
    const h = restaurant.operatingHours[dayName];
    if (h.closed) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    return cur >= oh * 60 + om && cur <= ch * 60 + cm;
  };

  const getTodayName = () =>
    new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  const handleGetDirections = () => {
    if (!restaurant?.address) return;
    const query = [
      restaurant.address.street,
      restaurant.address.city,
      restaurant.address.state,
      restaurant.address.pincode,
    ]
      .filter(Boolean)
      .join(", ");
    const encoded = encodeURIComponent(query);
    const url = Platform.select({
      ios: `maps://0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
    });
    const fallback = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    Linking.canOpenURL(url!)
      .then((ok) => Linking.openURL(ok ? url! : fallback))
      .catch(() => Linking.openURL(fallback));
  };

  const handleCall = () => {
    if (restaurant?.phone) Linking.openURL(`tel:${restaurant.phone}`);
  };

  const handleShare = async () => {
    if (!restaurant || sharing) return;
    setSharing(true);
    try {
      const address = [restaurant.address?.street, restaurant.address?.city]
        .filter(Boolean)
        .join(", ");
      const cuisines = restaurant.cuisine?.join(", ") ?? "";
      const price =
        restaurant.bookingFeePerPerson === 0
          ? "Free booking"
          : `₹${restaurant.bookingFeePerPerson}/person`;
      const message = [
        `🍽️ ${restaurant.name}`,
        cuisines ? `Cuisine: ${cuisines}` : null,
        address ? `📍 ${address}` : null,
        `💳 ${price}`,
        restaurant.phone ? `📞 ${restaurant.phone}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const result = await Share.share(
        Platform.select({
          ios: {
            message,
            title: restaurant.name,
          },
          android: {
            message: `${restaurant.name}\n${message}`,
            title: restaurant.name,
          },
        })!,
        {
          dialogTitle: `Share ${restaurant.name}`,
          subject: `Check out ${restaurant.name}`,
        },
      );

      // result.action is 'sharedAction' | 'dismissedAction'
      // No-op — just let the native sheet handle it
    } catch (e: any) {
      // User cancelled — not an error worth alerting
      if (e?.message && !e.message.includes("cancel")) {
        Alert.alert("Couldn't share", "Please try again.");
      }
    } finally {
      setSharing(false);
    }
  };

  const handleBookNow = () => {
    if (restaurant) router.push(`/(consumer)/booking/${restaurant.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingOrb} />
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading restaurant...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <View style={styles.errorIconWrap}>
          <MaterialIcons name="error-outline" size={36} color="#FF5A5F" />
        </View>
        <Text style={styles.errorTitle}>Restaurant Not Found</Text>
        <Text style={styles.errorSubtitle}>
          This restaurant may no longer be available.
        </Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allImages = [
    restaurant.images.coverImage,
    ...restaurant.images.gallery,
  ].filter(Boolean);
  const open = isOpenNow();
  const todayName = getTodayName();
  const todayHours =
    restaurant.operatingHours[
      todayName as keyof typeof restaurant.operatingHours
    ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Gallery ── */}
      <View style={[styles.imageContainer, { height: height * 0.44 }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setActiveImageIndex(
              Math.round(e.nativeEvent.contentOffset.x / width),
            )
          }
        >
          {allImages.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={[styles.image, { height: height * 0.44 }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "transparent"]}
          style={styles.topGradient}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          style={styles.bottomGradient}
        />

        {/* Top actions — back + share only */}
        <View style={[styles.imageTopActions, { top: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.imageActionBtn}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Share button with loading state */}
          <TouchableOpacity
            style={styles.imageActionBtn}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.8}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <MaterialIcons name="share" size={22} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        {allImages.length > 1 && (
          <View style={[styles.imageCounter, { top: insets.top + 16 }]}>
            <MaterialIcons name="photo-library" size={12} color="#FFF" />
            <Text style={styles.imageCounterText}>
              {activeImageIndex + 1}/{allImages.length}
            </Text>
          </View>
        )}

        {allImages.length > 1 && (
          <View style={styles.imageIndicator}>
            {allImages.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.indicatorDot,
                  i === activeImageIndex && styles.indicatorDotActive,
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.heroInfo}>
          <View style={styles.heroInfoTop}>
            <Text style={styles.heroName} numberOfLines={2}>
              {restaurant.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                open ? styles.openBadge : styles.closedBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  open ? styles.openDot : styles.closedDot,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  open ? styles.openText : styles.closedText,
                ]}
              >
                {open ? "Open Now" : "Closed"}
              </Text>
            </View>
          </View>
          {restaurant.cuisine.length > 0 && (
            <Text style={styles.heroSubline} numberOfLines={1}>
              {restaurant.cuisine.join(" · ")}
              {restaurant.address?.city ? ` · ${restaurant.address.city}` : ""}
            </Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Quick Actions — Directions, Call, Share (no Save) ── */}
        <View style={styles.quickActions}>
          {[
            {
              icon: "near-me",
              label: "Directions",
              action: handleGetDirections,
            },
            { icon: "call", label: "Call", action: handleCall },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickActionBtn}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#FF5A5F15", "#FF9F4315"]}
                style={styles.quickActionIcon}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={20}
                  color="#FF5A5F"
                />
              </LinearGradient>
              <Text style={styles.quickActionText}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Share — with spinner while sharing */}
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={handleShare}
            activeOpacity={0.7}
            disabled={sharing}
          >
            <LinearGradient
              colors={["#FF5A5F15", "#FF9F4315"]}
              style={styles.quickActionIcon}
            >
              {sharing ? (
                <ActivityIndicator size="small" color="#FF5A5F" />
              ) : (
                <MaterialIcons name="share" size={20} color="#FF5A5F" />
              )}
            </LinearGradient>
            <Text style={styles.quickActionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* ── About ── */}
        {restaurant.description ? (
          <View style={styles.section}>
            <SectionTitle title="About" />
            <Text style={styles.description}>{restaurant.description}</Text>
          </View>
        ) : null}

        {/* ── Location ── */}
        <View style={styles.section}>
          <SectionTitle title="Location" />
          <View style={styles.locationCard}>
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              style={styles.locationIconWrap}
            >
              <MaterialIcons name="place" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.locationInfo}>
              {restaurant.address?.street ? (
                <Text style={styles.locationAddress}>
                  {restaurant.address.street}
                </Text>
              ) : null}
              <Text style={styles.locationCity}>
                {[restaurant.address?.city, restaurant.address?.state]
                  .filter(Boolean)
                  .join(", ")}
                {restaurant.address?.pincode
                  ? ` – ${restaurant.address.pincode}`
                  : ""}
              </Text>
              {restaurant.address?.landmark ? (
                <Text style={styles.locationLandmark}>
                  Near {restaurant.address.landmark}
                </Text>
              ) : null}
            </View>
          </View>
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={handleGetDirections}
            activeOpacity={0.8}
          >
            <MaterialIcons name="directions" size={18} color="#FF5A5F" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
            <MaterialIcons name="open-in-new" size={14} color="#FF5A5F" />
          </TouchableOpacity>
        </View>

        {/* ── Contact ── */}
        {restaurant.phone || restaurant.email ? (
          <View style={styles.section}>
            <SectionTitle title="Contact" />
            <View style={styles.contactCard}>
              {restaurant.phone ? (
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={handleCall}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.contactIconWrap,
                      { backgroundColor: "#FFF0F0" },
                    ]}
                  >
                    <MaterialIcons name="phone" size={17} color="#FF5A5F" />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{restaurant.phone}</Text>
                  </View>
                  <LinearGradient
                    colors={["#FF5A5F", "#FF9F43"]}
                    style={styles.contactActionBtn}
                  >
                    <Text style={styles.contactActionText}>Call</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
              {restaurant.email ? (
                <TouchableOpacity
                  style={[
                    styles.contactRow,
                    restaurant.phone ? styles.contactRowBorder : null,
                  ]}
                  onPress={() => Linking.openURL(`mailto:${restaurant.email}`)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.contactIconWrap,
                      { backgroundColor: "#F0F4FF" },
                    ]}
                  >
                    <MaterialIcons name="email" size={17} color="#6B2FA0" />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{restaurant.email}</Text>
                  </View>
                  <LinearGradient
                    colors={["#6B2FA0", "#A855F7"]}
                    style={styles.contactActionBtn}
                  >
                    <Text style={styles.contactActionText}>Mail</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Operating Hours ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionTitleRow}
            onPress={() => setHoursExpanded(!hoursExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleLeft}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitleText}>Hours</Text>
            </View>
            <View style={styles.hoursToggle}>
              <Text style={styles.hoursToggleText}>
                {hoursExpanded ? "Show less" : "See all"}
              </Text>
              <MaterialIcons
                name={hoursExpanded ? "expand-less" : "expand-more"}
                size={20}
                color="#FF5A5F"
              />
            </View>
          </TouchableOpacity>

          <View style={styles.todayCard}>
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.todayPill}
            >
              <Text style={styles.todayPillText}>Today</Text>
            </LinearGradient>
            <Text style={styles.todayDayText}>
              {todayName.charAt(0).toUpperCase() + todayName.slice(1)}
            </Text>
            <View style={{ flex: 1 }} />
            {todayHours?.closed ? (
              <View style={styles.closedChip}>
                <Text style={styles.closedChipText}>Closed</Text>
              </View>
            ) : (
              <View style={styles.openTimeWrap}>
                <View
                  style={[styles.statusDot, styles.openDot, { marginRight: 6 }]}
                />
                <Text style={styles.openTimeText}>
                  {todayHours?.open} – {todayHours?.close}
                </Text>
              </View>
            )}
          </View>

          {hoursExpanded && (
            <View style={styles.hoursCard}>
              {DAY_ORDER.map((day, idx) => {
                const hours =
                  restaurant.operatingHours[
                    day as keyof typeof restaurant.operatingHours
                  ];
                const isToday = todayName === day;
                if (!hours) return null;
                return (
                  <View
                    key={day}
                    style={[
                      styles.hoursRow,
                      idx < DAY_ORDER.length - 1 && styles.hoursRowBorder,
                      isToday && styles.hoursRowToday,
                    ]}
                  >
                    <Text
                      style={[styles.dayText, isToday && styles.dayTextToday]}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </Text>
                    {hours.closed ? (
                      <Text style={styles.closedHoursText}>Closed</Text>
                    ) : (
                      <Text
                        style={[
                          styles.hoursTimeText,
                          isToday && styles.hoursTimeTextToday,
                        ]}
                      >
                        {hours.open} – {hours.close}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Amenities ── */}
        {(restaurant.amenities?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionTitle title="Amenities" />
            <View style={styles.amenitiesGrid}>
              {restaurant.amenities.map((amenity, i) => (
                <View key={i} style={styles.amenityItem}>
                  <View style={styles.amenityIconWrap}>
                    <MaterialIcons name="check" size={13} color="#FF5A5F" />
                  </View>
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Features ── */}
        {(restaurant.features?.length ?? 0) > 0 ? (
          <View style={styles.section}>
            <SectionTitle title="Features" />
            <View style={styles.tagsWrap}>
              {restaurant.features.map((f, i) => (
                <View key={i} style={styles.featureTag}>
                  <Text style={styles.featureTagText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Booking Info ── */}
        <View style={styles.section}>
          <SectionTitle title="Booking Information" />
          <View style={styles.bookingInfoCard}>
            <BookingInfoRow
              icon="confirmation-number"
              iconBg="#FFF0F0"
              iconColor="#FF5A5F"
              label="Booking Fee"
              sub="Per person charge"
              right={
                restaurant.bookingFeePerPerson === 0 ? (
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>FREE</Text>
                  </View>
                ) : (
                  <Text style={styles.bookingInfoValue}>
                    ₹{restaurant.bookingFeePerPerson}
                    <Text style={styles.bookingInfoPer}>/person</Text>
                  </Text>
                )
              }
            />
            <BookingInfoRow
              icon="cancel"
              iconBg="#FEF2F2"
              iconColor="#EF4444"
              label="Cancellation Policy"
              sub="No refunds on cancellation"
              border
              right={
                <View style={styles.nonRefundBadge}>
                  <Text style={styles.nonRefundBadgeText}>Non-refundable</Text>
                </View>
              }
            />
            <BookingInfoRow
              icon="event-seat"
              iconBg="#F0F9FF"
              iconColor="#6B2FA0"
              label="Total Capacity"
              sub="Maximum guests"
              border
              right={
                <Text style={styles.bookingInfoValue}>
                  {restaurant.totalCapacity}
                  <Text style={styles.bookingInfoPer}> seats</Text>
                </Text>
              }
            />
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.priceInfo}>
          {restaurant.bookingFeePerPerson === 0 ? (
            <>
              <Text style={styles.priceLabel}>Booking</Text>
              <Text style={styles.freePriceText}>Free</Text>
            </>
          ) : (
            <>
              <Text style={styles.priceLabel}>From</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>
                  ₹{restaurant.bookingFeePerPerson}
                </Text>
                <Text style={styles.pricePer}>/person</Text>
              </View>
            </>
          )}
        </View>
        <TouchableOpacity
          onPress={handleBookNow}
          activeOpacity={0.9}
          style={styles.bookBtnWrap}
        >
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookBtnGradient}
          >
            <Text style={styles.bookBtnText}>Book a Table</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionTitle = ({ title }: { title: string }) => (
  <View style={styles.sectionTitleLeft}>
    <View style={styles.sectionDot} />
    <Text style={styles.sectionTitleText}>{title}</Text>
  </View>
);

const BookingInfoRow = ({
  icon,
  iconBg,
  iconColor,
  label,
  sub,
  right,
  border,
}: {
  icon: any;
  iconBg: string;
  iconColor: string;
  label: string;
  sub: string;
  right: React.ReactNode;
  border?: boolean;
}) => (
  <View style={[styles.bookingInfoRow, border && styles.bookingInfoRowBorder]}>
    <View style={styles.bookingInfoLeft}>
      <View style={[styles.bookingInfoIconWrap, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={16} color={iconColor} />
      </View>
      <View>
        <Text style={styles.bookingInfoLabel}>{label}</Text>
        <Text style={styles.bookingInfoSub}>{sub}</Text>
      </View>
    </View>
    {right}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  loadingContainer: { flex: 1 },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,90,95,0.15)",
    top: "30%",
    right: -40,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: "#F5F6F8",
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: { fontSize: 20, fontWeight: "700", color: "#0F1B2D" },
  errorSubtitle: { fontSize: 14, color: "#8A95A3", textAlign: "center" },
  errorBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "#FF5A5F",
    borderRadius: 14,
    marginTop: 8,
  },
  errorBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },

  imageContainer: { width, position: "relative" },
  image: { width },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 120 },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
  },

  imageTopActions: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  imageActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  imageCounter: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  imageCounterText: { fontSize: 11, color: "#FFF", fontWeight: "600" },
  imageIndicator: {
    position: "absolute",
    bottom: 72,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
  },
  indicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  indicatorDotActive: { backgroundColor: "#FFF", width: 18 },

  heroInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 18,
  },
  heroInfoTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFF",
    flex: 1,
    marginRight: 10,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    letterSpacing: -0.5,
  },
  heroSubline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    flexShrink: 0,
  },
  openBadge: {
    backgroundColor: "rgba(16,185,129,0.25)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.6)",
  },
  closedBadge: {
    backgroundColor: "rgba(220,38,38,0.25)",
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.6)",
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  openDot: { backgroundColor: "#10B981" },
  closedDot: { backgroundColor: "#EF4444" },
  statusText: { fontSize: 11, fontWeight: "700" },
  openText: { color: "#6EE7B7" },
  closedText: { color: "#FCA5A5" },

  // Quick actions — now 3 items instead of 4
  quickActions: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 6,
    borderBottomColor: "#F5F6F8",
  },
  quickActionBtn: { flex: 1, alignItems: "center", gap: 6 },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: { fontSize: 11, fontWeight: "600", color: "#0F1B2D" },

  content: { flex: 1 },
  section: {
    backgroundColor: "#FFF",
    padding: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEF0F4",
  },
  sectionTitleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5A5F",
  },
  sectionTitleText: { fontSize: 15, fontWeight: "700", color: "#0F1B2D" },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  hoursToggle: { flexDirection: "row", alignItems: "center", gap: 3 },
  hoursToggleText: { fontSize: 13, color: "#FF5A5F", fontWeight: "600" },

  description: { fontSize: 14, color: "#8A95A3", lineHeight: 22 },

  locationCard: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  locationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  locationInfo: { flex: 1, justifyContent: "center" },
  locationAddress: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1B2D",
    marginBottom: 3,
  },
  locationCity: { fontSize: 13, color: "#8A95A3", marginBottom: 2 },
  locationLandmark: { fontSize: 12, color: "#8A95A3", fontStyle: "italic" },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FF5A5F30",
    backgroundColor: "#FFF0F0",
  },
  directionsBtnText: { fontSize: 14, fontWeight: "700", color: "#FF5A5F" },

  contactCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#FFF",
  },
  contactRowBorder: { borderTopWidth: 1, borderTopColor: "#EEF0F4" },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  contactInfo: { flex: 1 },
  contactLabel: {
    fontSize: 11,
    color: "#8A95A3",
    fontWeight: "500",
    marginBottom: 2,
  },
  contactValue: { fontSize: 14, fontWeight: "600", color: "#0F1B2D" },
  contactActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  contactActionText: { fontSize: 12, fontWeight: "700", color: "#FFF" },

  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8F8",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FF5A5F20",
    gap: 10,
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  todayDayText: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  closedChip: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  closedChipText: { fontSize: 12, fontWeight: "700", color: "#EF4444" },
  openTimeWrap: { flexDirection: "row", alignItems: "center" },
  openTimeText: { fontSize: 14, fontWeight: "600", color: "#10B981" },

  hoursCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    overflow: "hidden",
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hoursRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F5F6F8" },
  hoursRowToday: { backgroundColor: "#FFF8F8" },
  dayText: { fontSize: 14, fontWeight: "500", color: "#0F1B2D" },
  dayTextToday: { fontWeight: "700", color: "#FF5A5F" },
  hoursTimeText: { fontSize: 14, color: "#8A95A3" },
  hoursTimeTextToday: { color: "#FF5A5F", fontWeight: "600" },
  closedHoursText: { fontSize: 14, color: "#EF4444", fontWeight: "600" },

  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "47%",
  },
  amenityIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  amenityText: { fontSize: 13, color: "#0F1B2D", flex: 1 },

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  featureTag: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF5A5F25",
  },
  featureTagText: { fontSize: 12, color: "#FF5A5F", fontWeight: "600" },

  bookingInfoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    overflow: "hidden",
  },
  bookingInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#FFF",
  },
  bookingInfoRowBorder: { borderTopWidth: 1, borderTopColor: "#EEF0F4" },
  bookingInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  bookingInfoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingInfoLabel: { fontSize: 14, fontWeight: "600", color: "#0F1B2D" },
  bookingInfoSub: { fontSize: 11, color: "#8A95A3", marginTop: 1 },
  bookingInfoValue: { fontSize: 15, fontWeight: "800", color: "#0F1B2D" },
  bookingInfoPer: { fontSize: 12, fontWeight: "500", color: "#8A95A3" },
  freeBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  freeBadgeText: { fontSize: 13, fontWeight: "800", color: "#059669" },
  nonRefundBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  nonRefundBadgeText: { fontSize: 11, fontWeight: "700", color: "#EF4444" },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  priceInfo: { flex: 1 },
  priceLabel: {
    fontSize: 11,
    color: "#8A95A3",
    fontWeight: "500",
    marginBottom: 2,
  },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  priceValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F1B2D",
    letterSpacing: -0.5,
  },
  pricePer: { fontSize: 13, fontWeight: "500", color: "#8A95A3" },
  freePriceText: { fontSize: 24, fontWeight: "900", color: "#10B981" },
  bookBtnWrap: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bookBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  bookBtnText: { fontSize: 15, fontWeight: "800", color: "#FFF" },
});
