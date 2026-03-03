// app/(admin)/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

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
        case "dashboard": return "dashboard";
        case "revenue-analytics": return "analytics";
        case "pending-approvals": return "pending-actions";
        case "manage-users": return "people";
        case "manage-restaurants": return "restaurant";
        default: return "circle";
      }
    })();

    const isCenter = route.name === "pending-approvals";

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
              colors={isFocused ? ["#ff7f2a", "#f49b33"] : ["#F4F5F7", "#F4F5F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <MaterialIcons
                name="pending-actions"
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
              colors={["#ff7f2a", "#f49b33"]}
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

  const TAB_ORDER = [
    "dashboard",
    "manage-users",
    "pending-approvals",
    "manage-restaurants",
    "revenue-analytics",
  ];
  const visibleTabs = TAB_ORDER.map((name) =>
    state.routes.find((r: any) => r.name === name)
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

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="manage-users" options={{ title: "Users" }} />
      <Tabs.Screen name="pending-approvals" options={{ title: "Approvals" }} />
      <Tabs.Screen name="manage-restaurants" options={{ title: "Restaurants" }} />
      <Tabs.Screen name="revenue-analytics" options={{ title: "Revenue" }} />
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
    backgroundColor: "#ff7f2a",
  },
  iconWrap: { borderRadius: 14, overflow: "hidden" },
  iconWrapActive: {
    shadowColor: "#ff7f2a",
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
  tabLabelActive: { color: "#ff7f2a" },
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
    shadowColor: "#ff7f2a",
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
  fabGlowActive: { borderColor: "rgba(255,127,42,0.25)" },
});