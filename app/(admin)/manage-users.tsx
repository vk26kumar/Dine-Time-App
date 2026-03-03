// app/(admin)/manage-users.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, StatusBar, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { User } from "../../types";
import { LinearGradient } from "expo-linear-gradient";

const C = {
  accent: "#ff7f2a", accentSoft: "#f49b33", accentBg: "#fff7f0",
  accentBorder: "#ffd7b0", white: "#FFFFFF", bg: "#f8f9fb",
  text: "#222222", textSub: "#666666", textMuted: "#999999",
  divider: "#f2f2f2", error: "#ff4b4b", errorBg: "#fff0f0",
  purple: "#8B5CF6", purpleBg: "#EDE9FE",
  amber: "#F59E0B", amberBg: "#FFFBEB",
};

const getRoleIcon = (role?: string) => {
  switch (role) { case "owner": return "store"; case "both": return "people"; default: return "restaurant-menu"; }
};
const getRoleLabel = (role?: string) => {
  switch (role) { case "owner": return "Restaurant Owner"; case "both": return "Owner & Consumer"; default: return "Consumer"; }
};

const InfoRow = ({ icon, text }: { icon: "email" | "phone" | "location-on"; text: string }) => (
  <View style={st.infoRow}>
    <MaterialIcons name={icon} size={15} color={C.textMuted} />
    <Text style={st.infoText} numberOfLines={1}>{text}</Text>
  </View>
);

const StatItem = ({ icon, value, label }: { icon: "store" | "event"; value: number; label: string }) => (
  <View style={st.statItem}>
    <MaterialIcons name={icon} size={16} color={C.accent} />
    <Text style={st.statValue}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </View>
);

