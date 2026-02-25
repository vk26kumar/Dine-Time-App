import { useState } from "react";
import RazorpayCheckout from "react-native-razorpay";
import { Alert } from "react-native";
import paymentService from "../services/paymentService";

interface InitiatePaymentProps {
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
  onSuccess: (bookingId: string) => void;
  onError: (error: string) => void;
}

export const useRazorpayCheckout = () => {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async (props: InitiatePaymentProps) => {
    const {
      restaurantId,
      restaurantName,
      restaurantAddress,
      restaurantPhone,
      date,
      timeSlot,
      numberOfGuests,
      bookingFeePerPerson,
      tableIds,
      specialRequests,
      occasion,
      onSuccess,
      onError,
    } = props;

    try {
      setLoading(true);

      const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error("Razorpay key not configured");

      // Safe tableIds — always string[]
      const rawTables = tableIds as unknown;
      const safeTableIds: string[] = Array.isArray(rawTables)
        ? (rawTables as any[]).map(String)
        : typeof rawTables === "string" && (rawTables as string).trim()
          ? (rawTables as string)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const totalAmount = Number(numberOfGuests) * Number(bookingFeePerPerson);
      const amountInPaise = Math.round(totalAmount * 100);

      // ── Open Razorpay ──
      // notes must be Record<string, string> only — no numbers, no arrays, no undefined
      const paymentResult = await RazorpayCheckout.open({
        name: "DineTime",
        description: `Table booking at ${restaurantName}`,
        currency: "INR",
        key: razorpayKey,
        amount: amountInPaise,
        theme: { color: "#FF5A5F" },
      });

      // ── Payment succeeded — create booking ──
      const bookingResult = await paymentService.createBookingAfterPayment({
        restaurantId,
        restaurantName,
        restaurantAddress,
        restaurantPhone,
        date,
        timeSlot,
        numberOfGuests,
        bookingFeePerPerson,
        tableIds: safeTableIds,
        specialRequests: specialRequests || "",
        occasion: occasion || "",
        // Only pass Razorpay fields if they exist — undefined crashes Firestore
        ...(paymentResult.razorpay_payment_id && {
          razorpayPaymentId: paymentResult.razorpay_payment_id,
        }),
        ...(paymentResult.razorpay_order_id && {
          razorpayOrderId: paymentResult.razorpay_order_id,
        }),
        ...(paymentResult.razorpay_signature && {
          razorpaySignature: paymentResult.razorpay_signature,
        }),
      });

      Alert.alert("Booking Confirmed! 🎉", bookingResult.message, [
        {
          text: "View Booking",
          onPress: () => onSuccess(bookingResult.bookingId),
        },
      ]);
    } catch (error: any) {
      // Code 2 = user dismissed the Razorpay modal — not an error
      if (error?.code === 2) return;

      const message =
        error?.code === "payment_failed"
          ? "Payment was not completed. Please try again."
          : error?.message || "Payment failed. Please try again.";

      Alert.alert("Payment Failed", message);
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return { initiatePayment, loading };
};
