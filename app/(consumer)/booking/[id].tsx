import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Restaurant, Table } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import DateSelector from "../../../components/booking/DateSelector";
import TimeSlotSelector from "../../../components/booking/TimeSlotSelector";
import GuestSelector from "../../../components/booking/GuestSelector";
import TableSelector from "../../../components/booking/TableSelector";
import { theme } from "../../../constants/theme";

const OCCASIONS = ["Birthday", "Anniversary", "Business", "Casual", "Other"];
const OCCASION_ICONS: Record<string, any> = {
  Birthday: "cake",
  Anniversary: "favorite",
  Business: "business-center",
  Casual: "local-dining",
  Other: "more-horiz",
};

const STEPS = [
  { id: 1, label: "Date", icon: "event" as const },
  { id: 2, label: "Time", icon: "schedule" as const },
  { id: 3, label: "Guests", icon: "people" as const },
  { id: 4, label: "Tables", icon: "table-restaurant" as const },
];

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { userData } = useAuth();
  const insets = useSafeAreaInsets();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [occasion, setOccasion] = useState("");

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "restaurants", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRestaurant({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Restaurant);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleGuestsChange = (guests: number) => {
    setNumberOfGuests(guests);
    setSelectedTables([]);
  };

  const calculateTotalAmount = () =>
    !restaurant ? 0 : restaurant.bookingFeePerPerson * numberOfGuests;

  const canProceed = () =>
    !!(
      selectedDate &&
      selectedTimeSlot &&
      numberOfGuests > 0 &&
      selectedTables.length > 0
    );

  const getCurrentStep = () => {
    if (!selectedDate) return 1;
    if (!selectedTimeSlot) return 2;
    if (!selectedTables.length) return 3;
    return 4;
  };

  const handleGetDirections = () => {
    if (!restaurant) return;
    const addr = encodeURIComponent(
      `${restaurant.address?.street}, ${restaurant.address?.city}`,
    );
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${addr}`,
      android: `geo:0,0?q=${addr}`,
    });
    const fallback = `https://www.google.com/maps/search/?api=1&query=${addr}`;
    Linking.canOpenURL(url || fallback)
      .then((ok) => Linking.openURL(ok ? url || fallback : fallback))
      .catch(() => Linking.openURL(fallback));
  };

  const handleProceedToPayment = () => {
    if (!canProceed()) {
      Alert.alert("Incomplete Booking", "Please complete all booking details");
      return;
    }
    router.push({
      pathname: "/(consumer)/payment",
      params: {
        restaurantId: restaurant?.id,
        restaurantName: restaurant?.name,
        restaurantAddress: `${restaurant?.address?.street}, ${restaurant?.address?.city}`,
        restaurantPhone: restaurant?.phone,
        date: selectedDate?.toISOString(),
        timeSlot: selectedTimeSlot,
        numberOfGuests,
        bookingFeePerPerson: restaurant?.bookingFeePerPerson,
        tableIds: selectedTables.map((t) => t.tableId).join(","),
        specialRequests,
        occasion,
      },
    });
  };

  // ── Loading state ──
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingOrb} />
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading restaurant...</Text>
        </LinearGradient>
      </View>
    );
  }

  // ── Error state ──
  if (!restaurant) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <View style={styles.errorIconWrap}>
          <MaterialIcons name="error-outline" size={36} color="#FF5A5F" />
        </View>
        <Text style={styles.errorTitle}>Restaurant Not Found</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalAmount = calculateTotalAmount();
  const currentStep = getCurrentStep();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerOrb1} />
        <View style={styles.headerOrb2} />

        {/* Nav row */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <View style={styles.backBtnInner}>
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reserve a Table</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {restaurant.name}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleGetDirections}
            style={styles.backBtn}
          >
            <View style={styles.backBtnInner}>
              <MaterialIcons name="near-me" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Restaurant info strip inside header */}
        <View style={styles.restaurantStrip}>
          <View style={styles.restaurantStripLeft}>
            <View style={styles.restaurantIconWrap}>
              <MaterialIcons name="restaurant" size={16} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {restaurant.name}
              </Text>
              <Text style={styles.restaurantAddress} numberOfLines={1}>
                {restaurant.address?.street}, {restaurant.address?.city}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.directionsChip}
            onPress={handleGetDirections}
            activeOpacity={0.75}
          >
            <MaterialIcons name="directions" size={13} color="#FF9F43" />
            <Text style={styles.directionsChipText}>Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Accent bar */}
        <View style={styles.accentBar}>
          <View
            style={[styles.accentSegment, { backgroundColor: "#FF5A5F" }]}
          />
          <View
            style={[styles.accentSegment, { backgroundColor: "#FF9F43" }]}
          />
          <View
            style={[styles.accentSegment, { backgroundColor: "#A855F7" }]}
          />
        </View>
      </LinearGradient>

      {/* ── Step Progress Bar ── */}
      <View style={styles.stepBar}>
        {STEPS.map((step, idx) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    active && styles.stepCircleActive,
                    done && styles.stepCircleDone,
                  ]}
                >
                  {done ? (
                    <MaterialIcons name="check" size={13} color="#FFFFFF" />
                  ) : (
                    <MaterialIcons
                      name={step.icon}
                      size={13}
                      color={active ? "#FFFFFF" : "#8A95A3"}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    active && styles.stepLabelActive,
                    done && styles.stepLabelDone,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    done && styles.stepConnectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Date */}
        <View style={styles.section}>
          <SectionHeader
            step={1}
            title="Select Date"
            currentStep={currentStep}
            meta={
              selectedDate
                ? selectedDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })
                : undefined
            }
          />
          <DateSelector
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            restaurant={restaurant}
          />
        </View>

        {/* Step 2: Time */}
        {selectedDate && (
          <View style={styles.section}>
            <SectionHeader
              step={2}
              title="Select Time"
              currentStep={currentStep}
              meta={
                selectedTimeSlot ? selectedTimeSlot.split(" - ")[0] : undefined
              }
            />
            <TimeSlotSelector
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              onTimeSlotSelect={setSelectedTimeSlot}
              restaurant={restaurant}
            />
          </View>
        )}

        {/* Step 3: Guests */}
        {selectedTimeSlot && (
          <View style={styles.section}>
            <SectionHeader
              step={3}
              title="Number of Guests"
              currentStep={currentStep}
              meta={`${numberOfGuests} guests`}
            />
            <GuestSelector
              numberOfGuests={numberOfGuests}
              onGuestsChange={handleGuestsChange}
              maxGuests={restaurant.totalCapacity}
            />
          </View>
        )}

        {/* Step 4: Tables */}
        {numberOfGuests > 0 && selectedTimeSlot && (
          <View style={styles.section}>
            <SectionHeader
              step={4}
              title="Select Tables"
              currentStep={currentStep}
              meta={
                selectedTables.length > 0
                  ? `${selectedTables.length} selected`
                  : undefined
              }
            />
            <TableSelector
              tables={restaurant.tables}
              numberOfGuests={numberOfGuests}
              selectedTables={selectedTables}
              onTableSelect={setSelectedTables}
            />
          </View>
        )}

        {/* Step 5: Extras */}
        {selectedTables.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.stepOptionalBadge}>
                <MaterialIcons name="edit-note" size={14} color="#FF5A5F" />
              </View>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <View style={styles.optionalPill}>
                <Text style={styles.optionalPillText}>Optional</Text>
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Occasion</Text>
              <View style={styles.occasionGrid}>
                {OCCASIONS.map((occ) => (
                  <TouchableOpacity
                    key={occ}
                    style={[
                      styles.occasionCard,
                      occasion === occ && styles.occasionCardActive,
                    ]}
                    onPress={() => setOccasion(occasion === occ ? "" : occ)}
                    activeOpacity={0.75}
                  >
                    {occasion === occ ? (
                      <LinearGradient
                        colors={["#FF5A5F", "#FF9F43"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.occasionCardGradient}
                      >
                        <MaterialIcons
                          name={OCCASION_ICONS[occ]}
                          size={15}
                          color="#FFFFFF"
                        />
                        <Text style={styles.occasionCardTextActive}>{occ}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.occasionCardInner}>
                        <MaterialIcons
                          name={OCCASION_ICONS[occ]}
                          size={15}
                          color="#8A95A3"
                        />
                        <Text style={styles.occasionCardText}>{occ}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Special Requests</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Dietary restrictions, seating preferences..."
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={4}
                placeholderTextColor="#8A95A3"
              />
            </View>
          </View>
        )}

        {/* Booking Summary */}
        {canProceed() && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.summaryBadge}>
                <MaterialIcons name="receipt-long" size={13} color="#FFFFFF" />
              </View>
              <Text style={styles.sectionTitle}>Booking Summary</Text>
            </View>

            <View style={styles.summaryCard}>
              <SummaryRow
                icon="event"
                label="Date"
                value={selectedDate!.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              />
              <SummaryRow
                icon="schedule"
                label="Time"
                value={selectedTimeSlot!}
              />
              <SummaryRow
                icon="people"
                label="Guests"
                value={`${numberOfGuests} ${numberOfGuests === 1 ? "person" : "people"}`}
              />
              <SummaryRow
                icon="table-restaurant"
                label="Tables"
                value={selectedTables
                  .map((t) => `T-${t.tableNumber}`)
                  .join(", ")}
              />
              {occasion && (
                <SummaryRow
                  icon="celebration"
                  label="Occasion"
                  value={occasion}
                />
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryTotalRow}>
                <View>
                  <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                  {totalAmount > 0 && (
                    <Text style={styles.summaryPerPerson}>
                      ₹{restaurant.bookingFeePerPerson} × {numberOfGuests}{" "}
                      guests
                    </Text>
                  )}
                </View>
                <LinearGradient
                  colors={
                    totalAmount === 0
                      ? ["#10B981", "#059669"]
                      : ["#FF5A5F", "#FF9F43"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.totalBadge}
                >
                  <Text style={styles.totalBadgeText}>
                    {totalAmount === 0 ? "FREE" : `₹${totalAmount}`}
                  </Text>
                </LinearGradient>
              </View>

              <View style={styles.warningRow}>
                <MaterialIcons name="info-outline" size={13} color="#FF5A5F" />
                <Text style={styles.warningText}>
                  This booking is non-refundable
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      {canProceed() && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomLabel}>Total</Text>
            <Text
              style={[
                styles.bottomValue,
                totalAmount === 0 && styles.bottomValueFree,
              ]}
            >
              {totalAmount === 0 ? "FREE" : `₹${totalAmount}`}
            </Text>
            <Text style={styles.bottomSub}>
              {numberOfGuests} guest{numberOfGuests !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleProceedToPayment}
            disabled={processing}
            activeOpacity={0.9}
            style={styles.proceedBtnWrap}
          >
            <LinearGradient
              colors={
                processing ? ["#C4CAD4", "#C4CAD4"] : ["#FF5A5F", "#FF9F43"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proceedBtnGradient}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.proceedBtnText}>
                    {totalAmount === 0 ? "Confirm Booking" : "Proceed to Pay"}
                  </Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader = ({
  step,
  title,
  currentStep,
  meta,
}: {
  step: number;
  title: string;
  currentStep: number;
  meta?: string;
}) => {
  const done = currentStep > step;
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.stepNumBadge, done && styles.stepNumBadgeDone]}>
        {done ? (
          <MaterialIcons name="check" size={13} color="#FFFFFF" />
        ) : (
          <Text style={styles.stepNumText}>{step}</Text>
        )}
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta && (
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{meta}</Text>
        </View>
      )}
    </View>
  );
};

const SummaryRow = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <View style={styles.summaryRow}>
    <View style={styles.summaryRowLeft}>
      <View style={styles.summaryIconWrap}>
        <MaterialIcons name={icon} size={14} color="#FF5A5F" />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  // Loading
  loadingContainer: { flex: 1 },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,90,95,0.15)",
    top: "30%",
    right: -40,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    marginTop: 8,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    padding: 32,
    backgroundColor: "#F5F6F8",
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  errorTitle: { fontSize: 17, fontWeight: "700", color: "#0F1B2D" },
  errorBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: "#FF5A5F",
    borderRadius: 14,
  },
  errorBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  // ── Header ──
  headerGradient: {
    overflow: "hidden",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  headerOrb1: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,90,95,0.2)",
    top: -40,
    right: -20,
  },
  headerOrb2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,159,67,0.15)",
    top: 10,
    right: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {},
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginTop: 2,
  },

  // Restaurant strip inside header
  restaurantStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  restaurantStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  restaurantIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  restaurantName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  restaurantAddress: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    marginTop: 1,
  },
  directionsChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,159,67,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,159,67,0.3)",
  },
  directionsChipText: {
    fontSize: 11,
    color: "#FF9F43",
    fontWeight: "700",
  },
  accentBar: { flexDirection: "row", height: 3 },
  accentSegment: { flex: 1 },

  // ── Step bar ──
  stepBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  stepItem: { alignItems: "center", gap: 5 },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F6F8",
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: "#FF5A5F", borderColor: "#FF5A5F" },
  stepCircleDone: { backgroundColor: "#10B981", borderColor: "#10B981" },
  stepLabel: {
    fontSize: 9,
    color: "#8A95A3",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  stepLabelActive: { color: "#FF5A5F", fontWeight: "700" },
  stepLabelDone: { color: "#10B981", fontWeight: "700" },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "#EEF0F4",
    marginBottom: 16,
    marginHorizontal: 4,
  },
  stepConnectorDone: { backgroundColor: "#10B981" },

  // ── Content sections ──
  content: { flex: 1 },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEF0F4",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1B2D",
    flex: 1,
  },

  stepNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FF5A5F",
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumBadgeDone: { backgroundColor: "#10B981" },
  stepNumText: { fontSize: 11, fontWeight: "800", color: "#FFF" },

  stepOptionalBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  optionalPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#F5F6F8",
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  optionalPillText: { fontSize: 10, color: "#8A95A3", fontWeight: "600" },
  metaChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
  },
  metaChipText: { fontSize: 11, fontWeight: "700", color: "#FF5A5F" },

  summaryBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#6B2FA0",
    justifyContent: "center",
    alignItems: "center",
  },

  // Inputs
  inputBlock: { marginBottom: 18 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F1B2D",
    marginBottom: 10,
  },
  occasionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  occasionCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    overflow: "hidden",
  },
  occasionCardActive: { borderColor: "transparent" },
  occasionCardGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  occasionCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },
  occasionCardText: { fontSize: 13, fontWeight: "500", color: "#0F1B2D" },
  occasionCardTextActive: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  textArea: {
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#0F1B2D",
    minHeight: 96,
    backgroundColor: "#F5F6F8",
    lineHeight: 22,
    textAlignVertical: "top",
  },

  // Summary card
  summaryCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
  },
  summaryIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#FFF0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryLabel: { fontSize: 13, color: "#8A95A3", fontWeight: "500" },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F1B2D",
    textAlign: "right",
    maxWidth: "55%",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#EEF0F4",
    marginVertical: 10,
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryTotalLabel: { fontSize: 15, fontWeight: "700", color: "#0F1B2D" },
  summaryPerPerson: { fontSize: 11, color: "#8A95A3", marginTop: 2 },
  totalBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  totalBadgeText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: "#FFF0F0",
    padding: 10,
    borderRadius: 10,
  },
  warningText: { fontSize: 11, color: "#FF5A5F", fontWeight: "600", flex: 1 },

  // ── Bottom bar ──
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
  bottomLeft: { flex: 1 },
  bottomLabel: {
    fontSize: 11,
    color: "#8A95A3",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F1B2D",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  bottomValueFree: { color: "#10B981" },
  bottomSub: { fontSize: 11, color: "#8A95A3", marginTop: 2 },
  proceedBtnWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  proceedBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 15,
    minWidth: 170,
    justifyContent: "center",
  },
  proceedBtnText: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
});
