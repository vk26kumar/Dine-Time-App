// services/notificationService.ts
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

export interface AppNotification {
  id: string;
  userId: string;
  type:
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_completed"
    | "booking_reminder"
    | "general";
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// ── Safe push token registration ─────────────────────────────────────────────
// Guards against Expo Go which lacks the native ExpoPushTokenManager module.
// This will work correctly in a custom dev build / production build.
const registerPushToken = async (userId: string): Promise<void> => {
  try {
    // Dynamically import so the module load error doesn't crash the whole app
    const ExpoNotifications = await import("expo-notifications");
    const { Platform } = await import("react-native");

    ExpoNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } =
      await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await ExpoNotifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: ExpoNotifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await ExpoNotifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    await updateDoc(doc(db, "users", userId), {
      expoPushToken: token,
      updatedAt: serverTimestamp(),
    });
  } catch (e: any) {
    // Silently fail in Expo Go — push tokens need a custom dev build
    if (
      e?.message?.includes("ExpoPushTokenManager") ||
      e?.message?.includes("native module")
    ) {
      console.log(
        "[Notifications] Push tokens not available in Expo Go. Build a dev client to enable them.",
      );
    } else {
      console.warn("[Notifications] Push token registration failed:", e);
    }
  }
};

export const notificationService = {
  registerPushToken,

  // ── Write a notification to Firestore (works everywhere) ─────────────────
  create: async (
    userId: string,
    type: AppNotification["type"],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> => {
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        type,
        title,
        body,
        data: data ?? {},
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[Notifications] Failed to create notification:", e);
    }
  },

  // ── Fetch all notifications for a user ───────────────────────────────────
  getAll: async (userId: string): Promise<AppNotification[]> => {
    const toNotif = (d: any): AppNotification => {
      const data = d.data();
      return {
        ...data,
        id: d.id,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as AppNotification;
    };

    try {
      // Requires composite index: userId ASC + createdAt DESC
      const snap = await getDocs(
        query(
          collection(db, "notifications"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
        ),
      );
      return snap.docs.map(toNotif);
    } catch (e: any) {
      // Index not built yet — fall back to unordered fetch and sort client-side
      if (e?.code === "failed-precondition" || e?.message?.includes("index")) {
        console.log("[Notifications] Index not ready yet, fetching unordered.");
        try {
          const snap = await getDocs(
            query(
              collection(db, "notifications"),
              where("userId", "==", userId),
            ),
          );
          return snap.docs
            .map(toNotif)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (e2) {
          console.warn("[Notifications] Fallback fetch also failed:", e2);
          return [];
        }
      }
      console.warn("[Notifications] Failed to fetch notifications:", e);
      return [];
    }
  },

  // ── Get unread count ──────────────────────────────────────────────────────
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "notifications"),
          where("userId", "==", userId),
          where("read", "==", false),
        ),
      );
      return snap.size;
    } catch {
      return 0;
    }
  },

  // ── Mark single notification as read ─────────────────────────────────────
  markRead: async (notificationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), { read: true });
    } catch (e) {
      console.warn("[Notifications] Failed to mark read:", e);
    }
  },

  // ── Mark ALL notifications as read ───────────────────────────────────────
  markAllRead: async (userId: string): Promise<void> => {
    try {
      const snap = await getDocs(
        query(
          collection(db, "notifications"),
          where("userId", "==", userId),
          where("read", "==", false),
        ),
      );
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch (e) {
      console.warn("[Notifications] Failed to mark all read:", e);
    }
  },

  // ── Helper: booking confirmed ─────────────────────────────────────────────
  notifyBookingConfirmed: async (
    userId: string,
    restaurantName: string,
    bookingId: string,
    date: Date,
    timeSlot: string,
  ): Promise<void> => {
    const dateStr = date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    await notificationService.create(
      userId,
      "booking_confirmed",
      "Booking Confirmed! 🎉",
      `Your table at ${restaurantName} is confirmed for ${dateStr} at ${timeSlot}.`,
      { bookingId, restaurantName },
    );
  },

  // ── Helper: booking completed ─────────────────────────────────────────────
  notifyBookingCompleted: async (
    userId: string,
    restaurantName: string,
    bookingId: string,
  ): Promise<void> => {
    await notificationService.create(
      userId,
      "booking_completed",
      "Visit Complete! 🍽️",
      `Hope you enjoyed your meal at ${restaurantName}! Leave a review to help others.`,
      { bookingId, restaurantName },
    );
  },

  // ── Helper: booking cancelled ─────────────────────────────────────────────
  notifyBookingCancelled: async (
    userId: string,
    restaurantName: string,
    bookingId: string,
  ): Promise<void> => {
    await notificationService.create(
      userId,
      "booking_cancelled",
      "Booking Cancelled",
      `Your booking at ${restaurantName} has been cancelled. Note: fees are non-refundable.`,
      { bookingId, restaurantName },
    );
  },

  // ── Helper: no-show ───────────────────────────────────────────────────────
  notifyBookingNoShow: async (
    userId: string,
    restaurantName: string,
    bookingId: string,
  ): Promise<void> => {
    await notificationService.create(
      userId,
      "general",
      "Missed Booking 😔",
      `You were marked as no-show for your booking at ${restaurantName}. Please remember to cancel in advance next time.`,
      { bookingId, restaurantName },
    );
  },
};

export default notificationService;
