import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { Restaurant } from "../../types";

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; icon: any; label: string }
> = {
  approved: {
    color: "#10B981",
    bg: "#ECFDF5",
    icon: "check-circle",
    label: "Live",
  },
  pending: {
    color: "#FF9F43",
    bg: "#FFF8F0",
    icon: "schedule",
    label: "Pending",
  },
  rejected: {
    color: "#EF4444",
    bg: "#FEF2F2",
    icon: "cancel",
    label: "Rejected",
  },
  suspended: {
    color: "#8A95A3",
    bg: "#F5F6F8",
    icon: "pause-circle",
    label: "Suspended",
  },
};

export default function MyRestaurantsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, [user]);

  const loadRestaurants = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "restaurants"),
        where("ownerId", "==", user.uid),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);
      const list: Restaurant[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          approvedAt: data.approvedAt?.toDate(),
        } as Restaurant);
      });
      setRestaurants(list);
    } catch (error) {
      console.error("Error loading restaurants:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/landing");
        },
      },
    ]);
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => {
    const status = item.status || "pending";
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => console.log("open:", item.id)}
        activeOpacity={0.93}
      >
        {/* ── Hero image ── */}
        <View style={styles.imageWrap}>
          <Image
            source={{
              uri:
                item?.images?.coverImage ||
                "https://via.placeholder.com/400x200.png?text=No+Image",
            }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* dark gradient so name is readable */}
          <LinearGradient
            colors={["transparent", "rgba(10,5,20,0.82)"]}
            style={styles.imageGrad}
          />

          {/* status pill — top right */}
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
            <Text style={[styles.statusPillText, { color: cfg.color }]}>
              {cfg.label}
            </Text>
          </View>

          {/* price badge — top left */}
          {item.bookingFeePerPerson != null && (
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>
                {item.bookingFeePerPerson === 0
                  ? "FREE"
                  : `₹${item.bookingFeePerPerson}/person`}
              </Text>
            </View>
          )}

          {/* name + address overlaid on image */}
          <View style={styles.nameOverlay}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name || "Unnamed Restaurant"}
            </Text>
            {item.address?.city ? (
              <View style={styles.addressRow}>
                <MaterialIcons
                  name="place"
                  size={11}
                  color="rgba(255,255,255,0.65)"
                />
                <Text style={styles.addressText}>
                  {item.address.city}
                  {item.address.state ? `, ${item.address.state}` : ""}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Stats strip ── */}
        <View style={styles.statsStrip}>
          <StatCell
            icon="event"
            value={item.totalBookings ?? 0}
            label="Bookings"
            color="#6B2FA0"
          />
          <View style={styles.cellDivider} />
          <StatCell
            icon="star"
            value={item.averageRating ? item.averageRating.toFixed(1) : "—"}
            label="Rating"
            color="#FF9F43"
          />
          <View style={styles.cellDivider} />
          <StatCell
            icon="people"
            value={item.totalCapacity ?? "—"}
            label="Seats"
            color="#FF5A5F"
          />
          <View style={styles.cellDivider} />
          <StatCell
            icon="reviews"
            value={item.totalReviews ?? 0}
            label="Reviews"
            color="#10B981"
          />
        </View>

        {/* ── Cuisine tags ── */}
        {item.cuisine && item.cuisine.length > 0 && (
          <View style={styles.tagsRow}>
            {item.cuisine.slice(0, 4).map((c) => (
              <View key={c} style={styles.tag}>
                <Text style={styles.tagText}>{c}</Text>
              </View>
            ))}
            {item.cuisine.length > 4 && (
              <View style={[styles.tag, styles.tagMore]}>
                <Text style={[styles.tagText, { color: "#8A95A3" }]}>
                  +{item.cuisine.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Rejection reason ── */}
        {status === "rejected" && item.rejectionReason ? (
          <View style={styles.rejectionBox}>
            <MaterialIcons name="error-outline" size={13} color="#EF4444" />
            <Text style={styles.rejectionText} numberOfLines={2}>
              {item.rejectionReason}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E"]}
        style={styles.emptyIconWrap}
      >
        <MaterialIcons name="store" size={36} color="rgba(255,255,255,0.6)" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Restaurants Yet</Text>
      <Text style={styles.emptySub}>
        Add your first restaurant to start receiving bookings
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(owner)/register-restaurant/step1")}
        activeOpacity={0.85}
        style={styles.addBtnWrap}
      >
        <LinearGradient
          colors={["#FF5A5F", "#FF9F43"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addBtn}
        >
          <MaterialIcons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Restaurant</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const liveCount = restaurants.filter((r) => r.status === "approved").length;
  const pendingCount = restaurants.filter((r) => r.status === "pending").length;

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

        {/* title row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>My Restaurants</Text>
            <Text style={styles.headerSub}>
              {restaurants.length}{" "}
              {restaurants.length === 1 ? "restaurant" : "restaurants"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {restaurants.length > 0 && (
              <TouchableOpacity
                style={styles.addIconBtn}
                onPress={() =>
                  router.push("/(owner)/register-restaurant/step1")
                }
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#FF5A5F", "#FF9F43"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addIconBtnGrad}
                >
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.logoutIconBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* summary pills */}
        {restaurants.length > 0 && (
          <View style={styles.summaryRow}>
            <SummaryPill value={liveCount} label="Live" color="#10B981" />
            <SummaryPill value={pendingCount} label="Pending" color="#FF9F43" />
            <SummaryPill
              value={restaurants.length}
              label="Total"
              color="#FFFFFF"
            />
          </View>
        )}

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF5A5F" />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          renderItem={renderRestaurant}
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
                loadRestaurants();
              }}
              colors={["#FF5A5F"]}
              tintColor="#FF5A5F"
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatCell = ({
  icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: string | number;
  label: string;
  color: string;
}) => (
  <View style={styles.statCell}>
    <View style={[styles.statIconWrap, { backgroundColor: color + "18" }]}>
      <MaterialIcons name={icon} size={13} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SummaryPill = ({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) => (
  <View style={styles.summaryPill}>
    <Text style={[styles.summaryPillValue, { color }]}>{value}</Text>
    <Text style={styles.summaryPillLabel}>{label}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

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
  headerRow: {
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
  headerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 3,
    fontWeight: "500",
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  addIconBtn: { borderRadius: 12, overflow: "hidden" },
  addIconBtnGrad: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  summaryPill: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  summaryPillValue: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  summaryPillLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginTop: 2,
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

  list: { padding: 16, gap: 14 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },

  // Image
  imageWrap: { width: "100%", height: 165, position: "relative" },
  image: { width: "100%", height: "100%", backgroundColor: "#F5F6F8" },
  imageGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75%",
  },

  statusPill: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  pricePill: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pricePillText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

  nameOverlay: { position: "absolute", bottom: 12, left: 14, right: 80 },
  nameText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  addressText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },

  // Stats strip
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F6F8",
  },
  statCell: { flex: 1, alignItems: "center", gap: 4 },
  statIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: { fontSize: 14, fontWeight: "800", color: "#0F1B2D" },
  statLabel: {
    fontSize: 9,
    color: "#8A95A3",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  cellDivider: { width: 1, height: 32, backgroundColor: "#EEF0F4" },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tag: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5A5F18",
  },
  tagMore: { backgroundColor: "#F5F6F8", borderColor: "#EEF0F4" },
  tagText: { fontSize: 11, fontWeight: "600", color: "#FF5A5F" },

  // Rejection
  rejectionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FEF2F2",
    margin: 12,
    marginTop: 0,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EF444420",
  },
  rejectionText: { flex: 1, fontSize: 12, color: "#EF4444", lineHeight: 17 },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    gap: 14,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0F1B2D" },
  emptySub: {
    fontSize: 13,
    color: "#8A95A3",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  addBtnWrap: { borderRadius: 14, overflow: "hidden" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  addBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
