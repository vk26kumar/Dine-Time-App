// app/(consumer)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HIDE_TAB_BAR_ON = [
  "restaurant/[id]",
  "booking/[id]",
  "payment",
  "location-selector",
  "favourites",
  "notifications",
  "search",
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const currentRoute = state.routes[state.index]?.name ?? "";
  if (HIDE_TAB_BAR_ON.includes(currentRoute)) return null;

  const renderTab = (route: any) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === state.routes.indexOf(route);
    const label = options.title ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const iconName = (() => {
      switch (route.name) {
        case "bookings":
          return "event-note";
        case "explore":
          return "explore";
        case "profile":
          return "person";
        default:
          return "circle";
      }
    })();

    const isCenter = route.name === "explore";

    if (isCenter) {
      return (
        <TouchableOpacity
          key={route.key}
          onPress={onPress}
          activeOpacity={0.85}
          style={styles.fabSpacer}
        >
          <View style={styles.fabWrap}>
            <LinearGradient
              colors={
                isFocused ? ["#FF5A5F", "#FF8A5F"] : ["#F4F5F7", "#F4F5F7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <MaterialIcons
                name="explore"
                size={26}
                color={isFocused ? "#FFFFFF" : "#8A95A3"}
              />
            </LinearGradient>
            <View style={[styles.fabGlow, isFocused && styles.fabGlowActive]} />
          </View>
          <Text
            style={[
              styles.tabLabel,
              isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
              { marginTop: 4 },
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.tabItem}
      >
        {isFocused && <View style={styles.activeDot} />}
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          {isFocused ? (
            <LinearGradient
              colors={["#FF5A5F", "#FF8A5F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGrad}
            >
              <MaterialIcons name={iconName as any} size={20} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.iconGrad}>
              <MaterialIcons name={iconName as any} size={20} color="#8A95A3" />
            </View>
          )}
        </View>
        <Text
          style={[
            styles.tabLabel,
            isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const TAB_ORDER = ["bookings", "explore", "profile"];
  const visibleTabs = TAB_ORDER.map((name) =>
    state.routes.find((r: any) => r.name === name),
  ).filter(Boolean);

  return (
    <View
      style={[
        styles.tabBarOuter,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
      ]}
    >
      <View style={styles.tabBarCard}>{visibleTabs.map(renderTab)}</View>
    </View>
  );
}

export default function ConsumerLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* ── Visible tabs ── */}
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* ── Hidden screens ── */}
      <Tabs.Screen name="restaurant/[id]" options={{ href: null }} />
      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="location-selector" options={{ href: null }} />
      <Tabs.Screen name="favourites" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
    backgroundColor: "transparent",
  },
  tabBarCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginBottom: 6,
    overflow: "visible",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    position: "relative",
    paddingVertical: 2,
  },
  activeDot: {
    position: "absolute",
    top: -10,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF5A5F",
  },
  iconWrap: { borderRadius: 14, overflow: "hidden" },
  iconWrapActive: {
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconGrad: {
    width: 40,
    height: 36,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.1 },
  tabLabelActive: { color: "#FF5A5F" },
  tabLabelInactive: { color: "#8A95A3" },
  fabSpacer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
  },
  fabWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
  },
  fabGlow: {
    position: "absolute",
    width: 66,
    height: 66,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "transparent",
    top: -4,
    left: -4,
  },
  fabGlowActive: { borderColor: "rgba(255,90,95,0.25)" },
});
