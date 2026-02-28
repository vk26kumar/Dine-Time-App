import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  StatusBar,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const C = {
  headerBg: "#fff2e1",
  accent: "#ff7f2a",
  accentSoft: "#f49b33",
  accentBg: "#fff7f0",
  accentBorder: "#ffd7b0",
  white: "#FFFFFF",
  bg: "#f8f9fb",
  card: "#FFFFFF",
  text: "#222222",
  textSub: "#666666",
  textMuted: "#999999",
  divider: "#f2f2f2",
  error: "#ff4b4b",
  errorBg: "#fff0f0",
};

// ── Sub-components ────────────────────────────────────────────────────────────

const StatItem = ({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: any;
}) => (
  <View style={styles.statItem}>
    <MaterialIcons
      name={icon}
      size={16}
      color={C.accent}
      style={{ marginBottom: 4 }}
    />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const OptionRow = ({
  icon,
  label,
  subtitle,
  onPress,
  danger,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) => (
  <TouchableOpacity
    style={styles.optionRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[styles.optionIconWrap, danger && styles.optionIconWrapDanger]}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? C.error : C.accentSoft}
      />
    </View>
    <View style={styles.optionContent}>
      <Text style={[styles.optionLabel, danger && styles.optionLabelDanger]}>
        {label}
      </Text>
      {subtitle && <Text style={styles.optionSub}>{subtitle}</Text>}
    </View>
    <MaterialIcons name="chevron-right" size={20} color={C.textMuted} />
  </TouchableOpacity>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { logout, userData, updateUserProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userData?.fullName || "");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
          if (updateUserProfile)
            await updateUserProfile({ rolePreference: newRole });
          router.replace(
            newRole === "owner"
              ? "/(owner)/my-restaurants"
              : "/(consumer)/explore",
          );
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    if (updateUserProfile && nameValue.trim()) {
      await updateUserProfile({ fullName: nameValue.trim() });
    }
    setEditingName(false);
  };

  const initials = userData?.fullName?.charAt(0).toUpperCase() || "U";
  const isOwner = userData?.rolePreference === "owner";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerBg} />

          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          >
        {/* ── Header ── */}
        <LinearGradient
          colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          {/* Top row */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity
              style={styles.helpBtn}
              activeOpacity={0.8}
              onPress={() => router.push("/(consumer)/help-support")}
            >
              <Text style={styles.helpBtnText}>Help</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + Info */}
          <Animated.View
            style={[
              styles.avatarSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
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
              <TouchableOpacity
                style={styles.editAvatarBtn}
                activeOpacity={0.8}
              >
                <MaterialIcons name="camera-alt" size={13} color={C.white} />
              </TouchableOpacity>
            </View>

            {/* Editable name */}
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameValue}
                  onChangeText={setNameValue}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  onBlur={handleSaveName}
                />
                <TouchableOpacity onPress={handleSaveName}>
                  <MaterialIcons
                    name="check-circle"
                    size={26}
                    color={C.accent}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameRow}
                onPress={() => setEditingName(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.userName}>
                  {userData?.fullName || "Guest"}
                </Text>
                <MaterialIcons name="edit" size={14} color={C.accentSoft} />
              </TouchableOpacity>
            )}

            <Text style={styles.userEmail}>{userData?.email || ""}</Text>

            {/* Role badge */}
            <View style={styles.roleBadge}>
              <MaterialIcons
                name={isOwner ? "store" : "person"}
                size={11}
                color={C.accent}
              />
              <Text style={styles.roleBadgeText}>
                {isOwner ? "Restaurant Owner" : "Diner"}
              </Text>
            </View>
          </Animated.View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatItem value="12" label="Bookings" icon="event" />
            <View style={styles.statsDivider} />
            <StatItem value="5" label="Favourites" icon="favorite" />
            <View style={styles.statsDivider} />
            <StatItem value="3" label="Reviews" icon="star" />
          </View>
        </LinearGradient>

        {/* ── Membership Banner ── */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerLeft}>
            <View style={styles.joinNowBadge}>
              <Text style={styles.joinNowText}>JOIN NOW</Text>
            </View>
            <Text style={styles.bannerTitle}>
              Unlimited bookings & priority tables!
            </Text>
            <Text style={styles.bannerSub}>
              Unlock exclusive dining benefits 🍽️
            </Text>
          </View>
          <MaterialIcons
            name="workspace-premium"
            size={52}
            color={C.accent}
            style={{ opacity: 0.2 }}
          />
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.quickGrid}>
          {[
            {
              icon: "event",
              label: "My Bookings",
              path: "/(consumer)/bookings",
            },
            { icon: "bar-chart", label: "Performance", path: "" },
            { icon: "favorite", label: "Favourites", path: "" },
            { icon: "notifications", label: "Notifications", path: "" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickItem}
              activeOpacity={0.75}
              onPress={() =>
                item.path ? router.push(item.path as any) : undefined
              }
            >
              <View style={styles.quickIconWrap}>
                <MaterialIcons
                  name={item.icon as any}
                  size={22}
                  color={C.accent}
                />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account ── */}
        <SectionCard title="Account">
          <OptionRow
            icon="person-outline"
            label="Personal Information"
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          />
          <OptionRow
            icon="history"
            label="Booking History"
            onPress={() => router.push("/(consumer)/bookings")}
          />
          <OptionRow
            icon="account-balance-wallet"
            label="Dining Wallet"
            onPress={() =>
             Alert.alert("Coming Soon", "This feature is not available. It will be available soon.")
            }
          />
          <OptionRow
            icon="receipt-long"
            label="Payment History"
            onPress={() =>
              router.push({
                pathname: "/(consumer)/bookings",
                params: { tab: "past" },
              })
            }
          />
          <OptionRow
            icon="local-offer"
            label="Offers & Rewards"
            onPress={() => Alert.alert("No Offers", "No offers for now.")}
          />
        </SectionCard>

        {/* ── Preferences ── */}
        <SectionCard title="Preferences">
          <OptionRow
            icon="notifications-none"
            label="Notifications"
            onPress={() =>
              Alert.alert(
                "Notifications",
                "You will soon be able to manage your notification preferences here."
              )
            }
          />
          <OptionRow
            icon="help-outline"
            label="Help & Support"
            onPress={() => router.push("/(consumer)/help-support")}
          />
          <OptionRow
            icon="info-outline"
            label="About App"
            subtitle="Version 1.0.0"
            onPress={() => router.push("/(consumer)/about-app")}
          />
        </SectionCard>

        {/* ── Role Switch Banner ── */}
        {!isOwner && (
          <View style={styles.roleBannerCard}>
            <View style={styles.roleBannerLeft}>
              <View style={styles.forOwnersBadge}>
                <Text style={styles.forOwnersText}>FOR OWNERS</Text>
              </View>
              <Text style={styles.roleBannerTitle}>List Your Restaurant</Text>
              <Text style={styles.roleBannerSub}>
                Start receiving bookings from customers today 🍽️
              </Text>
            </View>
            <TouchableOpacity
              style={styles.roleSwitchBtn}
              onPress={handleRoleSwitch}
              activeOpacity={0.85}
            >
              <MaterialIcons name="store" size={15} color={C.white} />
              <Text style={styles.roleSwitchBtnText}>Switch</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Logout ── */}
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
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },
  helpBtn: {
    backgroundColor: C.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.accent,
  },
  helpBtnText: { color: C.accent, fontWeight: "600", fontSize: 13 },

  // ── Avatar ──
  avatarSection: { alignItems: "center", marginBottom: 20 },
  avatarWrap: { position: "relative", marginBottom: 12 },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarInitials: { fontSize: 36, fontWeight: "800", color: C.white },
  editAvatarBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.white,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  userName: { fontSize: 22, fontWeight: "700", color: C.text },
  nameInput: {
    fontSize: 20,
    fontWeight: "700",
    color: C.text,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 160,
  },
  userEmail: { fontSize: 13, color: C.textSub, marginBottom: 10 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: C.accent },

  // ── Stats ──
  statsRow: {
    flexDirection: "row",
    backgroundColor: C.white,
    borderRadius: 16,
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: -20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: C.text },
  statLabel: { fontSize: 11, color: C.textSub, marginTop: 2 },
  statsDivider: { width: 1, backgroundColor: C.divider, marginVertical: 4 },

  // ── Banner ──
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    marginHorizontal: 14,
    marginTop: 32,
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
  bannerLeft: { flex: 1 },
  joinNowBadge: {
    backgroundColor: C.accent,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  joinNowText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: C.text,
    marginBottom: 3,
  },
  bannerSub: { fontSize: 12, color: C.textSub },

  // ── Quick Grid ──
  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: C.white,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickItem: { alignItems: "center", gap: 6 },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 11, color: C.text, fontWeight: "500" },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: C.white,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  // ── Option Row ──
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    gap: 12,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(244,155,51,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIconWrapDanger: { backgroundColor: C.errorBg },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: "500", color: C.text },
  optionLabelDanger: { color: C.error },
  optionSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  // ── Role Banner ──
  roleBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.accentBorder,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleBannerLeft: { flex: 1 },
  forOwnersBadge: {
    backgroundColor: C.accent,
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  forOwnersText: {
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
  roleBannerSub: { fontSize: 12, color: C.textSub, lineHeight: 17 },
  roleSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roleSwitchBtnText: { fontSize: 13, fontWeight: "700", color: C.white },

  // ── Logout ──
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 50,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.errorBg,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.15)",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: C.error },

  footer: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 10,
  },
});
