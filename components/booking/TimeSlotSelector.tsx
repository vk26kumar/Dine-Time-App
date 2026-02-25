import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { Restaurant } from "../../types";

interface TimeSlotSelectorProps {
  selectedDate: Date;
  selectedTimeSlot: string | null;
  onTimeSlotSelect: (timeSlot: string) => void;
  restaurant: Restaurant;
}

export default function TimeSlotSelector({
  selectedDate,
  selectedTimeSlot,
  onTimeSlotSelect,
  restaurant,
}: TimeSlotSelectorProps) {
  const generateTimeSlots = () => {
    const dayName = selectedDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase() as keyof typeof restaurant.operatingHours;
    const hours = restaurant.operatingHours[dayName];
    if (hours.closed) return [];

    const slots: string[] = [];
    const [openHour, openMin] = hours.open.split(":").map(Number);
    const [closeHour, closeMin] = hours.close.split(":").map(Number);
    let currentHour = openHour,
      currentMin = openMin;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMin < closeMin)
    ) {
      const start = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      const endH = currentHour + 2;
      const end = `${endH.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      slots.push(`${start} - ${end}`);
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    return slots;
  };

  const isPastTime = (slot: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    if (sel.getTime() > today.getTime()) return false;
    const [startTime] = slot.split(" - ");
    const [h, m] = startTime.split(":").map(Number);
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);
    return slotDate <= new Date();
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}${m > 0 ? `:${m.toString().padStart(2, "0")}` : ""} ${ampm}`;
  };

  const timeSlots = generateTimeSlots();

  if (timeSlots.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="event-busy" size={28} color="#C4CAD4" />
        <Text style={styles.emptyText}>Restaurant is closed on this day</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {timeSlots.map((slot, index) => {
        const isSelected = selectedTimeSlot === slot;
        const isPast = isPastTime(slot);
        const [rawStart, rawEnd] = slot.split(" - ");
        const start = formatTime(rawStart);
        const end = formatTime(rawEnd);

        if (isSelected) {
          return (
            <TouchableOpacity
              key={index}
              onPress={() => onTimeSlotSelect(slot)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#FF5A5F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.slotCard}
              >
                <MaterialIcons
                  name="schedule"
                  size={13}
                  color="rgba(255,255,255,0.85)"
                />
                <Text style={styles.slotTimeSelected}>{start}</Text>
                <Text style={styles.slotEndSelected}>→ {end}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={index}
            onPress={() => !isPast && onTimeSlotSelect(slot)}
            disabled={isPast}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.slotCard,
                styles.slotCardUnselected,
                isPast && styles.slotCardDisabled,
              ]}
            >
              <MaterialIcons
                name="schedule"
                size={13}
                color={isPast ? "#C4CAD4" : "#8A95A3"}
              />
              <Text
                style={[styles.slotTime, isPast && styles.slotDisabledText]}
              >
                {start}
              </Text>
              <Text style={[styles.slotEnd, isPast && styles.slotDisabledText]}>
                → {end}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 4 },

  slotCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    gap: 2,
    minWidth: 96,
  },
  slotCardUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  slotCardDisabled: {
    backgroundColor: "#F5F6F8",
    borderColor: "#EEF0F4",
    opacity: 0.5,
  },

  slotTime: { fontSize: 13, fontWeight: "700", color: "#0F1B2D" },
  slotTimeSelected: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  slotEnd: { fontSize: 10, fontWeight: "500", color: "#8A95A3" },
  slotEndSelected: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  slotDisabledText: { color: "#C4CAD4" },

  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
    backgroundColor: "#F5F6F8",
    borderRadius: 14,
  },
  emptyText: { fontSize: 13, color: "#8A95A3", fontWeight: "500" },
});
