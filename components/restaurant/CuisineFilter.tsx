import React, { useRef } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const POPULAR_CUISINES = [
  { name: "All", emoji: "🍽️" },
  { name: "Indian", emoji: "🍛" },
  { name: "Chinese", emoji: "🍜" },
  { name: "Italian", emoji: "🍕" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Thai", emoji: "🍲" },
  { name: "Japanese", emoji: "🍣" },
  { name: "Continental", emoji: "🥩" },
  { name: "Fast Food", emoji: "🍔" },
  { name: "Café", emoji: "☕" },
  { name: "Desserts", emoji: "🍰" },
];

interface CuisineFilterProps {
  selectedCuisine: string | null;
  onSelectCuisine: (cuisine: string | null) => void;
}

// ─── Single chip ─────────────────────────────
function CuisineChip({
  cuisine,
  isSelected,
  onPress,
}: {
  cuisine: (typeof POPULAR_CUISINES)[0];
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, {
      toValue: 0.91,
      useNativeDriver: true,
      speed: 50,
    }).start();

  const handlePressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 10,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {isSelected ? (
          <LinearGradient
            colors={["#FF5A5F", "#FF8042", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.chip, styles.chipSelected]}
          >
            <View style={styles.emojiBadgeSelected}>
              <Text style={styles.emoji}>{cuisine.emoji}</Text>
            </View>
            <Text style={styles.chipTextSelected}>{cuisine.name}</Text>
            <View style={styles.activeDot} />
          </LinearGradient>
        ) : (
          <View style={styles.chip}>
            <View style={styles.emojiBadge}>
              <Text style={styles.emoji}>{cuisine.emoji}</Text>
            </View>
            <Text style={styles.chipText}>{cuisine.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────
export default function CuisineFilter({
  selectedCuisine,
  onSelectCuisine,
}: CuisineFilterProps) {
  const handleSelect = (cuisine: string) => {
    if (cuisine === "All") {
      onSelectCuisine(null);
    } else {
      onSelectCuisine(selectedCuisine === cuisine ? null : cuisine);
    }
  };

  return (
    <View style={styles.outerWrapper}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerAccent}
          />
          <Text style={styles.headerLabel}>Cuisines</Text>
        </View>

        {selectedCuisine && (
          <TouchableOpacity
            onPress={() => onSelectCuisine(null)}
            activeOpacity={0.7}
          >
            <View style={styles.clearPill}>
              <Text style={styles.clearText}>✕ Clear</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.trayWrap}>
        <LinearGradient
          colors={["#12082A", "#1E0D42", "#2A1558"]}
          style={styles.tray}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
          >
            {POPULAR_CUISINES.map((cuisine) => {
              const isSelected =
                cuisine.name === "All"
                  ? !selectedCuisine
                  : selectedCuisine === cuisine.name;

              return (
                <CuisineChip
                  key={cuisine.name}
                  cuisine={cuisine}
                  isSelected={isSelected}
                  onPress={() => handleSelect(cuisine.name)}
                />
              );
            })}
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}

// ─── Styles (unchanged) ───────────────────────
const styles = StyleSheet.create({
  outerWrapper: {
    backgroundColor: "#FFFFFF",
    paddingTop: 10,
    paddingBottom: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1E0D42",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    opacity: 0.65,
  },
  clearPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,90,95,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,90,95,0.25)",
  },
  clearText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF5A5F",
  },
  trayWrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 6,
  },
  tray: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingLeft: 5,
    paddingRight: 13,
    paddingVertical: 5,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.13)",
  },
  chipSelected: {
    borderColor: "transparent",
    elevation: 8,
  },
  emojiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBadgeSelected: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 15 },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  chipTextSelected: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginLeft: -2,
  },
});
