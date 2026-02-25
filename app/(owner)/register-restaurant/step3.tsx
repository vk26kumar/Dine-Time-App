import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};
const DAY_SHORT: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
const TIME_SLOTS = [
  ...Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`),
  "23:59",
];

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

const DEFAULT_HOURS: Record<string, DayHours> = {
  monday: { open: "09:00", close: "22:00", closed: false },
  tuesday: { open: "09:00", close: "22:00", closed: false },
  wednesday: { open: "09:00", close: "22:00", closed: false },
  thursday: { open: "09:00", close: "22:00", closed: false },
  friday: { open: "09:00", close: "23:00", closed: false },
  saturday: { open: "09:00", close: "23:00", closed: false },
  sunday: { open: "10:00", close: "22:00", closed: false },
};

export default function RegisterStep3() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [hours, setHours] = useState<Record<string, DayHours>>(DEFAULT_HOURS);
  const [picker, setPicker] = useState<{
    day: string;
    type: "open" | "close";
  } | null>(null);

  const toggleDay = (day: string) =>
    setHours((h) => ({ ...h, [day]: { ...h[day], closed: !h[day].closed } }));

  const setTime = (day: string, type: "open" | "close", time: string) => {
    setHours((h) => ({ ...h, [day]: { ...h[day], [type]: time } }));
    setPicker(null);
  };

  const handleContinue = () => {
    if (!Object.values(hours).some((h) => !h.closed))
      return Alert.alert("Error", "At least one day must be open");
    for (const day of DAYS) {
      const h = hours[day];
      if (!h.closed && h.open >= h.close)
        return Alert.alert(
          "Invalid Hours",
          `${DAY_LABELS[day]}: Opening time must be before closing time`,
        );
    }
    router.push({
      pathname: "/(owner)/register-restaurant/step4",
      params: { ...params, operatingHours: JSON.stringify(hours) },
    });
  };

  const openDays = DAYS.filter((d) => !hours[d].closed);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.orb1} />
        <View style={styles.orb2} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add Restaurant</Text>
            <Text style={styles.headerSub}>Step 3 of 5 — Operating Hours</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: "60%" }]}
          />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= 3 && styles.dotActive,
                i === 3 && styles.dotCurrent,
              ]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <MaterialIcons name="check-circle" size={14} color="#10B981" />
            <Text style={styles.summaryText}>{openDays.length} days open</Text>
          </View>
          <View style={styles.summaryPill}>
            <MaterialIcons name="block" size={14} color="#FF5A5F" />
            <Text style={styles.summaryText}>
              {7 - openDays.length} days closed
            </Text>
          </View>
        </View>

        {DAYS.map((day) => {
          const h = hours[day];
          return (
            <View
              key={day}
              style={[styles.dayCard, h.closed && styles.dayCardClosed]}
            >
              <View style={styles.dayTop}>
                <View style={styles.dayLeft}>
                  <View
                    style={[styles.dayBadge, h.closed && styles.dayBadgeClosed]}
                  >
                    <Text
                      style={[
                        styles.dayBadgeText,
                        h.closed && styles.dayBadgeTextClosed,
                      ]}
                    >
                      {DAY_SHORT[day]}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={[styles.dayName, h.closed && styles.dayNameClosed]}
                    >
                      {DAY_LABELS[day]}
                    </Text>
                    {h.closed ? (
                      <Text style={styles.closedBadge}>Closed</Text>
                    ) : (
                      <Text style={styles.dayHoursSummary}>
                        {h.open} – {h.close}
                      </Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={!h.closed}
                  onValueChange={() => toggleDay(day)}
                  trackColor={{
                    false: "#E8ECF2",
                    true: "rgba(107,47,160,0.3)",
                  }}
                  thumbColor={h.closed ? "#C4C4C4" : "#6B2FA0"}
                  ios_backgroundColor="#E8ECF2"
                />
              </View>

              {!h.closed && (
                <View style={styles.timesRow}>
                  {(["open", "close"] as const).map((type) => (
                    <React.Fragment key={type}>
                      {type === "close" && (
                        <View style={styles.timeArrow}>
                          <MaterialIcons
                            name="arrow-forward"
                            size={16}
                            color="#B0B8C4"
                          />
                        </View>
                      )}
                      <TouchableOpacity
                        style={styles.timeBtn}
                        onPress={() => setPicker({ day, type })}
                      >
                        <MaterialIcons
                          name={type === "open" ? "wb-sunny" : "nights-stay"}
                          size={14}
                          color={type === "open" ? "#FF9F43" : "#A855F7"}
                        />
                        <View>
                          <Text style={styles.timeBtnLabel}>
                            {type === "open" ? "Opens" : "Closes"}
                          </Text>
                          <Text style={styles.timeBtnValue}>{h[type]}</Text>
                        </View>
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>

      {picker && (
        <View style={styles.sheet}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {picker.type === "open" ? "☀️ Opening" : "🌙 Closing"} Time —{" "}
                {DAY_LABELS[picker.day]}
              </Text>
              <TouchableOpacity
                onPress={() => setPicker(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View style={styles.sheetClose}>
                  <MaterialIcons name="close" size={18} color="#0F1B2D" />
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              {TIME_SLOTS.map((t) => {
                const active = hours[picker.day][picker.type] === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.timeOption,
                      active && styles.timeOptionActive,
                    ]}
                    onPress={() => setTime(picker.day, picker.type, t)}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        active && styles.timeOptionTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                    {active && (
                      <MaterialIcons name="check" size={16} color="#6B2FA0" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          style={styles.ctaWrap}
        >
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },
  header: { paddingHorizontal: 16, paddingBottom: 20, overflow: "hidden" },
  orb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,90,95,0.15)",
    top: -40,
    right: -20,
  },
  orb2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,159,67,0.1)",
    top: 10,
    right: 80,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: { height: "100%", borderRadius: 2 },
  stepDots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  dotActive: { backgroundColor: "rgba(255,159,67,0.6)" },
  dotCurrent: { width: 20, backgroundColor: "#FF9F43" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 10 },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryText: { fontSize: 12, fontWeight: "600", color: "#0F1B2D" },
  dayCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dayCardClosed: { opacity: 0.65 },
  dayTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  dayBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(107,47,160,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  dayBadgeClosed: { backgroundColor: "#F0F2F7" },
  dayBadgeText: { fontSize: 11, fontWeight: "800", color: "#6B2FA0" },
  dayBadgeTextClosed: { color: "#B0B8C4" },
  dayName: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  dayNameClosed: { color: "#B0B8C4" },
  dayHoursSummary: { fontSize: 12, color: "#8A95A3", marginTop: 2 },
  closedBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF5A5F",
    marginTop: 2,
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  timeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    padding: 10,
  },
  timeBtnLabel: { fontSize: 10, fontWeight: "600", color: "#8A95A3" },
  timeBtnValue: { fontSize: 15, fontWeight: "800", color: "#0F1B2D" },
  timeArrow: { width: 28, alignItems: "center" },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,5,20,0.6)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "65%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F4",
  },
  sheetTitle: { fontSize: 15, fontWeight: "700", color: "#0F1B2D" },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F0F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetScroll: { maxHeight: 380 },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F6F8",
  },
  timeOptionActive: { backgroundColor: "#F5F0FF" },
  timeOptionText: { fontSize: 15, color: "#0F1B2D", fontWeight: "500" },
  timeOptionTextActive: { color: "#6B2FA0", fontWeight: "700" },
  bottomBar: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
  },
  ctaText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});
