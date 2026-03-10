// app/(admin)/manage-restaurants.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { Restaurant } from "../../types";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const C = {
  accent: "#ff7f2a",
  accentSoft: "#f49b33",
  accentBg: "#fff7f0",
  accentBorder: "#ffd7b0",
  white: "#FFFFFF",
  bg: "#f8f9fb",
  text: "#222222",
  textSub: "#666666",
  textMuted: "#999999",
  divider: "#f2f2f2",
  error: "#ff4b4b",
  errorBg: "#fff0f0",
  green: "#10B981",
  greenBg: "#D1FAE5",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "approved":
      return { color: C.green, bg: C.greenBg, icon: "check-circle" as const };
    case "pending":
      return { color: C.amber, bg: C.amberBg, icon: "schedule" as const };
    case "rejected":
      return { color: C.error, bg: C.errorBg, icon: "cancel" as const };
    case "suspended":
      return { color: C.textMuted, bg: C.divider, icon: "block" as const };
    default:
      return { color: C.textMuted, bg: C.bg, icon: "help-outline" as const };
  }
};

const InfoItem = ({
  icon,
  text,
  highlight,
}: {
  icon: "person-outline" | "place" | "event" | "star";
  text: string;
  highlight?: boolean;
}) => {
  if (!text || text === "undefined" || text === "null" || text.trim() === "")
    return null;
  return (
    <View style={st.infoItem}>
      <MaterialIcons
        name={icon}
        size={15}
        color={highlight ? C.amber : C.textMuted}
      />
      <Text style={[st.infoText, highlight && st.infoTextHighlight]}>
        {String(text)}
      </Text>
    </View>
  );
};

