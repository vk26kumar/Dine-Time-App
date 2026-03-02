// app/(consumer)/bookings.tsx
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
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { Booking } from "../../types";

const { width: SW } = Dimensions.get("window");

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
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: "task-alt",
  },
  pending: {
    label: "Pending",
    color: "#FF9F43",
    bg: "#FFF8F0",
    icon: "schedule",
  },
};

const DetailCell = ({ icon, label, value }: any) => (
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

const TxnRow = ({ label, value, bold, borderTop, valueColor }: any) => (
  <View style={[styles.txnRow, borderTop && styles.txnRowBorderTop]}>
    <Text style={styles.txnRowLabel}>{label}</Text>
    <Text
      style={[
        styles.txnRowValue,
        bold && styles.txnRowValueBold,
        valueColor && { color: valueColor },
      ]}
    >
      {value}
    </Text>
  </View>
);

export default function BookingsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "bookings"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
      );
      const snap = await getDocs(q);
      setBookings(
        snap.docs.map((doc) => {
          const d = doc.data();
          return {
            ...d,
            id: doc.id,
            date: d.date?.toDate(),
            createdAt: d.createdAt?.toDate(),
            updatedAt: d.updatedAt?.toDate(),
            payment: { ...d.payment, paidAt: d.payment?.paidAt?.toDate() },
          } as Booking;
        }),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const upcomingCount = bookings.filter(
    (b) => b.date >= new Date() && b.status !== "cancelled",
  ).length;

  const filtered = bookings.filter((b) => {
    const isPast = b.date < new Date() || b.status === "cancelled";
    return activeTab === "upcoming" ? !isPast : isPast;
  });

  const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
    const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const isExpanded = expandedId === item.id;
    const isFree = !item.payment?.amount || item.payment.amount === 0;
    const amount = item.payment?.amount ?? 0;
    const payStatus = item.payment?.status ?? "success";

    const payStatusColor =
      payStatus === "failed"
        ? "#EF4444"
        : payStatus === "pending"
          ? "#FF9F43"
          : "#10B981";
    const payStatusBg =
      payStatus === "failed"
        ? "#FEF2F2"
        : payStatus === "pending"
          ? "#FFF8F0"
          : "#ECFDF5";
    const payStatusIcon =
      payStatus === "failed"
        ? "cancel"
        : payStatus === "pending"
          ? "schedule"
          : "check-circle";

    const txnId =
      (item.payment as any)?.razorpayPaymentId ??
      `TXN${item.id.slice(-10).toUpperCase()}`;

    return (
      <View style={[styles.card, index === 0 && { marginTop: 4 }]}>
        {/* Top color accent */}
        <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

        {/* ── Header ── */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {item.restaurantName}
            </Text>
            <Text style={styles.bookingId}>
              #{item.id.slice(-8).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
            <MaterialIcons name={cfg.icon} size={11} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* ── Booking details grid ── */}
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
        </View>

        <View style={styles.cardDivider} />

        {/* ── Payment ── */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconWrap}>
                <MaterialIcons name="payments" size={14} color="#FF5A5F" />
              </View>
              <View>
                <Text style={styles.paymentLabel}>Amount Paid</Text>
                <Text style={isFree ? styles.amountFree : styles.amountValue}>
                  {isFree ? "FREE" : `₹${amount}`}
                </Text>
              </View>
            </View>
            <View style={styles.paymentRight}>
              {!isFree && (
                <View style={styles.paymentMethodPill}>
                  <MaterialIcons
                    name={
                      item.payment?.method === "card"
                        ? "credit-card"
                        : item.payment?.method === "upi"
                          ? "account-balance"
                          : "payments"
                    }
                    size={11}
                    color="#7C3AED"
                  />
                  <Text style={styles.paymentMethodText}>
                    {item.payment?.method?.toUpperCase() ?? "PAID"}
                  </Text>
                </View>
              )}
              <View style={styles.nonRefundRow}>
                <MaterialIcons name="info-outline" size={10} color="#EF4444" />
                <Text style={styles.nonRefundText}>Non-refundable</Text>
              </View>
            </View>
          </View>

          {/* ── Transaction toggle ── */}
          <TouchableOpacity
            style={styles.txnToggleBtn}
            onPress={() => setExpandedId(isExpanded ? null : item.id)}
          >
            <MaterialIcons name="receipt-long" size={13} color="#7C3AED" />
            <Text style={styles.txnToggleText}>Transaction Details</Text>
            <MaterialIcons
              name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={16}
              color="#7C3AED"
            />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.txnBox}>
              <View style={styles.txnIdRow}>
                <View style={styles.txnIdLeft}>
                  <MaterialIcons name="tag" size={12} color="#8A95A3" />
                  <Text style={styles.txnIdLabel}>Razorpay Payment ID</Text>
                </View>
                <Text style={styles.txnIdValue}>{txnId}</Text>
              </View>
              <View style={styles.txnIdRow}>
                <View style={styles.txnIdLeft}>
                  <MaterialIcons
                    name="confirmation-number"
                    size={12}
                    color="#8A95A3"
                  />
                  <Text style={styles.txnIdLabel}>Booking Ref</Text>
                </View>
                <Text style={styles.txnIdValue}>
                  #{item.id.slice(-8).toUpperCase()}
                </Text>
              </View>

              {item.payment?.paidAt && (
                <View style={styles.txnIdRow}>
                  <View style={styles.txnIdLeft}>
                    <MaterialIcons name="schedule" size={12} color="#8A95A3" />
                    <Text style={styles.txnIdLabel}>Paid On</Text>
                  </View>
                  <Text style={styles.txnIdValue}>
                    {item.payment.paidAt.toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}

              <View style={styles.txnDivider} />
              <Text style={styles.txnSectionTitle}>Amount</Text>
              <TxnRow
                label="Total Charged"
                value={isFree ? "FREE" : `₹${amount}`}
                bold
                valueColor="#0F1B2D"
              />
              <View style={styles.txnDivider} />

              <View style={styles.txnStatusRow}>
                <Text style={styles.txnRowLabel}>Payment Status</Text>
                <View
                  style={[
                    styles.txnStatusBadge,
                    { backgroundColor: payStatusBg },
                  ]}
                >
                  <MaterialIcons
                    name={payStatusIcon}
                    size={11}
                    color={payStatusColor}
                  />
                  <Text
                    style={[styles.txnStatusText, { color: payStatusColor }]}
                  >
                    {payStatus.charAt(0).toUpperCase() + payStatus.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#FFF0F0", "#FFF8F0"]}
        style={styles.emptyIconWrap}
      >
        <MaterialIcons
          name={activeTab === "upcoming" ? "event-available" : "history"}
          size={34}
          color="#FF9F43"
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
      </Text>
      <Text style={styles.emptySub}>
        {activeTab === "upcoming"
          ? "Discover restaurants and book your next dining experience"
          : "Your completed and cancelled bookings will appear here"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1826" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={["#0D1826", "#132338", "#0D1826"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Orbs */}
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        {/* Diagonal lines */}
        {[0.15, 0.38, 0.62, 0.85].map((r, i) => (
          <View key={i} style={[styles.diag, { left: SW * r }]} />
        ))}

        {/* Top row: brand + count */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerBrand}>
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerLogoMark}
            >
              <MaterialIcons name="restaurant" size={14} color="#FFF" />
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>My Bookings</Text>
              <Text style={styles.headerCaption}>
                <Text style={{ color: "#FF9F43" }}>{upcomingCount}</Text>
                {" upcoming · "}
                <Text style={{ color: "rgba(255,255,255,0.45)" }}>
                  {bookings.length} total
                </Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerRefreshBtn}
            onPress={() => {
              setRefreshing(true);
              loadBookings();
            }}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name="refresh"
              size={18}
              color="rgba(255,255,255,0.65)"
            />
          </TouchableOpacity>
        </View>

        {/* ── Tab switcher ── */}
        <View style={styles.tabBar}>
          {(["upcoming", "past"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tabItem}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.85}
            >
              {activeTab === t ? (
                <LinearGradient
                  colors={["#FF5A5F", "#FF7A2F", "#FF9F43"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabActiveGrad}
                >
                  <MaterialIcons
                    name={t === "upcoming" ? "event-available" : "history"}
                    size={13}
                    color="#FFF"
                  />
                  <Text style={styles.tabTextActive}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.tabInactive}>
                  <MaterialIcons
                    name={t === "upcoming" ? "event-available" : "history"}
                    size={13}
                    color="rgba(255,255,255,0.45)"
                  />
                  <Text style={styles.tabTextInactive}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Arch */}
        <View style={styles.arch}>
          <View style={styles.archShape} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#FF5A5F" />
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
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
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FB" },

  // ── Header ──
  header: {
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 0,
    elevation: 12,
    shadowColor: "#0D1826",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  orb1: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,80,80,0.12)",
    top: -100,
    right: -70,
  },
  orb2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,150,40,0.08)",
    bottom: 20,
    left: -60,
  },
  diag: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    marginBottom: 20,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerLogoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerCaption: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginTop: 1,
  },
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 4,
    gap: 4,
    marginBottom: 36,
  },
  tabItem: { flex: 1, borderRadius: 11, overflow: "hidden" },
  tabActiveGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
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
    color: "rgba(255,255,255,0.45)",
  },

  // Arch
  arch: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 36,
    overflow: "hidden",
  },
  archShape: {
    position: "absolute",
    left: -SW * 0.12,
    right: -SW * 0.12,
    top: 0,
    height: 72,
    backgroundColor: "#F8F9FB",
    borderTopLeftRadius: SW * 0.65,
    borderTopRightRadius: SW * 0.65,
  },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#0D1826",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  cardAccent: { height: 3 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  restaurantIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantName: { fontSize: 15, fontWeight: "800", color: "#0D1826" },
  bookingId: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 1,
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
  cardDivider: { height: 1, backgroundColor: "#F0F2F5", marginHorizontal: 14 },

  // Details grid
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 14, gap: 12 },
  detailCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "47%",
  },
  detailIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  detailValue: { fontSize: 12, fontWeight: "700", color: "#0D1826" },

  // Payment section
  paymentSection: {
    backgroundColor: "#FAFBFC",
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ECEEF2",
  },
  paymentRow: { flexDirection: "row", justifyContent: "space-between" },
  paymentLeft: { flexDirection: "row", gap: 10 },
  paymentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  amountValue: { fontSize: 16, fontWeight: "900", color: "#0D1826" },
  amountFree: { fontSize: 16, fontWeight: "900", color: "#10B981" },
  paymentRight: { alignItems: "flex-end", gap: 6 },
  paymentMethodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentMethodText: { fontSize: 10, fontWeight: "800", color: "#7C3AED" },
  nonRefundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nonRefundText: { fontSize: 10, color: "#EF4444", fontWeight: "600" },

  // Transaction toggle
  txnToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF2",
  },
  txnToggleText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#7C3AED" },

  txnBox: {
    marginTop: 10,
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  txnIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  txnIdLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  txnIdLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  txnIdValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7C3AED",
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  txnDivider: { height: 1, backgroundColor: "#EDE9FE", marginVertical: 10 },
  txnSectionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  txnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  txnRowLabel: { fontSize: 12, color: "#6B7280" },
  txnRowValue: { fontSize: 12, color: "#0D1826", fontWeight: "600" },
  txnRowValueBold: { fontSize: 14, fontWeight: "900" },
  txnRowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#EDE9FE",
    marginTop: 4,
    paddingTop: 10,
  },
  txnStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txnStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  txnStatusText: { fontSize: 11, fontWeight: "800" },

  // List
  listContent: { paddingTop: 8, paddingHorizontal: 0 },

  // Empty state
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 36,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0D1826",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
