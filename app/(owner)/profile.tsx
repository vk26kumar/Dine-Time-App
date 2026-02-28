import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";

const MENU_ITEMS = [
  {
    icon: "restaurant-menu",
    label: "Book as Consumer",
    sub: "Switch to booking mode",
    action: "switch",
  },
  {
    icon: "settings",
    label: "Settings",
    sub: "App preferences",
    action: "settings",
  },
  {
    icon: "help-outline",
    label: "Help & Support",
    sub: "Get assistance",
    action: "help",
  },
];

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { userData, logout, updateUserProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const initials = userData?.fullName?.charAt(0).toUpperCase() || "O";

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

  const handleSwitchToConsumer = () => {
    Alert.alert(
      "Switch to Consumer",
      "Switch to consumer mode to book restaurants?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            try {
              if (updateUserProfile) {
                await updateUserProfile({
                  rolePreference:
                    userData?.rolePreference === "both" ? "both" : "consumer",
                });
              }
              router.replace("/(consumer)/explore");
            } catch {
              Alert.alert("Error", "Failed to switch role.");
            }
          },
        },
      ],
    );
  };

  const handleAction = (action: string) => {
    if (action === "switch") {
      handleSwitchToConsumer();
    }

    if (action === "help") {
      router.push("/(owner)/help-support");
    }

    if (action === "settings") {
      Alert.alert("Settings", "Settings screen coming soon.");
    }
  };

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
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.ownerBadge}>
            <MaterialIcons name="store" size={11} color="#FF9F43" />
            <Text style={styles.ownerBadgeText}>Owner</Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={["#FF5A5F", "#FF9F43"]} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <Text style={styles.userName}>
            {userData?.fullName || "Restaurant Owner"}
          </Text>
          <Text style={styles.userEmail}>{userData?.email || ""}</Text>
          {userData?.phoneNumber ? (
            <Text style={styles.userPhone}>{userData.phoneNumber}</Text>
          ) : null}
        </View>

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu */}
        <View style={styles.card}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.action}
              style={[
                styles.menuItem,
                i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
              ]}
              onPress={() => handleAction(item.action)}
              activeOpacity={0.75}
            >
              <View style={styles.menuIconWrap}>
                <MaterialIcons
                  name={item.icon as any}
                  size={18}
                  color="#FF5A5F"
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#C4CAD4" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutWrap}
        >
          <View style={styles.logoutBtn}>
            <MaterialIcons name="logout" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footer}>
          © 2025 Dine Time. All Rights Reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  header: {
    overflow: "hidden",
    paddingHorizontal: 20,
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
    top: 30,
    right: 80,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,159,67,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.3)",
  },
  ownerBadgeText: { fontSize: 11, fontWeight: "700", color: "#FF9F43" },

  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { fontSize: 32, fontWeight: "900", color: "#FFFFFF" },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  userPhone: { fontSize: 13, color: "rgba(255,255,255,0.5)" },

  accentBar: { flexDirection: "row", height: 3 },
  accentSeg: { flex: 1 },

  scroll: { padding: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#EEF0F4" },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  menuSub: { fontSize: 11, color: "#8A95A3", marginTop: 2 },

  logoutWrap: { marginBottom: 20 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF444420",
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#EF4444" },

  footer: { fontSize: 11, color: "#C4CAD4", textAlign: "center" },
});
