// app/(admin)/dashboard.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity,
  RefreshControl, Alert, Dimensions, ActivityIndicator, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  pendingRestaurants: number;
  approvedRestaurants: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  todayRevenue: number;
}

const StatCard = ({
  icon, label, value, color, colorBg, onPress,
}: {
  icon: any; label: string; value: string;
  color: string; colorBg: string; onPress?: () => void;
}) => (
  <TouchableOpacity
    style={st.statCard} onPress={onPress} disabled={!onPress} activeOpacity={0.75}
  >
    <View style={[st.statIconWrap, { backgroundColor: colorBg }]}>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>
    <Text style={st.statValue}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
    {onPress && <MaterialIcons name="chevron-right" size={14} color={C.textMuted} style={{ marginTop: 2 }} />}
  </TouchableOpacity>
);

const InfoCard = ({
  icon, label, value, color, colorBg,
}: {
  icon: any; label: string; value: string; color: string; colorBg: string;
}) => (
  <View style={st.infoCard}>
    <View style={[st.infoIconWrap, { backgroundColor: colorBg }]}>
      <MaterialIcons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={st.infoLabel}>{label}</Text>
      <Text style={st.infoValue}>{value}</Text>
    </View>
  </View>
);

const ActionRow = ({
  icon, title, subtitle, color, colorBg, onPress,
}: {
  icon: any; title: string; subtitle: string;
  color: string; colorBg: string; onPress: () => void;
}) => (
  <TouchableOpacity style={st.actionRow} onPress={onPress} activeOpacity={0.75}>
    <View style={[st.actionIconWrap, { backgroundColor: colorBg }]}>
      <MaterialIcons name={icon} size={22} color={color} />
    </View>
    <View style={st.actionContent}>
      <Text style={st.actionTitle}>{title}</Text>
      <Text style={st.actionSubtitle}>{subtitle}</Text>
    </View>
    <MaterialIcons name="chevron-right" size={20} color={C.textMuted} />
  </TouchableOpacity>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={st.sectionCard}>
    <Text style={st.sectionTitle}>{title}</Text>
    {children}
  </View>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, userData } = useAuth();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalRestaurants: 0, pendingRestaurants: 0,
    approvedRestaurants: 0, totalBookings: 0, confirmedBookings: 0,
    totalRevenue: 0, todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getCountFromServer(collection(db, "users"));
      const totalUsers = usersSnapshot.data().count;

      const restaurantsSnapshot = await getDocs(collection(db, "restaurants"));
      let totalRestaurants = 0, pendingRestaurants = 0, approvedRestaurants = 0;
      restaurantsSnapshot.forEach((doc) => {
        totalRestaurants++;
        const status = doc.data().status;
        if (status === "pending") pendingRestaurants++;
        if (status === "approved") approvedRestaurants++;
      });

      const bookingsSnapshot = await getDocs(collection(db, "bookings"));
      let totalBookings = 0, confirmedBookings = 0, totalRevenue = 0, todayRevenue = 0;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      bookingsSnapshot.forEach((doc) => {
        totalBookings++;
        const data = doc.data();
        if (data.status === "confirmed") confirmedBookings++;
        if (data.payment?.amount) {
          totalRevenue += data.payment.amount;
          const bookingDate = data.createdAt?.toDate();
          if (bookingDate && bookingDate >= today) todayRevenue += data.payment.amount;
        }
      });

      setStats({ totalUsers, totalRestaurants, pendingRestaurants, approvedRestaurants, totalBookings, confirmedBookings, totalRevenue, todayRevenue });
    } catch (error) {
      console.error("Error loading stats:", error);
      Alert.alert("Error", "Failed to load dashboard statistics");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); loadStats(); };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/(auth)/landing"); } },
    ]);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading && !refreshing) {
    return (
      <View style={st.loadingContainer}>
        <LinearGradient colors={["#fff7f0", "#fde8c8"]} style={st.loadingInner}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={st.loadingText}>Loading Dashboard...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff2e1" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[st.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={st.headerTopRow}>
            <View>
              <Text style={st.greetingText}>{getGreeting()}</Text>
              <Text style={st.headerTitle}>{String(userData?.fullName || "Admin")}</Text>
            </View>
            <View style={st.headerRight}>
              <View style={st.adminBadgePill}>
                <MaterialIcons name="verified" size={12} color={C.accent} />
                <Text style={st.adminBadgeText}>Admin</Text>
              </View>
              <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <MaterialIcons name="logout" size={18} color={C.error} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* ── Revenue Card ── */}
          <TouchableOpacity
            style={st.revenueCardWrap}
            onPress={() => router.push("/(admin)/revenue-analytics")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#ff7f2a", "#f49b33"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={st.revenueCard}
            >
              <View style={st.revenueTop}>
                <View>
                  <Text style={st.revenueLabelText}>Total Revenue</Text>
                  <Text style={st.revenueValueText}>{formatCurrency(stats.totalRevenue)}</Text>
                </View>
                <View style={st.revenueIconWrap}>
                  <MaterialIcons name="account-balance-wallet" size={28} color={C.white} />
                </View>
              </View>
              <View style={st.revenueDividerLine} />
              <View style={st.revenueBottom}>
                <View style={st.todayRow}>
                  <MaterialIcons name="today" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={st.todayLabelText}>Today</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={st.todayValueText}>{formatCurrency(stats.todayRevenue)}</Text>
                  <MaterialIcons name="arrow-forward-ios" size={14} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Overview Stats ── */}
          <View style={st.quickGrid}>
            <StatCard icon="people" label="Users" value={String(stats.totalUsers)} color={C.blue} colorBg={C.blueBg} onPress={() => router.push("/(admin)/manage-users")} />
            <StatCard icon="restaurant" label="Restaurants" value={String(stats.totalRestaurants)} color={C.green} colorBg={C.greenBg} onPress={() => router.push("/(admin)/manage-restaurants")} />
            <StatCard icon="pending-actions" label="Pending" value={String(stats.pendingRestaurants)} color={C.amber} colorBg={C.amberBg} onPress={() => router.push("/(admin)/pending-approvals")} />
            <StatCard icon="check-circle" label="Approved" value={String(stats.approvedRestaurants)} color={C.purple} colorBg={C.purpleBg} />
          </View>

          {/* ── Bookings ── */}
          <SectionCard title="Bookings">
            <View style={st.infoRow}>
              <InfoCard icon="event" label="Total Bookings" value={String(stats.totalBookings)} color={C.purple} colorBg={C.purpleBg} />
              <InfoCard icon="event-available" label="Confirmed" value={String(stats.confirmedBookings)} color={C.green} colorBg={C.greenBg} />
            </View>
          </SectionCard>

          {/* ── Quick Actions ── */}
          <SectionCard title="Quick Actions">
            <ActionRow icon="pending-actions" title="Pending Approvals" subtitle={`${stats.pendingRestaurants} restaurants awaiting review`} color={C.amber} colorBg={C.amberBg} onPress={() => router.push("/(admin)/pending-approvals")} />
            <ActionRow icon="people" title="Manage Users" subtitle={`${stats.totalUsers} registered users`} color={C.blue} colorBg={C.blueBg} onPress={() => router.push("/(admin)/manage-users")} />
            <ActionRow icon="restaurant" title="All Restaurants" subtitle={`${stats.totalRestaurants} total listings`} color={C.green} colorBg={C.greenBg} onPress={() => router.push("/(admin)/manage-restaurants")} />
          </SectionCard>

          <Text style={st.footer}>© 2025 Dine Time. All Rights Reserved.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loadingInner: { padding: 36, borderRadius: 20, alignItems: "center", gap: 12 },
  loadingText: { fontSize: 15, color: C.textSub, fontWeight: "500" },

  header: { paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 14 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  greetingText: { fontSize: 13, color: C.textSub, fontWeight: "500", marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.text },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  adminBadgePill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.7)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.accentBorder },
  adminBadgeText: { fontSize: 12, fontWeight: "700", color: C.accent },
  logoutBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.errorBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,75,75,0.15)" },

  revenueCardWrap: { marginHorizontal: 14, marginBottom: 14, borderRadius: 20, overflow: "hidden", shadowColor: "#ff7f2a", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  revenueCard: { padding: 20 },
  revenueTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  revenueLabelText: { fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: "600", marginBottom: 6 },
  revenueValueText: { fontSize: 32, fontWeight: "800", color: C.white },
  revenueIconWrap: { width: 54, height: 54, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  revenueDividerLine: { height: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: 14 },
  revenueBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  todayRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  todayLabelText: { fontSize: 14, color: "rgba(255,255,255,0.85)", fontWeight: "500" },
  todayValueText: { fontSize: 18, fontWeight: "700", color: C.white },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 10, marginBottom: 14 },
  statCard: { width: (width - 48) / 2, backgroundColor: C.white, borderRadius: 16, padding: 14, alignItems: "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: C.divider },
  statIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: "800", color: C.text, marginBottom: 2 },
  statLabel: { fontSize: 12, color: C.textMuted, fontWeight: "600" },

  sectionCard: { backgroundColor: C.white, marginHorizontal: 14, marginBottom: 14, borderRadius: 16, paddingTop: 14, paddingBottom: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, overflow: "hidden" },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: C.textMuted, letterSpacing: 1.1, textTransform: "uppercase", paddingHorizontal: 16, marginBottom: 10 },

  infoRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingBottom: 12 },
  infoCard: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.bg, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.divider },
  infoIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  infoLabel: { fontSize: 11, color: C.textMuted, fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: 20, fontWeight: "800", color: C.text },

  actionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: C.divider, gap: 12 },
  actionIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 2 },
  actionSubtitle: { fontSize: 12, color: C.textMuted, fontWeight: "500" },

  footer: { fontSize: 11, color: C.textMuted, textAlign: "center", marginTop: 4, marginBottom: 8 },
});