const FilterChip = ({
  label,
  count,
  active,
  onPress,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  color?: string;
}) => {
  const activeColor = color || C.accent;
  return (
    <TouchableOpacity
      style={[
        st.filterChip,
        active
          ? { backgroundColor: activeColor }
          : {
              backgroundColor: C.white,
              borderColor: C.divider,
              borderWidth: 1,
            },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[st.filterChipLabel, { color: active ? C.white : C.textSub }]}
      >
        {label}
      </Text>
      <View
        style={[
          st.filterChipBadge,
          { backgroundColor: active ? "rgba(255,255,255,0.25)" : C.accentBg },
        ]}
      >
        <Text
          style={[
            st.filterChipCount,
            { color: active ? C.white : C.accentSoft },
          ]}
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function ManageRestaurantsScreen() {
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "approved" | "pending" | "rejected" | "suspended"
  >("all");

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "restaurants"));
      const restaurantsList: Restaurant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        restaurantsList.push({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
          approvedAt: data.approvedAt?.toDate?.(),
        } as Restaurant);
      });
      setRestaurants(restaurantsList);
    } catch (error) {
      console.error("Error loading restaurants:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRestaurants();
  };

  const handleSuspend = async (restaurant: Restaurant) => {
    Alert.alert(
      "Suspend Restaurant",
      `Are you sure you want to suspend "${restaurant.name}"? It will be hidden from users.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Suspend",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "restaurants", restaurant.id), {
                status: "suspended",
                updatedAt: new Date(),
              });
              Alert.alert("Success", "Restaurant suspended");
              loadRestaurants();
            } catch (error) {
              Alert.alert("Error", "Failed to suspend restaurant");
            }
          },
        },
      ],
    );
  };

  const handleUnsuspend = async (restaurant: Restaurant) => {
    Alert.alert(
      "Unsuspend Restaurant",
      `Are you sure you want to unsuspend "${restaurant.name}"? It will be visible to users again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unsuspend",
          style: "default",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "restaurants", restaurant.id), {
                status: "approved",
                updatedAt: new Date(),
              });
              Alert.alert("Success", "Restaurant unsuspended and approved");
              loadRestaurants();
            } catch (error) {
              Alert.alert("Error", "Failed to unsuspend restaurant");
            }
          },
        },
      ],
    );
  };

  const handleDelete = async (restaurant: Restaurant) => {
    Alert.alert(
      "Delete Restaurant",
      `Are you sure you want to permanently delete "${restaurant.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "restaurants", restaurant.id));
              Alert.alert("Success", "Restaurant deleted");
              loadRestaurants();
            } catch (error) {
              Alert.alert("Error", "Failed to delete restaurant");
            }
          },
        },
      ],
    );
  };

  const getFilteredRestaurants = () =>
    filter === "all"
      ? restaurants
      : restaurants.filter((r) => r.status === filter);

  const getStatusCounts = () => ({
    all: restaurants.length,
    approved: restaurants.filter((r) => r.status === "approved").length,
    pending: restaurants.filter((r) => r.status === "pending").length,
    rejected: restaurants.filter((r) => r.status === "rejected").length,
    suspended: restaurants.filter((r) => r.status === "suspended").length,
  });

  const counts = getStatusCounts();
  const filteredRestaurants = getFilteredRestaurants();

  const renderRestaurant = ({ item }: { item: Restaurant }) => {
    const statusConfig = getStatusConfig(item.status || "pending");
    return (
      <View style={st.card}>
        <View style={st.imageContainer}>
          <Image
            source={
              item?.images?.coverImage
                ? { uri: item.images.coverImage }
                : require("../../assets/Rest.jpg")
            }
            style={st.cardImage}
            resizeMode="cover"
          />
          <View style={[st.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <MaterialIcons
              name={statusConfig.icon}
              size={13}
              color={statusConfig.color}
            />
            <Text style={[st.statusText, { color: statusConfig.color }]}>
              {String(item.status || "pending").toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={st.cardContent}>
          <Text style={st.cardTitle} numberOfLines={1}>
            {String(item.name || "Unnamed Restaurant")}
          </Text>
          <View style={st.infoSection}>
            {item.ownerName?.trim() ? (
              <InfoItem icon="person-outline" text={String(item.ownerName)} />
            ) : null}
            {item.address?.city?.trim() ? (
              <InfoItem
                icon="place"
                text={`${String(item.address.city)}${item.address.state ? ", " + String(item.address.state) : ""}`}
              />
            ) : null}
            {item.totalBookings !== undefined && item.totalBookings !== null ? (
              <InfoItem
                icon="event"
                text={`${String(item.totalBookings)} bookings`}
              />
            ) : null}
            {item.averageRating && item.averageRating > 0 ? (
              <InfoItem
                icon="star"
                text={`${String(item.averageRating.toFixed(1))} rating`}
                highlight
              />
            ) : null}
          </View>
          <View style={st.divider} />
          <View style={st.actions}>
            {item.status === "suspended" ? (
              <TouchableOpacity
                style={st.unsuspendButton}
                onPress={() => handleUnsuspend(item)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="check-circle" size={18} color={C.green} />
                <Text style={st.unsuspendText}>Unsuspend</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={st.suspendButton}
                onPress={() => handleSuspend(item)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="block" size={18} color={C.amber} />
                <Text style={st.suspendText}>Suspend</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={st.deleteButton}
              onPress={() => handleDelete(item)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="delete" size={18} color={C.error} />
              <Text style={st.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={st.emptyContainer}>
      <LinearGradient
        colors={["#fff7f0", "#fde8c8"]}
        style={st.emptyIconCircle}
      >
        <MaterialIcons name="restaurant" size={48} color={C.accent} />
      </LinearGradient>
      <Text style={st.emptyTitle}>No Restaurants Found</Text>
      <Text style={st.emptySubtitle}>
        {filter === "all"
          ? "No restaurants have been added yet"
          : `No ${filter} restaurants at the moment`}
      </Text>
    </View>
  );

  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff2e1" />
      <LinearGradient
        colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[st.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={st.headerTitle}>All Restaurants</Text>
        <Text style={st.headerSubtitle}>
          Manage and monitor all restaurant listings
        </Text>
        <View style={st.filterRow}>
          <FilterChip
            label="All"
            count={counts.all}
            active={filter === "all"}
            onPress={() => setFilter("all")}
            color={C.accent}
          />
          <FilterChip
            label="Approved"
            count={counts.approved}
            active={filter === "approved"}
            onPress={() => setFilter("approved")}
            color={C.green}
          />
          <FilterChip
            label="Pending"
            count={counts.pending}
            active={filter === "pending"}
            onPress={() => setFilter("pending")}
            color={C.amber}
          />
          <FilterChip
            label="Rejected"
            count={counts.rejected}
            active={filter === "rejected"}
            onPress={() => setFilter("rejected")}
            color={C.error}
          />
          <FilterChip
            label="Suspended"
            count={counts.suspended}
            active={filter === "suspended"}
            onPress={() => setFilter("suspended")}
            color={C.textMuted}
          />
        </View>
      </LinearGradient>
      {loading ? (
        <View style={st.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={st.loadingText}>Loading restaurants...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.accent}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: C.textSub,
    fontWeight: "500",
    marginBottom: 14,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  filterChipLabel: { fontSize: 12, fontWeight: "700" },
  filterChipBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  filterChipCount: { fontSize: 10, fontWeight: "800" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  listContent: { padding: 14, paddingBottom: 110 },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.divider,
  },
  imageContainer: { position: "relative", width: "100%", height: 160 },
  cardImage: { width: "100%", height: "100%", backgroundColor: C.divider },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  cardContent: { padding: 14 },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    marginBottom: 10,
  },
  infoSection: { gap: 7 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  infoText: { fontSize: 13, color: C.textSub, fontWeight: "500", flex: 1 },
  infoTextHighlight: { color: C.amber, fontWeight: "700" },
  divider: { height: 1, backgroundColor: C.divider, marginVertical: 12 },
  actions: { flexDirection: "row", gap: 10 },
  suspendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.amberBg,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  suspendText: { fontSize: 13, fontWeight: "700", color: C.amber },
  unsuspendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.greenBg,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  unsuspendText: { fontSize: 13, fontWeight: "700", color: C.green },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.errorBg,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.15)",
  },
  deleteText: { fontSize: 13, fontWeight: "700", color: C.error },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
  },
});
