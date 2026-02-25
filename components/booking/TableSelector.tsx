import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Table } from "../../types";

interface TableSelectorProps {
  tables: Table[];
  numberOfGuests: number;
  selectedTables: Table[];
  onTableSelect: (tables: Table[]) => void;
}

const LOCATION_CONFIG: Record<
  string,
  { icon: any; label: string; color: string; bg: string }
> = {
  indoor: {
    icon: "meeting-room",
    label: "Indoor",
    color: "#6B2FA0",
    bg: "#F5F0FF",
  },
  outdoor: {
    icon: "wb-sunny",
    label: "Outdoor Seating",
    color: "#FF9F43",
    bg: "#FFF8F0",
  },
  private: {
    icon: "lock",
    label: "Private Dining",
    color: "#FF5A5F",
    bg: "#FFF0F0",
  },
};

export default function TableSelector({
  tables,
  numberOfGuests,
  selectedTables,
  onTableSelect,
}: TableSelectorProps) {
  const handleTableToggle = (table: Table) => {
    const isSelected = selectedTables.some((t) => t.tableId === table.tableId);
    if (isSelected) {
      onTableSelect(selectedTables.filter((t) => t.tableId !== table.tableId));
    } else {
      const currentCapacity = selectedTables.reduce(
        (sum, t) => sum + t.capacity,
        0,
      );
      if (currentCapacity + table.capacity > numberOfGuests + 2) {
        Alert.alert(
          "Too Many Seats",
          "Selected tables exceed guest count significantly.",
        );
        return;
      }
      onTableSelect([...selectedTables, table]);
    }
  };

  const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);
  const hasEnough = totalCapacity >= numberOfGuests;
  const pct = Math.min(
    (totalCapacity / Math.max(numberOfGuests, 1)) * 100,
    100,
  );

  const grouped = {
    indoor: tables.filter((t) => t.location === "indoor"),
    outdoor: tables.filter((t) => t.location === "outdoor"),
    private: tables.filter((t) => t.location === "private"),
  };

  return (
    <View style={styles.container}>
      {/* Capacity summary bar */}
      <View style={[styles.capacityCard, hasEnough && styles.capacityCardOk]}>
        <View style={styles.capacityTop}>
          <View style={styles.capacityLeft}>
            <MaterialIcons
              name={hasEnough ? "check-circle" : "people"}
              size={17}
              color={hasEnough ? "#10B981" : "#FF5A5F"}
            />
            <Text
              style={[styles.capacityText, hasEnough && styles.capacityTextOk]}
            >
              {totalCapacity} / {numberOfGuests} seats selected
            </Text>
          </View>
          {!hasEnough && totalCapacity > 0 && (
            <Text style={styles.capacityNeed}>
              Need {numberOfGuests - totalCapacity} more
            </Text>
          )}
        </View>
        <View style={styles.barBg}>
          <LinearGradient
            colors={hasEnough ? ["#10B981", "#059669"] : ["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${pct}%` as any }]}
          />
        </View>
      </View>

      {/* Table groups */}
      {(Object.keys(grouped) as Array<keyof typeof grouped>).map((loc) => {
        if (grouped[loc].length === 0) return null;
        const cfg = LOCATION_CONFIG[loc];
        return (
          <View key={loc} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIconWrap, { backgroundColor: cfg.bg }]}>
                <MaterialIcons name={cfg.icon} size={14} color={cfg.color} />
              </View>
              <Text style={styles.groupLabel}>{cfg.label}</Text>
              <Text style={styles.groupCount}>
                {grouped[loc].length} tables
              </Text>
            </View>

            <View style={styles.tableGrid}>
              {grouped[loc].map((table) => {
                const isSelected = selectedTables.some(
                  (t) => t.tableId === table.tableId,
                );
                return (
                  <TouchableOpacity
                    key={table.tableId}
                    onPress={() => handleTableToggle(table)}
                    activeOpacity={0.8}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={["#FF5A5F", "#FF9F43"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.tableCard}
                      >
                        <View style={styles.checkBadge}>
                          <MaterialIcons
                            name="check"
                            size={11}
                            color="#FF5A5F"
                          />
                        </View>
                        <Text style={styles.tableNumSelected}>
                          T-{table.tableNumber}
                        </Text>
                        <View style={styles.tableCapRow}>
                          <MaterialIcons
                            name="person"
                            size={11}
                            color="rgba(255,255,255,0.8)"
                          />
                          <Text style={styles.tableCapSelected}>
                            {table.capacity}
                          </Text>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.tableCard,
                          styles.tableCardUnselected,
                          loc === "private" && styles.tableCardPrivate,
                          loc === "outdoor" && styles.tableCardOutdoor,
                        ]}
                      >
                        <Text style={styles.tableNum}>
                          T-{table.tableNumber}
                        </Text>
                        <View style={styles.tableCapRow}>
                          <MaterialIcons
                            name="person"
                            size={11}
                            color="#8A95A3"
                          />
                          <Text style={styles.tableCap}>{table.capacity}</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },

  capacityCard: {
    backgroundColor: "#FFF0F0",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FF5A5F20",
  },
  capacityCardOk: { backgroundColor: "#ECFDF5", borderColor: "#10B98120" },
  capacityTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  capacityLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  capacityText: { fontSize: 13, fontWeight: "700", color: "#FF5A5F" },
  capacityTextOk: { color: "#10B981" },
  capacityNeed: { fontSize: 11, fontWeight: "600", color: "#FF5A5F" },
  barBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },

  group: { gap: 10 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  groupLabel: { fontSize: 13, fontWeight: "700", color: "#0F1B2D", flex: 1 },
  groupCount: { fontSize: 11, fontWeight: "600", color: "#8A95A3" },

  tableGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  tableCard: {
    width: 78,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 70,
    position: "relative",
  },
  tableCardUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tableCardPrivate: { borderColor: "#A855F730", backgroundColor: "#FAF5FF" },
  tableCardOutdoor: { borderColor: "#FF9F4330", backgroundColor: "#FFFAF0" },

  checkBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  tableNum: { fontSize: 13, fontWeight: "800", color: "#0F1B2D" },
  tableNumSelected: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  tableCapRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  tableCap: { fontSize: 12, fontWeight: "600", color: "#8A95A3" },
  tableCapSelected: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
});
