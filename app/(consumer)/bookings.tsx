import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { Booking } from "../../types";
import { useLocalSearchParams } from "expo-router";
import { Animated } from "react-native";
import { useRef } from "react";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  confirmed: {
    label: "Confirmed",
    color: "#10B981",
    bg: "#ECFDF5",
    icon: "check-circle",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "#FEF2F2",
    icon: "cancel",
  },
  completed: {
    label: "Completed",
    color: "#6B2FA0",
    bg: "#F5F0FF",
    icon: "task-alt",
  },
  pending: {
    label: "Pending",
    color: "#FF9F43",
    bg: "#FFF8F0",
    icon: "schedule",
  },
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadBookings();
  }, [user]);

  useEffect(() => {
  if (tab === "past") {
    setActiveTab("past");
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }
}, [tab]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
      );
      const snapshot = await getDocs(q);
      const list: Booking[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id,
          date: data.date?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          payment: { ...data.payment, paidAt: data.payment?.paidAt?.toDate() },
        } as Booking);
      });
      setBookings(list);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    const now = new Date();
    return activeTab === "upcoming"
      ? b.date >= now && b.status !== "cancelled"
      : b.date < now || b.status === "cancelled";
  });

  const upcomingCount = bookings.filter(
    (b) => b.date >= new Date() && b.status !== "cancelled",
  ).length;
  const pastCount = bookings.filter(
    (b) => b.date < new Date() || b.status === "cancelled",
  ).length;

  const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const isFree = item.payment?.amount === 0;

    return (
      <View style={[styles.card, index === 0 && { marginTop: 4 }]}>
        {/* Card top accent */}
        <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.restaurantIconWrap}>
              <MaterialIcons name="restaurant" size={16} color="#FF5A5F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {item.restaurantName}
              </Text>
              <Text style={styles.bookingId}>
                #{item.id.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <MaterialIcons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Details grid */}
        <View style={styles.detailsGrid}>
          <DetailCell
            icon="event"
            label="Date"
            value={item.date.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
          <DetailCell icon="schedule" label="Time" value={item.timeSlot} />
          <DetailCell
            icon="people"
            label="Guests"
            value={`${item.numberOfGuests} people`}
          />
          <DetailCell
            icon="table-restaurant"
            label="Tables"
            value={`${item.tableIds?.length ?? 1} table${(item.tableIds?.length ?? 1) > 1 ? "s" : ""}`}
          />
          {item.occasion ? (
            <DetailCell
              icon="celebration"
              label="Occasion"
              value={item.occasion}
            />
          ) : null}
        </View>

        {/* Divider */}
        <View style={styles.cardDivider} />

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Total Paid</Text>
            {isFree ? (
              <Text style={styles.amountFree}>FREE</Text>
            ) : (
              <Text style={styles.amountValue}>₹{item.payment?.amount}</Text>
            )}
            <View style={styles.nonRefundRow}>
              <MaterialIcons name="info-outline" size={10} color="#EF4444" />
              <Text style={styles.nonRefundText}>Non-refundable</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.detailsBtnWrap}>
            <LinearGradient
              colors={
                activeTab === "upcoming"
                  ? ["#FF5A5F", "#FF9F43"]
                  : ["#6B2FA0", "#A855F7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.detailsBtn}
            >
              <Text style={styles.detailsBtnText}>View Details</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E"]}
        style={styles.emptyIconWrap}
      >
        <MaterialIcons
          name="event-busy"
          size={32}
          color="rgba(255,255,255,0.6)"
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No bookings found</Text>
      <Text style={styles.emptySub}>
        {activeTab === "upcoming"
          ? "Book a table to see it here"
          : "Your past bookings will appear here"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      {/* ── Header ── */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerOrb1} />
        <View style={styles.headerOrb2} />

        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.headerCountPill}>
            <Text style={styles.headerCountText}>{bookings.length} total</Text>
          </View>
        </View>

        {/* Tab switcher inside header */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "upcoming" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("upcoming")}
            activeOpacity={0.8}
          >
            {activeTab === "upcoming" ? (
              <LinearGradient
                colors={["#FF5A5F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabActiveGrad}
              >
                <MaterialIcons name="upcoming" size={14} color="#FFFFFF" />
                <Text style={styles.tabTextActive}>Upcoming</Text>
                {upcomingCount > 0 && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>{upcomingCount}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <MaterialIcons
                  name="upcoming"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.tabTextInactive}>Upcoming</Text>
                {upcomingCount > 0 && (
                  <View style={styles.tabCountInactive}>
                    <Text style={styles.tabCountInactiveText}>
                      {upcomingCount}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "past" && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab("past")}
            activeOpacity={0.8}
          >
            {activeTab === "past" ? (
              <LinearGradient
                colors={["#6B2FA0", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabActiveGrad}
              >
                <MaterialIcons name="history" size={14} color="#FFFFFF" />
                <Text style={styles.tabTextActive}>Past</Text>
                {pastCount > 0 && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>{pastCount}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <MaterialIcons
                  name="history"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
                <Text style={styles.tabTextInactive}>Past</Text>
                {pastCount > 0 && (
                  <View style={styles.tabCountInactive}>
                    <Text style={styles.tabCountInactiveText}>{pastCount}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
            ) : (
        <Animated.View
          style={{
            flex: 1,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
            opacity: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.7, 1],
            }),
          }}
        >
          <FlatList
            data={filteredBookings}
            renderItem={renderBooking}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#FF5A5F"]}
                tintColor="#FF5A5F"
              />
            }
            ListEmptyComponent={renderEmpty}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
const DetailCell = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={styles.detailCell}>
    <View style={styles.detailIconWrap}>
      <MaterialIcons name={icon} size={13} color="#FF5A5F" />
    </View>
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  // Header
  header: {
    overflow: "hidden",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  headerOrb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerCountPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  headerCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  tabItem: { flex: 1, borderRadius: 11, overflow: "hidden" },
  tabItemActive: {},
  tabActiveGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  tabInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  tabTextActive: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  tabTextInactive: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  tabCount: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  tabCountInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabCountInactiveText: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },

  accentBar: { flexDirection: "row", height: 3 },
  accentSeg: { flex: 1 },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#8A95A3", fontWeight: "500" },

  // List
  listContent: { padding: 16, gap: 12 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  cardAccent: { height: 3 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 10,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  restaurantIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantName: { fontSize: 15, fontWeight: "800", color: "#0F1B2D" },
  bookingId: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8A95A3",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },

  cardDivider: { height: 1, backgroundColor: "#EEF0F4", marginHorizontal: 14 },

  // Details grid
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 14,
    gap: 12,
  },
  detailCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "47%",
  },
  detailIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 10,
    color: "#8A95A3",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1B2D",
    marginTop: 1,
  },

  // Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  amountLabel: {
    fontSize: 10,
    color: "#8A95A3",
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F1B2D",
    letterSpacing: -0.5,
  },
  amountFree: { fontSize: 20, fontWeight: "900", color: "#10B981" },
  nonRefundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  nonRefundText: { fontSize: 10, color: "#EF4444", fontWeight: "600" },
  detailsBtnWrap: { borderRadius: 12, overflow: "hidden" },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  detailsBtnText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#0F1B2D" },
  emptySub: {
    fontSize: 13,
    color: "#8A95A3",
    textAlign: "center",
    lineHeight: 20,
  },
});
