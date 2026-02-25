import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRazorpayCheckout } from "../../hooks/useRazorpayCheckout";

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { initiatePayment, loading: paymentLoading } = useRazorpayCheckout();
  const [processing, setProcessing] = useState(false);

  // ── Parse params ──────────────────────────────────────────────────────────
  const restaurantId = String(params.restaurantId || "");
  const restaurantName = String(params.restaurantName || "");
  const restaurantAddress = String(params.restaurantAddress || "");
  const restaurantPhone = String(params.restaurantPhone || "");
  const timeSlot = String(params.timeSlot || "");
  const specialRequests = String(params.specialRequests || "");
  const occasion = String(params.occasion || "");
  const numberOfGuests = parseInt(String(params.numberOfGuests || "0"), 10);
  const bookingFeePerPerson = parseInt(
    String(params.bookingFeePerPerson || "0"),
    10,
  );

  // date — kept as ISO string, paymentService converts it safely
  const dateParam = String(params.date || new Date().toISOString());

  // tableIds — safe parse from comma string or array
  const rawTableIds = params.tableIds;
  const tableIds: string[] = Array.isArray(rawTableIds)
    ? rawTableIds.map(String)
    : typeof rawTableIds === "string" && rawTableIds.trim()
      ? rawTableIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const totalAmount = numberOfGuests * bookingFeePerPerson;
  const isFree = totalAmount === 0;
  const isLoading = processing || paymentLoading;

  // ── Date display ──────────────────────────────────────────────────────────
  const displayDate = new Date(dateParam).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ── Payment handler ───────────────────────────────────────────────────────
  const handlePayment = async () => {
    setProcessing(true);
    try {
      await initiatePayment({
        restaurantId,
        restaurantName,
        restaurantAddress,
        restaurantPhone,
        date: dateParam, // string — service converts to Timestamp
        timeSlot,
        numberOfGuests,
        bookingFeePerPerson,
        tableIds,
        specialRequests,
        occasion,
        onSuccess: () => {
          setProcessing(false);
          router.replace("/(consumer)/bookings");
        },
        onError: () => setProcessing(false),
      });
    } catch {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      {/* ── Header ── */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={[styles.headerRow, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isFree ? "Confirm Booking" : "Payment"}
            </Text>
            <Text style={styles.headerSub}>{restaurantName}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Amount hero */}
        <View style={styles.amountHero}>
          <Text style={styles.amountLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.amountValue}>
            {isFree ? "FREE" : `₹${totalAmount}`}
          </Text>
          <View style={styles.guestPill}>
            <MaterialIcons
              name="people"
              size={13}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.guestPillText}>
              {numberOfGuests} guest{numberOfGuests !== 1 ? "s" : ""} ·{" "}
              {tableIds.length} table{tableIds.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary */}
        <SectionTitle label="Booking Summary" />
        <View style={styles.card}>
          <Row icon="store" label="Restaurant" value={restaurantName} />
          <Divider />
          <Row icon="event" label="Date" value={displayDate} />
          <Divider />
          <Row icon="schedule" label="Time" value={timeSlot} />
          <Divider />
          <Row
            icon="people"
            label="Guests"
            value={`${numberOfGuests} people`}
          />
          <Divider />
          <Row
            icon="table-restaurant"
            label="Tables"
            value={`${tableIds.length} table${tableIds.length !== 1 ? "s" : ""}`}
          />
          {occasion ? (
            <>
              <Divider />
              <Row icon="celebration" label="Occasion" value={occasion} />
            </>
          ) : null}
          {specialRequests ? (
            <>
              <Divider />
              <Row icon="notes" label="Requests" value={specialRequests} />
            </>
          ) : null}
        </View>

        {/* Price */}
        <SectionTitle label="Price Details" />
        <View style={styles.card}>
          <Row label="Fee per person" value={`₹${bookingFeePerPerson}`} />
          <Divider />
          <Row label="Guests" value={`× ${numberOfGuests}`} />
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <LinearGradient
              colors={isFree ? ["#10B981", "#059669"] : ["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.totalBadge}
            >
              <Text style={styles.totalBadgeText}>
                {isFree ? "FREE" : `₹${totalAmount}`}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.warningRow}>
            <MaterialIcons name="info-outline" size={14} color="#FF5A5F" />
            <Text style={styles.warningText}>
              This booking fee is non-refundable once confirmed
            </Text>
          </View>
        </View>

        {/* Secure badge */}
        <View style={styles.secureCard}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.secureIcon}
          >
            <MaterialIcons name="lock" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.secureTitle}>Secure Payment</Text>
            <Text style={styles.secureSub}>
              Powered by Razorpay · 256-bit SSL encrypted
            </Text>
          </View>
          <View style={styles.rzpBadge}>
            <Text style={styles.rzpText}>RZP</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Bottom bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
        <View>
          <Text style={styles.bottomLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.bottomValue}>
            {isFree ? "FREE" : `₹${totalAmount}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handlePayment}
          disabled={isLoading}
          activeOpacity={0.9}
          style={styles.payBtnWrap}
        >
          <LinearGradient
            colors={isLoading ? ["#C4CAD4", "#C4CAD4"] : ["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payBtn}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialIcons name="payment" size={20} color="#FFFFFF" />
                <Text style={styles.payBtnText}>
                  {isFree ? "Confirm Booking" : `Pay ₹${totalAmount}`}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const Divider = () => <View style={styles.divider} />;

const SectionTitle = ({ label }: { label: string }) => (
  <View style={styles.sectionTitleRow}>
    <View style={styles.sectionDot} />
    <Text style={styles.sectionTitle}>{label}</Text>
  </View>
);

const Row = ({
  icon,
  label,
  value,
}: {
  icon?: any;
  label: string;
  value: string;
}) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      {icon && (
        <View style={styles.rowIcon}>
          <MaterialIcons name={icon} size={15} color="#8A95A3" />
        </View>
      )}
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={styles.rowValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  headerGradient: {
    overflow: "hidden",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  orb1: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,90,95,0.2)",
    top: -40,
    right: -20,
  },
  orb2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,159,67,0.15)",
    top: 10,
    right: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { alignItems: "center", flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginTop: 2,
  },

  amountHero: { alignItems: "center", paddingVertical: 20, gap: 6 },
  amountLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  amountValue: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  guestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  guestPillText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },

  accentBar: { flexDirection: "row", height: 3 },
  accentSeg: { flex: 1 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  sectionDot: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#FF5A5F",
  },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: "#0F1B2D" },

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
  },
  divider: { height: 1, backgroundColor: "#F5F6F8", marginHorizontal: 14 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
  },
  rowLabel: { fontSize: 13, color: "#8A95A3", fontWeight: "500" },
  rowValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F1B2D",
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "50%",
  },

  totalDivider: { height: 1, backgroundColor: "#F5F6F8", marginHorizontal: 14 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 15, fontWeight: "800", color: "#0F1B2D" },
  totalBadge: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  totalBadgeText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  warningText: { fontSize: 11, color: "#FF5A5F", fontWeight: "600", flex: 1 },

  secureCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#10B98120",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  secureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  secureTitle: { fontSize: 14, fontWeight: "700", color: "#059669" },
  secureSub: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  rzpBadge: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rzpText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomLabel: {
    fontSize: 10,
    color: "#8A95A3",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  bottomValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F1B2D",
    letterSpacing: -0.5,
  },
  payBtnWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 16,
    gap: 8,
    minWidth: 160,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
