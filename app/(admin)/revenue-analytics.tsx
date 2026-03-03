// app/(admin)/revenue-analytics.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const C = {
  accent: "#ff7f2a", accentSoft: "#f49b33", accentBg: "#fff7f0",
  accentBorder: "#ffd7b0", white: "#FFFFFF", bg: "#f8f9fb",
  text: "#222222", textSub: "#666666", textMuted: "#999999",
  divider: "#f2f2f2", error: "#ff4b4b", errorBg: "#fff0f0",
  green: "#10B981", greenBg: "#D1FAE5",
  blue: "#3B82F6", blueBg: "#DBEAFE",
  purple: "#8B5CF6", purpleBg: "#EDE9FE",
  amber: "#F59E0B", amberBg: "#FFFBEB",
};

interface RestaurantRevenue {
  restaurantId: string;
  restaurantName: string;
  totalRevenue: number;
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  totalGuests: number;
  lastBookingDate: Date | null;
}

export default function RevenueAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantRevenues, setRestaurantRevenues] = useState<RestaurantRevenue[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0, totalBookings: 0, totalRestaurants: 0, averageRevenuePerRestaurant: 0,
  });
  const [sortBy, setSortBy] = useState<"revenue" | "bookings">("revenue");

  useEffect(() => { loadRevenueData(); }, []);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
      const restaurantsMap = new Map<string, string>();
      restaurantsSnapshot.forEach((doc) => { restaurantsMap.set(doc.id, doc.data().name || "Unknown Restaurant"); });

      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      const revenueMap = new Map<string, RestaurantRevenue>();

      bookingsSnapshot.forEach((doc) => {
        const data = doc.data();
        const restaurantId = data.restaurantId;
        const restaurantName = data.restaurantName || restaurantsMap.get(restaurantId) || "Unknown";
        if (!revenueMap.has(restaurantId)) {
          revenueMap.set(restaurantId, { restaurantId, restaurantName, totalRevenue: 0, totalBookings: 0, confirmedBookings: 0, completedBookings: 0, cancelledBookings: 0, averageBookingValue: 0, totalGuests: 0, lastBookingDate: null });
        }
        const r = revenueMap.get(restaurantId)!;
        r.totalBookings++;
        if (data.status === "confirmed") r.confirmedBookings++;
        if (data.status === "completed") r.completedBookings++;
        if (data.status === "cancelled") r.cancelledBookings++;
        if (data.payment?.amount) r.totalRevenue += data.payment.amount;
        if (data.numberOfGuests) r.totalGuests += data.numberOfGuests;
        const bookingDate = data.createdAt?.toDate();
        if (bookingDate && (!r.lastBookingDate || bookingDate > r.lastBookingDate)) r.lastBookingDate = bookingDate;
      });

      const revenueArray = Array.from(revenueMap.values()).map((r) => ({
        ...r, averageBookingValue: r.totalBookings > 0 ? r.totalRevenue / r.totalBookings : 0,
      }));
      revenueArray.sort((a, b) => b.totalRevenue - a.totalRevenue);

      const totalRevenue = revenueArray.reduce((sum, r) => sum + r.totalRevenue, 0);
      const totalBookings = revenueArray.reduce((sum, r) => sum + r.totalBookings, 0);

      setRestaurantRevenues(revenueArray);
      setTotalStats({ totalRevenue, totalBookings, totalRestaurants: revenueArray.length, averageRevenuePerRestaurant: revenueArray.length > 0 ? totalRevenue / revenueArray.length : 0 });
    } catch (error) { console.error("Error loading revenue data:", error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => { setRefreshing(true); loadRevenueData(); };

  const handleSort = (type: "revenue" | "bookings") => {
    setSortBy(type);
    const sorted = [...restaurantRevenues].sort((a, b) => type === "revenue" ? b.totalRevenue - a.totalRevenue : b.totalBookings - a.totalBookings);
    setRestaurantRevenues(sorted);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };
  const getRevenuePercentage = (revenue: number) => {
    if (totalStats.totalRevenue === 0) return 0;
    return ((revenue / totalStats.totalRevenue) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <View style={st.loadingContainer}>
        <LinearGradient colors={["#fff7f0", "#fde8c8"]} style={st.loadingInner}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={st.loadingText}>Loading revenue analytics...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={st.container}>
      {/* Header */}
      <LinearGradient colors={["#fff2e1", "#fde8c8", "#fff2e1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[st.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={st.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <MaterialIcons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>Revenue Analytics</Text>
          <Text style={st.headerSubtitle}>Detailed breakdown</Text>
        </View>
        <View style={{ width: 38 }} />
      </LinearGradient>

      <ScrollView style={st.content} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}>

        {/* Total Revenue Banner */}
        <TouchableOpacity style={st.totalRevenueWrap} activeOpacity={0.9}>
          <LinearGradient colors={["#ff7f2a", "#f49b33"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.totalRevenueCard}>
            <View style={st.totalRevenueIconWrap}>
              <MaterialIcons name="account-balance-wallet" size={28} color={C.white} />
            </View>
            <Text style={st.totalRevenueLabel}>Total Revenue</Text>
            <Text style={st.totalRevenueValue}>{formatCurrency(totalStats.totalRevenue)}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Summary stats row */}
        <View style={st.summaryRow}>
          <View style={st.summaryCard}>
            <View style={[st.summaryIconWrap, { backgroundColor: C.greenBg }]}>
              <MaterialIcons name="restaurant" size={20} color={C.green} />
            </View>
            <Text style={st.summaryValue}>{String(totalStats.totalRestaurants)}</Text>
            <Text style={st.summaryLabel}>Restaurants</Text>
          </View>
          <View style={st.summaryCard}>
            <View style={[st.summaryIconWrap, { backgroundColor: C.purpleBg }]}>
              <MaterialIcons name="event" size={20} color={C.purple} />
            </View>
            <Text style={st.summaryValue}>{String(totalStats.totalBookings)}</Text>
            <Text style={st.summaryLabel}>Total Bookings</Text>
          </View>
          <View style={st.summaryCard}>
            <View style={[st.summaryIconWrap, { backgroundColor: C.amberBg }]}>
              <MaterialIcons name="trending-up" size={20} color={C.amber} />
            </View>
            <Text style={st.summaryValue}>{formatCurrency(Math.round(totalStats.averageRevenuePerRestaurant))}</Text>
            <Text style={st.summaryLabel}>Avg / Restaurant</Text>
          </View>
        </View>

        {/* Sort section */}
        <View style={st.sortSection}>
          <Text style={st.sectionTitle}>Revenue by Restaurant</Text>
          <View style={st.sortButtons}>
            <TouchableOpacity
              style={[st.sortBtn, sortBy === "revenue" && st.sortBtnActive]}
              onPress={() => handleSort("revenue")} activeOpacity={0.8}>
              <Text style={[st.sortBtnText, sortBy === "revenue" && st.sortBtnTextActive]}>By Revenue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.sortBtn, sortBy === "bookings" && st.sortBtnActive]}
              onPress={() => handleSort("bookings")} activeOpacity={0.8}>
              <Text style={[st.sortBtnText, sortBy === "bookings" && st.sortBtnTextActive]}>By Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Restaurant cards */}
        <View style={st.listSection}>
          {restaurantRevenues.length > 0 ? restaurantRevenues.map((restaurant, index) => (
            <View key={restaurant.restaurantId} style={st.restaurantCard}>
              <View style={st.rankBadge}>
                <Text style={st.rankText}>#{index + 1}</Text>
              </View>
              <View style={st.restaurantHeader}>
                <View style={st.restaurantIconWrap}>
                  <MaterialIcons name="restaurant" size={22} color={C.accent} />
                </View>
                <View style={st.restaurantTitleWrap}>
                  <Text style={st.restaurantName} numberOfLines={1}>{String(restaurant.restaurantName)}</Text>
                  <Text style={st.restaurantId}>ID: {String(restaurant.restaurantId.substring(0, 8))}...</Text>
                </View>
              </View>
              <View style={st.progressContainer}>
                <View style={st.progressBar}>
                  <LinearGradient colors={["#ff7f2a", "#f49b33"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[st.progressFill, { width: `${Number(getRevenuePercentage(restaurant.totalRevenue))}%` }]} />
                </View>
                <Text style={st.progressText}>{getRevenuePercentage(restaurant.totalRevenue)}%</Text>
              </View>
              <View style={st.revenueAmount}>
                <Text style={st.revenueAmountLabel}>Total Revenue</Text>
                <Text style={st.revenueAmountValue}>{formatCurrency(restaurant.totalRevenue)}</Text>
              </View>
              <View style={st.statsGrid}>
                <View style={st.statItem}>
                  <MaterialIcons name="event" size={15} color={C.textMuted} />
                  <Text style={st.statValue}>{String(restaurant.totalBookings)}</Text>
                  <Text style={st.statLabel}>Bookings</Text>
                </View>
                <View style={st.statItem}>
                  <MaterialIcons name="people" size={15} color={C.textMuted} />
                  <Text style={st.statValue}>{String(restaurant.totalGuests)}</Text>
                  <Text style={st.statLabel}>Guests</Text>
                </View>
                <View style={st.statItem}>
                  <MaterialIcons name="attach-money" size={15} color={C.textMuted} />
                  <Text style={st.statValue}>{formatCurrency(Math.round(restaurant.averageBookingValue))}</Text>
                  <Text style={st.statLabel}>Avg Booking</Text>
                </View>
              </View>
              <View style={st.statusRow}>
                <View style={st.statusItem}><View style={[st.statusDot, { backgroundColor: C.green }]} /><Text style={st.statusText}>{String(restaurant.confirmedBookings)} Confirmed</Text></View>
                <View style={st.statusItem}><View style={[st.statusDot, { backgroundColor: C.blue }]} /><Text style={st.statusText}>{String(restaurant.completedBookings)} Completed</Text></View>
                <View style={st.statusItem}><View style={[st.statusDot, { backgroundColor: C.error }]} /><Text style={st.statusText}>{String(restaurant.cancelledBookings)} Cancelled</Text></View>
              </View>
              <View style={st.lastBooking}>
                <MaterialIcons name="schedule" size={13} color={C.textMuted} />
                <Text style={st.lastBookingText}>Last booking: {formatDate(restaurant.lastBookingDate)}</Text>
              </View>
            </View>
          )) : (
            <View style={st.emptyState}>
              <LinearGradient colors={["#fff7f0", "#fde8c8"]} style={st.emptyIconCircle}>
                <MaterialIcons name="receipt-long" size={48} color={C.accent} />
              </LinearGradient>
              <Text style={st.emptyText}>No revenue data available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loadingInner: { padding: 32, borderRadius: 20, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  header: { paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.7)", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accentBorder },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  headerSubtitle: { fontSize: 12, color: C.textSub, marginTop: 2 },
  content: { flex: 1 },
  totalRevenueWrap: { marginHorizontal: 14, marginTop: 14, marginBottom: 12, borderRadius: 20, overflow: "hidden", shadowColor: "#ff7f2a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  totalRevenueCard: { padding: 22, alignItems: "center" },
  totalRevenueIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  totalRevenueLabel: { fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginBottom: 6 },
  totalRevenueValue: { fontSize: 34, fontWeight: "800", color: C.white },
  summaryRow: { flexDirection: "row", paddingHorizontal: 14, gap: 10, marginBottom: 14 },
  summaryCard: { flex: 1, backgroundColor: C.white, borderRadius: 14, padding: 12, alignItems: "center", gap: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: C.divider },
  summaryIconWrap: { width: 38, height: 38, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  summaryValue: { fontSize: 15, fontWeight: "800", color: C.text },
  summaryLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600", textAlign: "center" },
  sortSection: { paddingHorizontal: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  sortButtons: { flexDirection: "row", gap: 8 },
  sortBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: C.white, alignItems: "center", borderWidth: 1, borderColor: C.divider },
  sortBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  sortBtnText: { fontSize: 13, fontWeight: "600", color: C.textSub },
  sortBtnTextActive: { color: C.white },
  listSection: { paddingHorizontal: 14 },
  restaurantCard: { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, position: "relative", borderWidth: 1, borderColor: C.divider },
  rankBadge: { position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: C.accentBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accentBorder },
  rankText: { fontSize: 12, fontWeight: "800", color: C.accent },
  restaurantHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  restaurantIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.accentBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.accentBorder },
  restaurantTitleWrap: { flex: 1, marginLeft: 10, marginRight: 40 },
  restaurantName: { fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 3 },
  restaurantId: { fontSize: 11, color: C.textMuted },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  progressBar: { flex: 1, height: 8, backgroundColor: C.divider, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: "700", color: C.accent, width: 38, textAlign: "right" },
  revenueAmount: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.divider, marginBottom: 14 },
  revenueAmountLabel: { fontSize: 13, color: C.textSub, fontWeight: "600" },
  revenueAmountValue: { fontSize: 18, fontWeight: "800", color: C.text },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statItem: { flex: 1, alignItems: "center", backgroundColor: C.accentBg, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.accentBorder },
  statValue: { fontSize: 14, fontWeight: "800", color: C.text, marginTop: 5, marginBottom: 2 },
  statLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  statusItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, color: C.textSub, fontWeight: "500" },
  lastBooking: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.divider },
  lastBookingText: { fontSize: 11, color: C.textMuted, fontWeight: "500" },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyText: { fontSize: 15, color: C.textSub, fontWeight: "600" },
});