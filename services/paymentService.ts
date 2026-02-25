import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../config/firebase";

interface CreateBookingData {
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  date: Date | string;
  timeSlot: string;
  numberOfGuests: number;
  bookingFeePerPerson: number;
  tableIds: string[];
  specialRequests?: string;
  occasion?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpayOrderId?: string;
}

// Helper — converts anything to a safe Firestore Timestamp
const toFirestoreTimestamp = (date: Date | string | any): Timestamp => {
  if (date instanceof Timestamp) return date;
  if (date instanceof Date && !isNaN(date.getTime()))
    return Timestamp.fromDate(date);
  if (typeof date === "string" || typeof date === "number") {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
  }
  return Timestamp.fromDate(new Date()); // fallback to now
};

// Helper — converts anything to a safe string[]
const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return (value as any[]).map(String);
  if (typeof value === "string" && (value as string).trim())
    return (value as string)
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  return [];
};

export const paymentService = {
  createBookingAfterPayment: async (data: CreateBookingData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in");

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    if (!userData) throw new Error("User profile not found");

    // ── Safe values — nothing undefined ever reaches Firestore ──
    const safeTableIds = toStringArray(data.tableIds);
    const safeDate = toFirestoreTimestamp(data.date);
    const totalAmount =
      Number(data.numberOfGuests) * Number(data.bookingFeePerPerson);

    // Payment sub-object — only include fields that exist
    const payment: Record<string, any> = {
      amount: totalAmount,
      perPersonFee: Number(data.bookingFeePerPerson),
      totalGuests: Number(data.numberOfGuests),
      currency: "INR",
      status: "success",
      paidAt: serverTimestamp(),
      method: "razorpay",
    };
    if (data.razorpayPaymentId)
      payment.razorpayPaymentId = data.razorpayPaymentId;
    if (data.razorpayOrderId) payment.razorpayOrderId = data.razorpayOrderId;
    if (data.razorpaySignature)
      payment.razorpaySignature = data.razorpaySignature;

    // Booking document — every field is an explicit safe type
    const bookingData: Record<string, any> = {
      restaurantId: String(data.restaurantId),
      restaurantName: String(data.restaurantName),
      restaurantAddress: String(data.restaurantAddress),
      restaurantPhone: String(data.restaurantPhone),

      userId: String(user.uid),
      userName: String(userData.fullName || userData.email || ""),
      userPhone: String(userData.phoneNumber || ""),
      userEmail: String(userData.email || ""),

      date: safeDate, // Firestore Timestamp
      timeSlot: String(data.timeSlot),
      numberOfGuests: Number(data.numberOfGuests),
      tableIds: safeTableIds, // string[]

      status: "confirmed",
      payment,

      specialRequests: String(data.specialRequests || ""),
      occasion: String(data.occasion || ""),

      isNonRefundable: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Write booking
    const bookingRef = await addDoc(collection(db, "bookings"), bookingData);
    await updateDoc(bookingRef, { id: bookingRef.id });

    // Update user booking history
    const userSnap = await getDoc(doc(db, "users", user.uid));
    const history: string[] = Array.isArray(userSnap.data()?.bookingHistory)
      ? userSnap.data()!.bookingHistory
      : [];
    await updateDoc(doc(db, "users", user.uid), {
      bookingHistory: [...history, bookingRef.id],
      updatedAt: serverTimestamp(),
    });

    // Increment restaurant bookings count
    await updateDoc(doc(db, "restaurants", data.restaurantId), {
      totalBookings: increment(1),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      bookingId: bookingRef.id,
      message: "Booking confirmed successfully!",
    };
  },

  cancelBooking: async (bookingId: string, cancellationReason: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in");

    const bookingRef = doc(db, "bookings", bookingId);
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (booking.userId !== user.uid)
      throw new Error("You don't have permission to cancel this booking");
    if (booking.status === "cancelled")
      throw new Error("Booking is already cancelled");
    if (booking.status === "completed")
      throw new Error("Cannot cancel a completed booking");

    await updateDoc(bookingRef, {
      status: "cancelled",
      cancellationReason: String(cancellationReason),
      cancelledBy: "user",
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      message: "Booking cancelled. Note: Booking fees are non-refundable.",
    };
  },

  getBookingDetails: async (bookingId: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in");

    const bookingSnap = await getDoc(doc(db, "bookings", bookingId));
    if (!bookingSnap.exists()) throw new Error("Booking not found");

    const booking = bookingSnap.data();
    if (booking.userId !== user.uid)
      throw new Error("You don't have permission to view this booking");

    return booking;
  },
};

export default paymentService;
