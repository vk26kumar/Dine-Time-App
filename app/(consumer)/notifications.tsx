// app/(consumer)/notifications.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import {
  notificationService,
  AppNotification,
} from "../../services/notificationService";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../config/firebase";

// ── Notification config ───────────────────────────────────────────────────────
const NOTIF_CONFIG: Record<
  AppNotification["type"],
  { icon: any; color: string; bg: string; label: string }
> = {
  booking_confirmed: {
    icon: "check-circle",
    color: "#10B981",
    bg: "#ECFDF5",
    label: "Confirmed",
  },
  booking_cancelled: {
    icon: "cancel",
    color: "#EF4444",
    bg: "#FEF2F2",
    label: "Cancelled",
  },
  booking_completed: {
    icon: "check-circle-outline",
    color: "#6B2FA0",
    bg: "#F5F0FF",
    label: "Completed",
  },
  booking_reminder: {
    icon: "schedule",
    color: "#FF9F43",
    bg: "#FFF8F0",
    label: "Reminder",
  },
  general: {
    icon: "notifications",
    color: "#8A95A3",
    bg: "#F5F6F8",
    label: "General",
  },
};

// ── Time ago helper ───────────────────────────────────────────────────────────
function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Delete all notifications for a user ──────────────────────────────────────
const deleteAllNotifications = async (userId: string): Promise<void> => {
  const snap = await getDocs(
    query(collection(db, "notifications"), where("userId", "==", userId)),
  );
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
};

// ── Delete single notification ────────────────────────────────────────────────
const deleteSingleNotification = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "notifications", id));
};

// ── Notification item ─────────────────────────────────────────────────────────
function NotifItem({
  item,
  onPress,
  onDelete,
}: {
  item: AppNotification;
  onPress: (item: AppNotification) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = NOTIF_CONFIG[item.type] ?? NOTIF_CONFIG.general;

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.notifCardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.8}
      onLongPress={() =>
        Alert.alert("Remove Notification", "Delete this notification?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(item.id),
          },
        ])
      }
    >
      {/* Unread dot */}
      {!item.read && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.notifIconWrap, { backgroundColor: cfg.bg }]}>
        <MaterialIcons name={cfg.icon} size={22} color={cfg.color} />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <View style={styles.notifTopRow}>
          <Text
            style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>
          {item.body}
        </Text>
        <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
          <MaterialIcons name={cfg.icon} size={10} color={cfg.color} />
          <Text style={[styles.typeText, { color: cfg.color }]}>
            {cfg.label}
          </Text>
        </View>
      </View>

      {/* Delete swipe hint */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="close" size={14} color="#C0C4CC" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    if (!userData?.uid) return;
    try {
      const data = await notificationService.getAll(userData.uid);
      setNotifications(data);
    } catch {
      Alert.alert("Error", "Could not load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userData?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePress = async (item: AppNotification) => {
    if (!item.read) {
      await notificationService.markRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
      );
    }
    if (item.data?.bookingId) {
      router.push("/(consumer)/bookings" as any);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userData?.uid || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllRead(userData.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      Alert.alert("Error", "Could not mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    try {
      await deleteSingleNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      Alert.alert("Error", "Could not delete notification.");
    }
  };

  const handleClearAll = () => {
    if (!userData?.uid || notifications.length === 0) return;
    Alert.alert(
      "Clear All Notifications",
      "This will permanently delete all your notifications. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllNotifications(userData.uid);
              setNotifications([]);
            } catch {
              Alert.alert("Error", "Could not clear notifications.");
            }
          },
        },
      ],
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#F5F0FF", "#EDE9FF"]}
        style={styles.emptyIconWrap}
      >
        <MaterialIcons name="notifications-none" size={40} color="#6B2FA0" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>All caught up!</Text>
      <Text style={styles.emptySub}>
        Booking confirmations, cancellations, and reminders will appear here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      {/* ── Header ── */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerOrb1} />
        <View style={styles.headerOrb2} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount} unread</Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.headerActions}>
            {/* Mark all read */}
            <TouchableOpacity
              style={[styles.headerBtn, unreadCount === 0 && { opacity: 0.4 }]}
              onPress={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              activeOpacity={0.8}
            >
              {markingAll ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <MaterialIcons name="done-all" size={18} color="#FFF" />
              )}
            </TouchableOpacity>

            {/* Clear all */}
            <TouchableOpacity
              style={[
                styles.headerBtn,
                notifications.length === 0 && { opacity: 0.4 },
              ]}
              onPress={handleClearAll}
              disabled={notifications.length === 0}
              activeOpacity={0.8}
            >
              <MaterialIcons name="delete-sweep" size={18} color="#FF9F43" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary bar */}
        {!loading && notifications.length > 0 && (
          <View style={styles.summaryBar}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{notifications.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryValue,
                  unreadCount > 0 && { color: "#FF9F43" },
                ]}
              >
                {unreadCount}
              </Text>
              <Text style={styles.summaryLabel}>Unread</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {
                  notifications.filter((n) => n.type === "booking_confirmed")
                    .length
                }
              </Text>
              <Text style={styles.summaryLabel}>Confirmed</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {
                  notifications.filter((n) => n.type === "booking_cancelled")
                    .length
                }
              </Text>
              <Text style={styles.summaryLabel}>Cancelled</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#6B2FA0" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotifItem
              item={item}
              onPress={handlePress}
              onDelete={handleDeleteOne}
            />
          )}
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
                load();
              }}
              colors={["#6B2FA0"]}
              tintColor="#6B2FA0"
            />
          }
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  header: { overflow: "hidden", paddingHorizontal: 16, paddingBottom: 20 },
  headerOrb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(168,85,247,0.2)",
    top: -40,
    right: -20,
  },
  headerOrb2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,159,67,0.1)",
    top: 20,
    right: 70,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  unreadPill: {
    backgroundColor: "rgba(255,159,67,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.5)",
  },
  unreadPillText: { fontSize: 11, fontWeight: "700", color: "#FF9F43" },

  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  summaryBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 4,
  },

  listContent: { padding: 16 },
  separator: { height: 8 },

  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  notifCardUnread: {
    borderColor: "rgba(107,47,160,0.2)",
    backgroundColor: "#FDFCFF",
    shadowOpacity: 0.08,
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    left: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6B2FA0",
  },

  notifIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  notifContent: { flex: 1 },
  notifTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F1B2D",
    flex: 1,
    marginRight: 8,
  },
  notifTitleUnread: { fontWeight: "800" },
  notifTime: {
    fontSize: 10,
    color: "#8A95A3",
    fontWeight: "500",
    flexShrink: 0,
  },
  notifBody: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },

  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: { fontSize: 10, fontWeight: "700" },

  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1B2D",
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 13,
    color: "#8A95A3",
    textAlign: "center",
    lineHeight: 20,
  },
});
