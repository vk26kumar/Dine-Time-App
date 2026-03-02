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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { Booking } from "../../types";
import { notificationService } from "../../services/notificationService";

// ─── TAB BAR HEIGHT ────────────────────────────────────────────────────────────
// Adjust this value to match your actual tab bar height
const TAB_BAR_HEIGHT = 80;

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: any; label: string }
> = {
  confirmed: {
    color: "#0EA5E9",
    bg: "#F0F9FF",
    icon: "check-circle",
    label: "Confirmed",
  },
  cancelled: {
    color: "#F43F5E",
    bg: "#FFF1F2",
    icon: "cancel",
    label: "Cancelled",
  },
  completed: {
    color: "#8B5CF6",
    bg: "#F5F3FF",
    icon: "task-alt",
    label: "Completed",
  },
  "no-show": {
    color: "#94A3B8",
    bg: "#F8FAFC",
    icon: "warning",
    label: "No Show",
  },
  pending: {
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: "schedule",
    label: "Pending",
  },
};

const FILTERS = ["all", "confirmed", "completed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_COLORS: Record<string, readonly [string, string]> = {
  all: ["#6366F1", "#8B5CF6"],
  confirmed: ["#0EA5E9", "#38BDF8"],
  completed: ["#8B5CF6", "#A78BFA"],
  cancelled: ["#F43F5E", "#FB7185"],
};