export default function ManageUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { filterUsers(); }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "users"));
      const usersList: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersList.push({ ...data, createdAt: data.createdAt?.toDate(), updatedAt: data.updatedAt?.toDate() } as User);
      });
      setUsers(usersList);
    } catch (error) { console.error("Error loading users:", error); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) { setFilteredUsers(users); return; }
    const query = searchQuery.toLowerCase();
    setFilteredUsers(users.filter((user) =>
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phoneNumber?.includes(query)
    ));
  };

  const handleRefresh = () => { setRefreshing(true); loadUsers(); };

  const handleBanUser = async (user: User) => {
    Alert.alert("Ban User", `Are you sure you want to ban ${user.fullName}? They will not be able to access the app.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Ban", style: "destructive", onPress: async () => {
        try {
          await updateDoc(doc(db, "users", user.uid), { isBanned: true, updatedAt: new Date() });
          Alert.alert("Success", "User has been banned"); loadUsers();
        } catch (error) { Alert.alert("Error", "Failed to ban user"); }
      }},
    ]);
  };

  const handleDeleteUser = async (user: User) => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${user.fullName}? This will remove their account data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete the Firestore document
              await deleteDoc(doc(db, "users", user.uid));
              Alert.alert("Success", "User has been deleted");
              loadUsers();
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to delete user");
            }
          },
        },
      ]
    );
  };

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.isAdmin).length,
  };

  const renderUser = ({ item }: { item: User }) => {
    const initials = item.fullName?.charAt(0).toUpperCase() || "U";
    return (
      <View style={st.userCard}>
        <View style={st.cardHeader}>
          <LinearGradient colors={["#ff7f2a", "#f49b33"]} style={st.userAvatar}>
            <Text style={st.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={st.userMainInfo}>
            <View style={st.nameRow}>
              <Text style={st.userName} numberOfLines={1}>{item.fullName}</Text>
              {item.isAdmin && (
                <View style={st.adminBadge}>
                  <MaterialIcons name="verified" size={11} color={C.purple} />
                  <Text style={st.adminText}>Admin</Text>
                </View>
              )}
            </View>
            <View style={st.roleBadge}>
              <MaterialIcons name={getRoleIcon(item.rolePreference) as any} size={13} color={C.accent} />
              <Text style={st.roleText}>{getRoleLabel(item.rolePreference)}</Text>
            </View>
          </View>
        </View>
        <View style={st.cardBody}>
          <InfoRow icon="email" text={item.email} />
          <InfoRow icon="phone" text={item.phoneNumber || "No phone number"} />
          {item.location && <InfoRow icon="location-on" text={item.location.split(",")[0]} />}
        </View>
        {(item.ownedRestaurants?.length || item.bookingHistory?.length) ? (
          <View style={st.statsSection}>
            {item.ownedRestaurants && item.ownedRestaurants.length > 0 && <StatItem icon="store" value={item.ownedRestaurants.length} label="Restaurants" />}
            {item.bookingHistory && item.bookingHistory.length > 0 && <StatItem icon="event" value={item.bookingHistory.length} label="Bookings" />}
          </View>
        ) : null}
        {!item.isAdmin && (
          <>
            <View style={st.divider} />
            <View style={st.actions}>
              <TouchableOpacity style={st.banButton} onPress={() => handleBanUser(item)} activeOpacity={0.7}>
                <MaterialIcons name="block" size={18} color={C.amber} /><Text style={st.banText}>Ban User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.deleteButton} onPress={() => handleDeleteUser(item)} activeOpacity={0.7}>
                <MaterialIcons name="delete" size={18} color={C.error} /><Text style={st.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={st.emptyContainer}>
      <LinearGradient colors={["#fff7f0", "#fde8c8"]} style={st.emptyIconCircle}>
        <MaterialIcons name="people-outline" size={48} color={C.accent} />
      </LinearGradient>
      <Text style={st.emptyTitle}>{searchQuery ? "No Users Found" : "No Users Yet"}</Text>
      <Text style={st.emptySubtitle}>{searchQuery ? `No results for "${searchQuery}"` : "User accounts will appear here"}</Text>
    </View>
  );

  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff2e1" />
      <LinearGradient colors={["#fff2e1", "#fde8c8", "#fff2e1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[st.header, { paddingTop: insets.top + 12 }]}>
        <View style={st.headerTopRow}>
          <View>
            <Text style={st.headerTitle}>Manage Users</Text>
            <Text style={st.headerSubtitle}>{counts.total} total users · {counts.admins} admins</Text>
          </View>
          <View style={st.countBadgePill}>
            <MaterialIcons name="people" size={13} color={C.accent} />
            <Text style={st.countBadgeText}>{counts.total}</Text>
          </View>
        </View>
        <View style={st.searchBar}>
          <MaterialIcons name="search" size={20} color={C.textMuted} />
          <TextInput style={st.searchInput} placeholder="Search by name, email, or phone..." value={searchQuery}
            onChangeText={setSearchQuery} placeholderTextColor={C.textMuted} />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
      {loading ? (
        <View style={st.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={st.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList data={filteredUsers} renderItem={renderUser} keyExtractor={(item) => item.uid}
          contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.accent} />}
          ListEmptyComponent={renderEmpty} />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 4 },
  headerTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: C.text, marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: C.textSub, fontWeight: "500" },
  countBadgePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.7)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.accentBorder },
  countBadgeText: { fontSize: 13, fontWeight: "700", color: C.accent },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, gap: 10, borderWidth: 1, borderColor: C.accentBorder },
  searchInput: { flex: 1, fontSize: 14, color: C.text, fontWeight: "500" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  listContent: { padding: 14, paddingBottom: 110 },
  userCard: { backgroundColor: C.white, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: "hidden", borderWidth: 1, borderColor: C.divider },
  cardHeader: { flexDirection: "row", padding: 14, gap: 12 },
  userAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 22, fontWeight: "800", color: C.white },
  userMainInfo: { flex: 1, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  userName: { fontSize: 16, fontWeight: "800", color: C.text, flex: 1 },
  adminBadge: { flexDirection: "row", alignItems: "center", backgroundColor: C.purpleBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 3 },
  adminText: { fontSize: 10, fontWeight: "700", color: C.purple },
  roleBadge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: C.accentBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: C.accentBorder },
  roleText: { fontSize: 11, fontWeight: "700", color: C.accent },
  cardBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 7 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 12, color: C.textSub, fontWeight: "500", flex: 1 },
  statsSection: { flexDirection: "row", paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: C.accentBg, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: C.accentBorder },
  statValue: { fontSize: 14, fontWeight: "800", color: C.text },
  statLabel: { fontSize: 11, fontWeight: "600", color: C.textSub },
  divider: { height: 1, backgroundColor: C.divider, marginHorizontal: 14 },
  actions: { flexDirection: "row", padding: 14, gap: 10 },
  banButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.amberBg, paddingVertical: 11, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: "#FEF3C7" },
  banText: { fontSize: 13, fontWeight: "700", color: C.amber },
  deleteButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.errorBg, paddingVertical: 11, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: "rgba(255,75,75,0.15)" },
  deleteText: { fontSize: 13, fontWeight: "700", color: C.error },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 70, paddingHorizontal: 40 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.text, marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: C.textSub, textAlign: "center", lineHeight: 20 },
});