import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { Restaurant, Booking } from "../../types";

const { width } = Dimensions.get("window");

// ─── Adjust to match your tab bar height ─────────────────────────────────────
const TAB_BAR_HEIGHT = 80;

interface AnalyticsData {
  totalRestaurants: number;
  totalBookings: number;
  totalRevenue: number;
  confirmedBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  averageBookingValue: number;
  totalGuests: number;
  topRestaurant: string;
  recentBookings: Booking[];
}

const EMPTY: AnalyticsData = {
  totalRestaurants: 0,
  totalBookings: 0,
  totalRevenue: 0,
  confirmedBookings: 0,
  cancelledBookings: 0,
  completedBookings: 0,
  averageBookingValue: 0,
  totalGuests: 0,
  topRestaurant: "N/A",
  recentBookings: [],
};

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsData>(EMPTY);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const rSnap = await getDocs(
        query(collection(db, "restaurants"), where("ownerId", "==", user.uid)),
      );
      const restaurants: Restaurant[] = [];
      const ids: string[] = [];
      rSnap.forEach((d) => {
        restaurants.push({ ...d.data(), id: d.id } as Restaurant);
        ids.push(d.id);
      });
      if (!ids.length) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const bSnap = await getDocs(
        query(collection(db, "bookings"), where("restaurantId", "in", ids)),
      );
      const bookings: Booking[] = [];
      bSnap.forEach((d) => {
        const b = d.data();
        bookings.push({
          ...b,
          id: d.id,
          date: b.date?.toDate?.(),
          createdAt: b.createdAt?.toDate?.(),
        } as Booking);
      });

      const totalRevenue = bookings.reduce(
        (s, b) => s + (b.payment?.amount || 0),
        0,
      );
      const totalGuests = bookings.reduce(
        (s, b) => s + (b.numberOfGuests || 0),
        0,
      );

      const rMap = new Map<string, number>();
      bookings.forEach((b) =>
        rMap.set(b.restaurantName, (rMap.get(b.restaurantName) || 0) + 1),
      );
      let topRestaurant = "N/A",
        maxB = 0;
      rMap.forEach((c, n) => {
        if (c > maxB) {
          maxB = c;
          topRestaurant = n;
        }
      });

      setData({
        totalRestaurants: restaurants.length,
        totalBookings: bookings.length,
        totalRevenue,
        confirmedBookings: bookings.filter((b) => b.status === "confirmed")
          .length,
        cancelledBookings: bookings.filter((b) => b.status === "cancelled")
          .length,
        completedBookings: bookings.filter((b) => b.status === "completed")
          .length,
        averageBookingValue:
          bookings.length > 0 ? totalRevenue / bookings.length : 0,
        totalGuests,
        topRestaurant,
        recentBookings: bookings
          .sort(
            (a, b) =>
              (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
          )
          .slice(0, 5),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const pct = (n: number) =>
    data.totalBookings > 0 ? ((n / data.totalBookings) * 100).toFixed(0) : "0";

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#FF5A5F" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerOrb1} />
        <View style={styles.headerOrb2} />
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerEyebrow}>Business Insights</Text>
            <Text style={styles.headerTitle}>Analytics</Text>
          </View>
          <View style={styles.headerSubPill}>
            <MaterialIcons
              name="insights"
              size={13}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.headerSubText}>Live</Text>
          </View>
        </View>

        {/* Hero revenue */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TOTAL REVENUE</Text>
          <Text style={styles.heroValue}>{fmt(data.totalRevenue)}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaChip}>
              <MaterialIcons
                name="event"
                size={12}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.heroMetaText}>
                {data.totalBookings} bookings
              </Text>
            </View>
            <View style={styles.heroMetaDivider} />
            <View style={styles.heroMetaChip}>
              <MaterialIcons
                name="people"
                size={12}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.heroMetaText}>{data.totalGuests} guests</Text>
            </View>
            <View style={styles.heroMetaDivider} />
            <View style={styles.heroMetaChip}>
              <MaterialIcons
                name="store"
                size={12}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.heroMetaText}>
                {data.totalRestaurants} restaurants
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          // ✅ Prevents content from hiding behind tab bar
          { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            colors={["#FF5A5F"]}
            tintColor="#FF5A5F"
          />
        }
      >
        {/* Overview grid */}
        <View style={styles.section}>
          <SectionTitle label="Overview" />
          <View style={styles.overviewGrid}>
            {[
              {
                icon: "store",
                label: "Restaurants",
                value: String(data.totalRestaurants),
                colors: ["#1A0A2E", "#6B2FA0"] as [string, string],
              },
              {
                icon: "event",
                label: "Bookings",
                value: String(data.totalBookings),
                colors: ["#FF5A5F", "#FF9F43"] as [string, string],
              },
              {
                icon: "people",
                label: "Total Guests",
                value: String(data.totalGuests),
                colors: ["#FF9F43", "#FF5A5F"] as [string, string],
              },
              {
                icon: "payments",
                label: "Avg. Booking",
                value: fmt(Math.round(data.averageBookingValue)),
                colors: ["#10B981", "#059669"] as [string, string],
              },
            ].map((item) => (
              <View key={item.label} style={styles.overviewCard}>
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.overviewIconWrap}
                >
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <Text style={styles.overviewValue}>{item.value}</Text>
                <Text style={styles.overviewLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Booking status */}
        <View style={styles.section}>
          <SectionTitle label="Booking Status" />
          <View style={styles.statusRow}>
            {[
              {
                label: "Confirmed",
                value: data.confirmedBookings,
                color: "#10B981",
                icon: "check-circle",
              },
              {
                label: "Completed",
                value: data.completedBookings,
                color: "#6B2FA0",
                icon: "task-alt",
              },
              {
                label: "Cancelled",
                value: data.cancelledBookings,
                color: "#EF4444",
                icon: "cancel",
              },
            ].map((s) => (
              <View key={s.label} style={styles.statusCard}>
                <MaterialIcons name={s.icon as any} size={22} color={s.color} />
                <Text style={[styles.statusValue, { color: s.color }]}>
                  {s.value}
                </Text>
                <Text style={styles.statusLabel}>{s.label}</Text>
                <View style={styles.statusBarBg}>
                  <View
                    style={[
                      styles.statusBarFill,
                      {
                        width: `${pct(s.value)}%` as any,
                        backgroundColor: s.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.statusPct, { color: s.color }]}>
                  {pct(s.value)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key metrics */}
        <View style={styles.section}>
          <SectionTitle label="Key Metrics" />
          <View style={styles.metricsCard}>
            {[
              {
                icon: "trending-up",
                label: "Avg. Booking Value",
                value: fmt(Math.round(data.averageBookingValue)),
              },
              {
                icon: "star",
                label: "Top Restaurant",
                value: data.topRestaurant,
              },
              {
                icon: "group",
                label: "Avg. Party Size",
                value:
                  data.totalBookings > 0
                    ? (data.totalGuests / data.totalBookings).toFixed(1)
                    : "0",
              },
              {
                icon: "store",
                label: "Total Restaurants",
                value: String(data.totalRestaurants),
              },
            ].map((m, i) => (
              <View
                key={m.label}
                style={[styles.metricRow, i < 3 && styles.metricRowBorder]}
              >
                <View style={styles.metricIconWrap}>
                  <MaterialIcons
                    name={m.icon as any}
                    size={15}
                    color="#FF5A5F"
                  />
                </View>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {m.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent bookings */}
        <View style={styles.section}>
          <SectionTitle label="Recent Bookings" />
          {data.recentBookings.length > 0 ? (
            <View style={styles.recentList}>
              {data.recentBookings.map((b, i) => {
                const isFree = b.payment?.amount === 0;
                const statusCfg: Record<string, { color: string; bg: string }> =
                  {
                    confirmed: { color: "#10B981", bg: "#ECFDF5" },
                    completed: { color: "#6B2FA0", bg: "#F5F0FF" },
                    cancelled: { color: "#EF4444", bg: "#FEF2F2" },
                  };
                const cfg = statusCfg[b.status] ?? {
                  color: "#FF9F43",
                  bg: "#FFF8F0",
                };
                return (
                  <View
                    key={b.id}
                    style={[
                      styles.recentCard,
                      i < data.recentBookings.length - 1 &&
                        styles.recentCardBorder,
                    ]}
                  >
                    <View style={styles.recentLeft}>
                      <View style={styles.recentIconWrap}>
                        <MaterialIcons
                          name="restaurant"
                          size={13}
                          color="#FF5A5F"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentName} numberOfLines={1}>
                          {b.restaurantName}
                        </Text>
                        <Text style={styles.recentMeta} numberOfLines={1}>
                          {b.userName} · {b.numberOfGuests} guests ·{" "}
                          {b.date?.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          }) || "N/A"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentAmount}>
                        {isFree ? "FREE" : fmt(b.payment?.amount || 0)}
                      </Text>
                      <View
                        style={[
                          styles.recentStatus,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.recentStatusText,
                            { color: cfg.color },
                          ]}
                        >
                          {b.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="event-busy" size={32} color="#C4CAD4" />
              <Text style={styles.emptyText}>No bookings yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const SectionTitle = ({ label }: { label: string }) => (
  <View style={styles.sectionTitleRow}>
    <View style={styles.sectionDot} />
    <Text style={styles.sectionTitle}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  loadingText: {
    fontSize: 14,
    color: "#8A95A3",
    fontWeight: "500",
    marginTop: 12,
  },

  // Header
  header: {
    overflow: "hidden",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerOrb1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,90,95,0.18)",
    top: -40,
    right: -20,
  },
  headerOrb2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,159,67,0.12)",
    top: 20,
    right: 70,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  headerSubPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },

  // Hero card
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginBottom: 10,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  heroMetaChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  heroMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  heroMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  accentBar: { flexDirection: "row", height: 3 },
  accentSeg: { flex: 1 },

  scroll: { padding: 16, gap: 0 },
  section: { marginBottom: 20 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#FF5A5F",
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#0F1B2D" },

  // Overview grid
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  overviewCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  overviewIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F1B2D",
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  overviewLabel: { fontSize: 11, color: "#8A95A3", fontWeight: "600" },

  // Status
  statusRow: { flexDirection: "row", gap: 10 },
  statusCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  statusValue: { fontSize: 26, fontWeight: "900", marginVertical: 4 },
  statusLabel: {
    fontSize: 10,
    color: "#8A95A3",
    fontWeight: "600",
    marginBottom: 8,
  },
  statusBarBg: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EEF0F4",
    overflow: "hidden",
    marginBottom: 5,
  },
  statusBarFill: { height: "100%", borderRadius: 2 },
  statusPct: { fontSize: 11, fontWeight: "800" },

  // Metrics
  metricsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    overflow: "hidden",
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
  },
  metricRowBorder: { borderBottomWidth: 1, borderBottomColor: "#EEF0F4" },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  metricLabel: { flex: 1, fontSize: 13, color: "#8A95A3", fontWeight: "500" },
  metricValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F1B2D",
    maxWidth: 140,
    textAlign: "right",
  },

  // Recent bookings
  recentList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    overflow: "hidden",
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  recentCardBorder: { borderBottomWidth: 1, borderBottomColor: "#EEF0F4" },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  recentIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  recentName: { fontSize: 13, fontWeight: "700", color: "#0F1B2D" },
  recentMeta: { fontSize: 11, color: "#8A95A3", marginTop: 2 },
  recentRight: { alignItems: "flex-end", gap: 5, flexShrink: 0 },
  recentAmount: { fontSize: 14, fontWeight: "800", color: "#0F1B2D" },
  recentStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  recentStatusText: { fontSize: 9, fontWeight: "700" },

  emptyWrap: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    gap: 10,
  },
  emptyText: { fontSize: 13, color: "#8A95A3", fontWeight: "500" },
});