export default function OwnerManageBookingsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const rSnap = await getDocs(
        query(collection(db, "restaurants"), where("ownerId", "==", user.uid)),
      );
      const restaurantIds = rSnap.docs.map((d) => d.id);
      if (!restaurantIds.length) {
        setBookings([]);
        return;
      }

      const bSnap = await getDocs(
        query(
          collection(db, "bookings"),
          where("restaurantId", "in", restaurantIds),
          orderBy("createdAt", "desc"),
        ),
      );
      const list: Booking[] = [];
      bSnap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          ...data,
          id: docSnap.id,
          date: data.date?.toDate?.(),
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
          cancelledAt: data.cancelledAt?.toDate?.(),
          completedAt: data.completedAt?.toDate?.(),
          payment: {
            ...data.payment,
            paidAt: data.payment?.paidAt?.toDate?.(),
          },
        } as Booking);
      });
      setBookings(list);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateBooking = async (
    id: string,
    data: Record<string, any>,
    successMsg: string,
  ) => {
    try {
      setUpdating(id);
      await updateDoc(doc(db, "bookings", id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...data } : b)),
      );
      Alert.alert("Success", successMsg);
    } catch {
      Alert.alert("Error", "Failed to update booking.");
    } finally {
      setUpdating(null);
    }
  };

  const getBooking = (id: string) => bookings.find((b) => b.id === id);

  const confirmBooking = (b: Booking) =>
    Alert.alert("Confirm Booking", `Confirm booking for ${b.restaurantName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          updateBooking(b.id, { status: "confirmed" }, "Booking confirmed."),
      },
    ]);

  const completeBooking = (id: string) =>
    Alert.alert("Complete Booking", "Mark this booking as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          await updateBooking(
            id,
            { status: "completed", completedAt: Timestamp.now() },
            "Marked as completed.",
          );
          const booking = getBooking(id);
          if (booking?.userId)
            await notificationService.notifyBookingCompleted(
              booking.userId,
              booking.restaurantName,
              id,
            );
        },
      },
    ]);

  const noShowBooking = (id: string) =>
    Alert.alert("No Show", "Mark this booking as no-show?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "No Show",
        style: "destructive",
        onPress: async () => {
          await updateBooking(id, { status: "no-show" }, "Marked as no-show.");
          const booking = getBooking(id);
          if (booking?.userId)
            await notificationService.notifyBookingNoShow(
              booking.userId,
              booking.restaurantName,
              id,
            );
        },
      },
    ]);

  const cancelBooking = (id: string) =>
    Alert.alert(
      "Cancel Booking",
      "Cancel this booking? The customer will be notified.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            await updateBooking(
              id,
              {
                status: "cancelled",
                cancelledAt: Timestamp.now(),
                cancelledBy: "restaurant",
              },
              "Booking cancelled.",
            );
            const booking = getBooking(id);
            if (booking?.userId)
              await notificationService.notifyBookingCancelled(
                booking.userId,
                booking.restaurantName,
                id,
              );
          },
        },
      ],
    );

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const stats = {
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    pending: bookings.filter((b) => b.status === "no-show").length,
  };

  // ─── Booking card ────────────────────────────────────────────────────────────
  const renderBooking = ({ item }: { item: Booking }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const isFree = item.payment?.amount === 0;
    const isUpdating = updating === item.id;
    const dateStr =
      item.date?.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) || "N/A";

    return (
      <View style={styles.card}>
        {/* Top strip */}
        <View style={[styles.cardStrip, { backgroundColor: cfg.color }]} />

        {/* Card header */}
        <View style={styles.cardHead}>
          <View style={styles.cardHeadLeft}>
            <View
              style={[styles.restaurantAvatar, { backgroundColor: cfg.bg }]}
            >
              <MaterialIcons name="storefront" size={18} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {item.restaurantName}
              </Text>
              <Text style={styles.bookingRef}>
                REF #{item.id.slice(-8).toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.statusPillText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Main info row */}
        <View style={styles.infoRow}>
          <InfoChip icon="calendar-today" value={dateStr} />
          <InfoChip icon="schedule" value={item.timeSlot || "N/A"} />
          <InfoChip icon="people" value={`${item.numberOfGuests} guests`} />
        </View>

        {/* Guest details */}
        <View style={styles.guestRow}>
          <View style={styles.guestItem}>
            <MaterialIcons name="person-outline" size={13} color="#94A3B8" />
            <Text style={styles.guestLabel}>Guest</Text>
            <Text style={styles.guestValue}>{item.userName || "Guest"}</Text>
          </View>
          <View style={styles.guestDivider} />
          <View style={styles.guestItem}>
            <MaterialIcons name="phone-iphone" size={13} color="#94A3B8" />
            <Text style={styles.guestLabel}>Phone</Text>
            <Text style={styles.guestValue}>{item.userPhone || "N/A"}</Text>
          </View>
          <View style={styles.guestDivider} />
          <View style={styles.guestItem}>
            <MaterialIcons name="table-restaurant" size={13} color="#94A3B8" />
            <Text style={styles.guestLabel}>Tables</Text>
            <Text style={styles.guestValue}>{item.tableIds?.length ?? 1}</Text>
          </View>
        </View>

        {/* Occasion tag */}
        {item.occasion ? (
          <View style={styles.occasionTag}>
            <MaterialIcons name="celebration" size={12} color="#8B5CF6" />
            <Text style={styles.occasionText}>{item.occasion}</Text>
          </View>
        ) : null}

        {/* Special requests */}
        {item.specialRequests ? (
          <View style={styles.requestBox}>
            <MaterialIcons
              name="chat-bubble-outline"
              size={12}
              color="#64748B"
            />
            <Text style={styles.requestText}>{item.specialRequests}</Text>
          </View>
        ) : null}

        {/* Payment footer */}
        <View style={styles.cardFooter}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentMethodLabel}>PAYMENT</Text>
            <View style={styles.paymentStatusRow}>
              <View
                style={[
                  styles.paymentBadge,
                  {
                    backgroundColor:
                      item.payment?.status === "success"
                        ? "#ECFDF5"
                        : "#FFFBEB",
                  },
                ]}
              >
                <MaterialIcons
                  name={
                    item.payment?.status === "success" ? "verified" : "pending"
                  }
                  size={11}
                  color={
                    item.payment?.status === "success" ? "#10B981" : "#F59E0B"
                  }
                />
                <Text
                  style={[
                    styles.paymentBadgeText,
                    {
                      color:
                        item.payment?.status === "success"
                          ? "#10B981"
                          : "#F59E0B",
                    },
                  ]}
                >
                  {(item.payment?.status || "pending").toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.amountBox}>
            {isFree ? (
              <Text style={styles.amountFree}>FREE</Text>
            ) : (
              <>
                <Text style={styles.amountCurrency}>₹</Text>
                <Text style={styles.amountValue}>{item.payment?.amount}</Text>
              </>
            )}
          </View>
        </View>

        {/* Action buttons — only for confirmed */}
        {item.status === "confirmed" && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.btnComplete}
              onPress={() => completeBooking(item.id)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="done-all" size={15} color="#FFFFFF" />
                  <Text style={styles.btnCompleteText}>Complete</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnNoShow}
              onPress={() => noShowBooking(item.id)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-off" size={15} color="#64748B" />
              <Text style={styles.btnNoShowText}>No Show</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => cancelBooking(item.id)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <MaterialIcons name="block" size={15} color="#F43F5E" />
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#0F172A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Decorative blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerEyebrow}>Restaurant Dashboard</Text>
            <Text style={styles.headerTitle}>Bookings</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeNum}>{bookings.length}</Text>
            <Text style={styles.totalBadgeLabel}>Total</Text>
          </View>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <StatCard
            label="Confirmed"
            value={stats.confirmed}
            color="#0EA5E9"
            icon="check-circle"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            color="#8B5CF6"
            icon="task-alt"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            color="#F43F5E"
            icon="cancel"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            color="#F59E0B"
            icon="schedule"
          />
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            const count =
              f === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === f).length;
            const colors =
              FILTER_COLORS[f] ?? (["#6366F1", "#8B5CF6"] as const);
            const label =
              f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1);

            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.75}
              >
                {isActive ? (
                  <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterTabGradient}
                  >
                    <Text style={styles.filterTabActiveText}>{label}</Text>
                    {count > 0 && (
                      <View style={styles.filterCountActive}>
                        <Text style={styles.filterCountActiveText}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={styles.filterTabInner}>
                    <Text style={styles.filterTabText}>{label}</Text>
                    {count > 0 && (
                      <View style={styles.filterCountInactive}>
                        <Text style={styles.filterCountInactiveText}>
                          {count}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading bookings…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBookings();
              }}
              colors={["#6366F1"]}
              tintColor="#6366F1"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <LinearGradient
                colors={["#1E293B", "#0F172A"]}
                style={styles.emptyIconRing}
              >
                <MaterialIcons name="event-busy" size={30} color="#475569" />
              </LinearGradient>
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySub}>
                {filter === "all"
                  ? "Bookings for your restaurants will appear here"
                  : `No ${filter} bookings at the moment`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: any;
}) => (
  <View style={[styles.statCard, { borderColor: color + "30" }]}>
    <MaterialIcons name={icon} size={14} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoChip = ({ icon, value }: { icon: any; value: string }) => (
  <View style={styles.infoChip}>
    <MaterialIcons name={icon} size={12} color="#6366F1" />
    <Text style={styles.infoChipText}>{value}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },

  // Header
  header: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(99,102,241,0.12)",
    top: -80,
    right: -60,
  },
  blob2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139,92,246,0.10)",
    top: 40,
    right: 80,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
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
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
  },
  totalBadge: {
    backgroundColor: "rgba(99,102,241,0.25)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.4)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
  },
  totalBadgeNum: { fontSize: 20, fontWeight: "800", color: "#A5B4FC" },
  totalBadgeLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(165,180,252,0.7)",
    letterSpacing: 0.6,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 3,
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Filters
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 6,
  },
  filterTab: { flex: 1, borderRadius: 10, overflow: "hidden" },
  filterTabActive: {},
  filterTabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    gap: 4,
    borderRadius: 10,
  },
  filterTabInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filterTabActiveText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  filterTabText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  filterCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  filterCountActiveText: { fontSize: 9, fontWeight: "700", color: "#FFF" },
  filterCountInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  filterCountInactiveText: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },

  // Loading / empty
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },
  loadingText: { fontSize: 14, color: "#94A3B8", fontWeight: "500" },
  emptyWrap: { paddingTop: 72, alignItems: "center", gap: 12 },
  emptyIconRing: {
    width: 76,
    height: 76,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#334155" },
  emptySub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },

  // List
  list: { padding: 16, gap: 14 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardStrip: { height: 4 },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  cardHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  restaurantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  restaurantName: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
  bookingRef: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  // Info chips row
  infoRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoChipText: { fontSize: 11, fontWeight: "700", color: "#4338CA" },

  // Guest row
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  guestItem: { flex: 1, alignItems: "center", gap: 3 },
  guestDivider: { width: 1, height: 30, backgroundColor: "#E2E8F0" },
  guestLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  guestValue: { fontSize: 12, fontWeight: "700", color: "#1E293B" },

  // Occasion
  occasionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#F5F3FF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  occasionText: { fontSize: 12, color: "#7C3AED", fontWeight: "600" },

  // Special requests
  requestBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#CBD5E1",
  },
  requestText: { flex: 1, fontSize: 12, color: "#475569", lineHeight: 18 },

  // Card footer (payment)
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  paymentInfo: { gap: 4 },
  paymentMethodLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  paymentStatusRow: { flexDirection: "row" },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentBadgeText: { fontSize: 10, fontWeight: "700" },
  amountBox: { flexDirection: "row", alignItems: "flex-start" },
  amountCurrency: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginTop: 4,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -1,
  },
  amountFree: { fontSize: 20, fontWeight: "800", color: "#10B981" },

  // Action bar
  actionBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  btnComplete: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#6366F1",
    paddingVertical: 11,
    borderRadius: 12,
  },
  btnCompleteText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  btnNoShow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingVertical: 11,
    borderRadius: 12,
  },
  btnNoShowText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  btnCancel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF1F2",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  btnCancelText: { fontSize: 13, fontWeight: "700", color: "#F43F5E" },
});
