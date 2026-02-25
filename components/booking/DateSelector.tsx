import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Restaurant } from "../../types";

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  restaurant: Restaurant;
}

export default function DateSelector({
  selectedDate,
  onDateSelect,
  restaurant,
}: DateSelectorProps) {
  const generateDates = () => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  const isDateSelected = (date: Date) =>
    !!(selectedDate && date.toDateString() === selectedDate.toDateString());

  const isDateClosed = (date: Date) => {
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase() as keyof typeof restaurant.operatingHours;
    return restaurant.operatingHours[dayName].closed;
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((date, index) => {
        const isSelected = isDateSelected(date);
        const isClosed = isDateClosed(date);
        const isToday = index === 0;

        if (isSelected) {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => !isClosed && onDateSelect(date)}
              disabled={isClosed}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FF5A5F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.dateCard}
              >
                {isToday && (
                  <View style={styles.todayPillSelected}>
                    <Text style={styles.todayPillSelectedText}>Today</Text>
                  </View>
                )}
                <Text style={styles.dayTextSelected}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
                <Text style={styles.dateTextSelected}>{date.getDate()}</Text>
                <View style={styles.selectedDot} />
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={() => !isClosed && onDateSelect(date)}
            disabled={isClosed}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.dateCard,
                styles.dateCardUnselected,
                isClosed && styles.dateCardDisabled,
              ]}
            >
              {isToday && (
                <View style={styles.todayPill}>
                  <Text style={styles.todayPillText}>Today</Text>
                </View>
              )}
              <Text style={[styles.dayText, isClosed && styles.textDisabled]}>
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text style={[styles.dateText, isClosed && styles.textDisabled]}>
                {date.getDate()}
              </Text>
              {isClosed ? (
                <Text style={styles.closedText}>Closed</Text>
              ) : (
                <View style={styles.availableDot} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingVertical: 4 },

  dateCard: {
    width: 66,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 90,
  },
  dateCardUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dateCardDisabled: {
    backgroundColor: "#F5F6F8",
    borderColor: "#EEF0F4",
    opacity: 0.5,
  },

  todayPill: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FF5A5F",
    letterSpacing: 0.3,
  },
  todayPillSelected: {
    backgroundColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayPillSelectedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  dayText: { fontSize: 11, fontWeight: "600", color: "#8A95A3" },
  dayTextSelected: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  dateText: { fontSize: 22, fontWeight: "800", color: "#0F1B2D" },
  dateTextSelected: { fontSize: 22, fontWeight: "900", color: "#FFFFFF" },
  textDisabled: { color: "#C4CAD4" },
  closedText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#EF4444",
    letterSpacing: 0.2,
  },

  selectedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  availableDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
});
