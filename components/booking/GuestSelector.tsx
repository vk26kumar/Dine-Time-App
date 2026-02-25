import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface GuestSelectorProps {
  numberOfGuests: number;
  onGuestsChange: (guests: number) => void;
  maxGuests: number;
}

export default function GuestSelector({
  numberOfGuests,
  onGuestsChange,
  maxGuests,
}: GuestSelectorProps) {
  const pct = numberOfGuests / maxGuests;
  const isAtMax = numberOfGuests === maxGuests;
  const isAtMin = numberOfGuests === 1;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.info}>
          <Text style={styles.label}>Number of Guests</Text>
          <Text style={styles.sublabel}>Max {maxGuests} guests allowed</Text>
        </View>

        <View style={styles.controls}>
          {/* Decrement */}
          <TouchableOpacity
            onPress={() => !isAtMin && onGuestsChange(numberOfGuests - 1)}
            disabled={isAtMin}
            activeOpacity={0.75}
          >
            <View style={[styles.ctrlBtn, isAtMin && styles.ctrlBtnDisabled]}>
              <MaterialIcons
                name="remove"
                size={20}
                color={isAtMin ? "#C4CAD4" : "#FF5A5F"}
              />
            </View>
          </TouchableOpacity>

          {/* Count */}
          <View style={styles.countWrap}>
            <Text style={styles.countText}>{numberOfGuests}</Text>
          </View>

          {/* Increment */}
          <TouchableOpacity
            onPress={() => !isAtMax && onGuestsChange(numberOfGuests + 1)}
            disabled={isAtMax}
            activeOpacity={0.75}
          >
            {isAtMax ? (
              <View style={[styles.ctrlBtn, styles.ctrlBtnDisabled]}>
                <MaterialIcons name="add" size={20} color="#C4CAD4" />
              </View>
            ) : (
              <LinearGradient
                colors={["#FF5A5F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctrlBtn}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Capacity bar */}
      <View style={styles.barSection}>
        <View style={styles.barBg}>
          <LinearGradient
            colors={
              pct > 0.85 ? ["#EF4444", "#FF5A5F"] : ["#FF5A5F", "#FF9F43"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.barFill,
              { width: `${Math.min(pct * 100, 100)}%` as any },
            ]}
          />
        </View>
        <Text style={styles.barLabel}>
          {numberOfGuests} of {maxGuests} seats
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  sublabel: { fontSize: 11, color: "#8A95A3", fontWeight: "500", marginTop: 2 },

  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  ctrlBtnDisabled: { backgroundColor: "#F5F6F8" },

  countWrap: {
    width: 48,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
  },
  countText: { fontSize: 20, fontWeight: "900", color: "#0F1B2D" },

  barSection: { gap: 6 },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F5F6F8",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  barLabel: {
    fontSize: 11,
    color: "#8A95A3",
    fontWeight: "500",
    textAlign: "right",
  },
});
