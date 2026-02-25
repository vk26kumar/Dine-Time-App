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

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> =
  {
    confirmed: { color: "#10B981", bg: "#ECFDF5", icon: "check-circle" },
    cancelled: { color: "#EF4444", bg: "#FEF2F2", icon: "cancel" },
    completed: { color: "#6B2FA0", bg: "#F5F0FF", icon: "task-alt" },
    "no-show": { color: "#8A95A3", bg: "#F5F6F8", icon: "warning" },
    pending: { color: "#FF9F43", bg: "#FFF8F0", icon: "schedule" },
  };

const FILTERS = ["all", "confirmed", "completed", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];

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

  const confirmBooking = (b: Booking) =>
    Alert.alert("Confirm Booking", `Confirm for ${b.restaurantName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () =>
          updateBooking(b.id, { status: "confirmed" }, "Booking confirmed."),
      },
    ]);

  const completeBooking = (id: string) =>
    Alert.alert("Complete Booking", "Mark as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () =>
          updateBooking(
            id,
            { status: "completed", completedAt: Timestamp.now() },
            "Marked as completed.",
          ),
      },
    ]);

  const noShowBooking = (id: string) =>
    Alert.alert("No Show", "Mark as no-show?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "No Show",
        style: "destructive",
        onPress: () =>
          updateBooking(id, { status: "no-show" }, "Marked as no-show."),
      },
    ]);

  const cancelBooking = (id: string) =>
    Alert.alert(
      "Cancel Booking",
      "Cancel this booking? Customer will be notified.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: () =>
            updateBooking(
              id,
              {
                status: "cancelled",
                cancelledAt: Timestamp.now(),
                cancelledBy: "restaurant",
              },
              "Booking cancelled.",
            ),
        },
      ],
    );

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const stats = {
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const isFree = item.payment?.amount === 0;
    const isUpdating = updating === item.id;

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.restaurantIconWrap}>
              <MaterialIcons name="restaurant" size={15} color="#FF5A5F" />
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
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Guest + Booking info */}
        <View style={styles.detailsGrid}>
          <DetailCell
            icon="person"
            label="Guest"
            value={item.userName || "Guest"}
          />
          <DetailCell
            icon="phone"
            label="Phone"
            value={item.userPhone || "N/A"}
          />
          <DetailCell
            icon="calendar-today"
            label="Date"
            value={
              item.date?.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }) || "N/A"
            }
          />
          <DetailCell
            icon="schedule"
            label="Time"
            value={item.timeSlot || "N/A"}
          />
          <DetailCell
            icon="people"
            label="Guests"
            value={`${item.numberOfGuests} people`}
          />
          <DetailCell
            icon="table-restaurant"
            label="Tables"
            value={`${item.tableIds?.length ?? 1} table`}
          />
          {item.occasion ? (
            <DetailCell
              icon="celebration"
              label="Occasion"
              value={item.occasion}
            />
          ) : null}
        </View>

        {item.specialRequests ? (
          <View style={styles.requestBox}>
            <MaterialIcons name="notes" size={12} color="#6B2FA0" />
            <Text style={styles.requestText}>{item.specialRequests}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Payment */}
        <View style={styles.paymentRow}>
          <View>
            <Text style={styles.paymentLabel}>PAYMENT</Text>
            <View style={styles.paymentStatusRow}>
              <View
                style={[
                  styles.paymentDot,
                  {
                    backgroundColor:
                      item.payment?.status === "success"
                        ? "#10B981"
                        : "#FF9F43",
                  },
                ]}
              />
              <Text style={styles.paymentStatus}>
                {(item.payment?.status || "pending").toUpperCase()}
              </Text>
            </View>
          </View>
          {isFree ? (
            <Text style={styles.amountFree}>FREE</Text>
          ) : (
            <Text style={styles.amountValue}>₹{item.payment?.amount}</Text>
          )}
        </View>

        {/* Action buttons — only for confirmed */}
        {item.status === "confirmed" && (
          <>
            <View style={styles.divider} />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionComplete}
                onPress={() => completeBooking(item.id)}
                disabled={isUpdating}
                activeOpacity={0.85}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="done-all" size={14} color="#FFFFFF" />
                    <Text style={styles.actionCompleteText}>Complete</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionNoShow}
                onPress={() => noShowBooking(item.id)}
                disabled={isUpdating}
                activeOpacity={0.85}
              >
                <MaterialIcons name="warning" size={14} color="#8A95A3" />
                <Text style={styles.actionNoShowText}>No Show</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCancel}
                onPress={() => cancelBooking(item.id)}
                disabled={isUpdating}
                activeOpacity={0.85}
              >
                <MaterialIcons name="close" size={14} color="#EF4444" />
                <Text style={styles.actionCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

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
          <Text style={styles.headerTitle}>Manage Bookings</Text>
          <View style={styles.totalPill}>
            <Text style={styles.totalPillText}>{bookings.length} total</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Confirmed", value: stats.confirmed, color: "#10B981" },
            { label: "Completed", value: stats.completed, color: "#6B2FA0" },
            { label: "Cancelled", value: stats.cancelled, color: "#EF4444" },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter tabs */}
        <View style={styles.filterBar}>
          {FILTERS.map((f) => {
            const isActive = filter === f;
            const count =
              f === "all"
                ? bookings.length
                : bookings.filter((b) => b.status === f).length;
            return (
              <TouchableOpacity
                key={f}
                style={styles.filterTabWrap}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={
                      f === "cancelled"
                        ? ["#EF4444", "#FF5A5F"]
                        : f === "completed"
                          ? ["#6B2FA0", "#A855F7"]
                          : ["#FF5A5F", "#FF9F43"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.filterTabActive}
                  >
                    <Text style={styles.filterTabActiveText}>
                      {f === "all"
                        ? "All"
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                    <View style={styles.filterCount}>
                      <Text style={styles.filterCountText}>{count}</Text>
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.filterTabInactive}>
                    <Text style={styles.filterTabInactiveText}>
                      {f === "all"
                        ? "All"
                        : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
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

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadBookings();
              }}
              colors={["#FF5A5F"]}
              tintColor="#FF5A5F"
            />
          }
          ListEmptyComponent={
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
                Bookings for your restaurants will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

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
      <MaterialIcons name={icon} size={12} color="#FF5A5F" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
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
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  totalPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  totalPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },

  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    marginTop: 2,
  },

  filterBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 3,
  },
  filterTabWrap: { flex: 1, borderRadius: 10, overflow: "hidden" },
  filterTabActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  filterTabActiveText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  filterCount: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterCountText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
  filterTabInactive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  filterTabInactiveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  filterCountInactive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  filterCountInactiveText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },

  accentBar: { flexDirection: "row", height: 3 },
  accentSeg: { flex: 1 },

  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#8A95A3", fontWeight: "500" },
  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
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
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantName: { fontSize: 14, fontWeight: "800", color: "#0F1B2D" },
  bookingId: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8A95A3",
    marginTop: 2,
    letterSpacing: 0.4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 10, fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#EEF0F4", marginHorizontal: 14 },

  detailsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 14, gap: 10 },
  detailCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    width: "47%",
  },
  detailIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  detailLabel: {
    fontSize: 9,
    color: "#8A95A3",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F1B2D",
    marginTop: 1,
  },

  requestBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#F5F0FF",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6B2FA015",
  },
  requestText: { flex: 1, fontSize: 12, color: "#6B2FA0", lineHeight: 17 },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  paymentLabel: {
    fontSize: 9,
    color: "#8A95A3",
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  paymentStatusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  paymentDot: { width: 6, height: 6, borderRadius: 3 },
  paymentStatus: { fontSize: 11, fontWeight: "700", color: "#0F1B2D" },
  amountValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F1B2D",
    letterSpacing: -0.5,
  },
  amountFree: { fontSize: 20, fontWeight: "900", color: "#10B981" },

  actionRow: { flexDirection: "row", gap: 8, padding: 14 },
  actionComplete: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#6B2FA0",
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionCompleteText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  actionNoShow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#F5F6F8",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  actionNoShowText: { fontSize: 12, fontWeight: "700", color: "#8A95A3" },
  actionCancel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#FEF2F2",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF444420",
  },
  actionCancelText: { fontSize: 12, fontWeight: "700", color: "#EF4444" },

  emptyWrap: { flex: 1, alignItems: "center", paddingTop: 60, gap: 14 },
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
