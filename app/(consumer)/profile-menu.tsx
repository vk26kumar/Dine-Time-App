import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.85;

// ── Warm amber/orange palette matching the reference profile page ──
const C = {
  headerBg: "#fff2e1", // warm beige header (same as reference)
  accent: "#ff7f2a", // primary orange
  accentSoft: "#f49b33", // softer amber
  accentBg: "#fff2e1", // tinted item background
  accentBorder: "#ffd7b0", // warm border
  white: "#FFFFFF",
  bg: "#f8f9fb", // page background
  card: "#FFFFFF",
  text: "#222222",
  textSub: "#666666",
  textMuted: "#999999",
  divider: "#f2f2f2",
  error: "#ff4b4b",
  errorBg: "#fff0f0",
};

export default function ProfileMenu() {
  const router = useRouter();
  const { userData, logout, updateUserProfile } = useAuth();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const closeDrawer = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
      else router.replace("/(consumer)/explore");
    });
  };

  const navigateAndClose = (path: string) => {
    closeDrawer(() => setTimeout(() => router.push(path), 300));
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

  const handleRoleSwitch = () => {
    const newRole =
      userData?.rolePreference === "consumer" ? "owner" : "consumer";
    Alert.alert("Switch Role", `Switch to ${newRole.toUpperCase()} role?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Switch",
        onPress: async () => {
          closeDrawer();
          if (updateUserProfile)
            await updateUserProfile({ rolePreference: newRole });
          const path =
            newRole === "owner"
              ? "/(owner)/my-restaurants"
              : "/(consumer)/explore";
          setTimeout(() => router.replace(path), 300);
        },
      },
    ]);
  };

  const initials = userData?.fullName?.charAt(0).toUpperCase() || "U";

  return (
    <View style={styles.container}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => closeDrawer()}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* ── Profile Header — warm beige like reference ── */}
          <LinearGradient
            colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileHeader}
          >
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              {userData?.profileImage ? (
                <Image
                  source={{ uri: userData.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={["#ff7f2a", "#f49b33"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
              {/* Online dot */}
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.userName}>{userData?.fullName || "Guest"}</Text>
            <Text style={styles.userEmail}>{userData?.email || ""}</Text>

            {/* View Profile pill — same style as reference's helpButton */}
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => navigateAndClose("/(consumer)/profile")}
              activeOpacity={0.8}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
              <MaterialIcons name="arrow-forward" size={14} color={C.accent} />
            </TouchableOpacity>
          </LinearGradient>

          {/* ── Quick Grid — like reference QuickItems ── */}
          <View style={styles.quickGrid}>
            {[
              {
                icon: "event",
                label: "My Bookings",
                path: "/(consumer)/bookings",
              },
              { icon: "favorite-border", label: "Favourites", path: "" },
              {
                icon: "location-on",
                label: "Addresses",
                path: "/(consumer)/location-selector",
              },
              { icon: "payment", label: "Payments", path: "" },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.quickItem}
                activeOpacity={0.75}
                onPress={() =>
                  item.path ? navigateAndClose(item.path) : undefined
                }
              >
                <View style={styles.quickIconWrap}>
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={C.accent}
                  />
                </View>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionDivider} />

          {/* ── Main Menu Options — same style as reference ProfileOption ── */}
          <View style={styles.menuSection}>
            <MenuItem
              icon="event"
              label="My Bookings"
              onPress={() => navigateAndClose("/(consumer)/bookings")}
            />
            <MenuItem
              icon="favorite-border"
              label="Favorites"
              onPress={() => {}}
            />
            <MenuItem
              icon="location-on"
              label="Saved Addresses"
              onPress={() => navigateAndClose("/(consumer)/location-selector")}
            />
            <MenuItem
              icon="payment"
              label="Payment Methods"
              onPress={() => {}}
            />

            {(userData?.rolePreference === "owner" ||
              userData?.rolePreference === "both") && (
              <>
                <View style={styles.itemDivider} />
                <MenuItem
                  icon="store"
                  label="My Restaurants"
                  highlight
                  onPress={() => navigateAndClose("/(owner)/my-restaurants")}
                />
              </>
            )}
          </View>

          <View style={styles.sectionDivider} />

          {/* ── Preferences Section ── */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>PREFERENCES</Text>
            <MenuItem
              icon="notifications-none"
              label="Notifications"
              onPress={() => {}}
            />
            <MenuItem
              icon="help-outline"
              label="Help & Support"
              onPress={() => {}}
            />
            <MenuItem
              icon="info-outline"
              label="About"
              subtitle="Version 1.0.0"
              onPress={() => {}}
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* ── Role Switch Banner — styled like reference membership banner ── */}
          {userData?.rolePreference === "consumer" && (
            <View style={styles.roleBanner}>
              <View style={styles.roleBannerTop}>
                <View style={styles.joinNowBadge}>
                  <Text style={styles.joinNowText}>FOR OWNERS</Text>
                </View>
              </View>
              <Text style={styles.roleBannerTitle}>List Your Restaurant</Text>
              <Text style={styles.roleBannerSub}>
                Start receiving bookings from customers today 🍽️
              </Text>
              <TouchableOpacity
                style={styles.roleSwitchBtn}
                onPress={handleRoleSwitch}
                activeOpacity={0.85}
              >
                <MaterialIcons name="store" size={16} color={C.white} />
                <Text style={styles.roleSwitchBtnText}>Switch to Owner</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Logout — same style as reference ── */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <MaterialIcons name="logout" size={20} color={C.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            © 2025 Dine Time. All Rights Reserved.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Menu Item — mirrors reference ProfileOption ──
const MenuItem = ({
  icon,
  label,
  subtitle,
  badge,
  highlight = false,
  onPress,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  badge?: number;
  highlight?: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.menuItem, highlight && styles.menuItemHighlight]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[styles.menuIconWrap, highlight && styles.menuIconWrapHighlight]}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={highlight ? C.accent : C.accentSoft}
      />
    </View>
    <View style={styles.menuItemContent}>
      <Text
        style={[
          styles.menuItemLabel,
          highlight && styles.menuItemLabelHighlight,
        ]}
      >
        {label}
      </Text>
      {subtitle && <Text style={styles.menuItemSub}>{subtitle}</Text>}
    </View>
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <MaterialIcons name="chevron-right" size={20} color={C.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // ── Drawer ──
  drawer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: C.bg,
    shadowColor: "#000",
    shadowOffset: { width: -3, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },

  // ── Profile Header ──
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  avatarWrap: {
    marginBottom: 14,
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "800",
    color: C.white,
  },
  onlineDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: C.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 13,
    color: C.textSub,
    marginBottom: 14,
  },
  viewProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.accent,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.accent,
  },

  // ── Quick Grid ──
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 18,
    paddingHorizontal: 10,
    backgroundColor: C.white,
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickItem: { alignItems: "center", gap: 6 },
  quickIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: {
    fontSize: 11,
    color: C.text,
    fontWeight: "500",
    textAlign: "center",
  },

  // ── Section separators ──
  sectionDivider: {
    height: 8,
    backgroundColor: C.bg,
  },
  itemDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginHorizontal: 18,
    marginVertical: 4,
  },

  // ── Menu section ──
  menuSection: {
    backgroundColor: C.white,
    paddingVertical: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },

  // ── Menu item ──
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 18,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  menuItemHighlight: {
    backgroundColor: C.accentBg,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(244,155,51,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuIconWrapHighlight: {
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  menuItemContent: { flex: 1 },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: C.text,
  },
  menuItemLabelHighlight: {
    color: C.accent,
    fontWeight: "700",
  },
  menuItemSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.white,
  },

  // ── Role Switch Banner — mirrors reference membership banner ──
  roleBanner: {
    backgroundColor: C.white,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.accentBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleBannerTop: { marginBottom: 8 },
  joinNowBadge: {
    backgroundColor: C.accent,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  joinNowText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  roleBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  roleBannerSub: {
    fontSize: 12,
    color: C.textSub,
    marginBottom: 14,
    lineHeight: 18,
  },
  roleSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  roleSwitchBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.white,
  },

  // ── Logout ──
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 18,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: C.errorBg,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.15)",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.error,
  },

  footer: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 20,
  },
});
