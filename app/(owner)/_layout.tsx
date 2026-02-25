import React from "react";
import { Tabs, useRouter, useSegments } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Custom Add Restaurant Button (center FAB) ───────────────────────────────

function RegisterRestaurantButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/(owner)/register-restaurant/step1")}
      activeOpacity={0.85}
      style={styles.fabWrap}
    >
      <LinearGradient
        colors={["#FF5A5F", "#FF8A5F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fab}
      >
        <MaterialIcons name="add-business" size={26} color="#FFFFFF" />
      </LinearGradient>
      {/* Glow ring */}
      <View style={styles.fabGlow} />
    </TouchableOpacity>
  );
}

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const tabs = state.routes.filter(
    (route: any) => !route.name.includes("register-restaurant"),
  );

  // Split into 2 left + FAB center + 2 right
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 4);

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
        case "my-restaurants":
          return "storefront";
        case "manage-bookings":
          return "event";
        case "analytics":
          return "insights";
        case "profile":
          return "person";
        default:
          return "circle";
      }
    })();

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.tabItem}
      >
        {/* Active indicator dot */}
        {isFocused && <View style={styles.activeDot} />}

        {/* Icon with active background */}
        <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
          {isFocused ? (
            <LinearGradient
              colors={["#FF5A5F", "#FF8A5F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGrad}
            >
              <MaterialIcons name={iconName} size={20} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <View style={styles.iconGrad}>
              <MaterialIcons
                name={iconName}
                size={20}
                color={theme.colors.textSecondary ?? "#8A95A3"}
              />
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

  return (
    <View
      style={[
        styles.tabBarOuter,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 },
      ]}
    >
      {/* Blurred card */}
      <View style={styles.tabBarCard}>
        {/* Left tabs */}
        <View style={styles.tabGroup}>{leftTabs.map(renderTab)}</View>

        {/* Center FAB spacer */}
        <View style={styles.fabSpacer}>
          <RegisterRestaurantButton />
        </View>

        {/* Right tabs */}
        <View style={styles.tabGroup}>{rightTabs.map(renderTab)}</View>
      </View>
    </View>
  );
}

// ─── Owner Layout ────────────────────────────────────────────────────────────

export default function OwnerLayout() {
  const segments = useSegments();
  const isRegisterFlow = segments.includes("register-restaurant");

  return (
    <Tabs
      tabBar={(props) => (isRegisterFlow ? null : <CustomTabBar {...props} />)}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="my-restaurants" options={{ title: "Restaurants" }} />
      <Tabs.Screen name="manage-bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="register-restaurant" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Tab bar outer wrapper
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
  },

  // Tab groups (left/right of FAB)
  tabGroup: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  // Individual tab
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
  iconWrap: {
    borderRadius: 14,
    overflow: "hidden",
  },
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
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: "#FF5A5F",
  },
  tabLabelInactive: {
    color: "#8A95A3",
  },

  // FAB (center)
  fabSpacer: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26, // lifts the FAB above the bar
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
    borderColor: "rgba(255,90,95,0.25)",
    top: -4,
    left: -4,
  },
});
