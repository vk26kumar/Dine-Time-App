import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";

export default function RegisterStep2() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const isEdit = params.isEdit === "true";

  // ── Pre-fill from params ──
  const [street, setStreet] = useState((params.street as string) ?? "");
  const [city, setCity] = useState((params.city as string) ?? "");
  const [state, setState] = useState((params.state as string) ?? "");
  const [pincode, setPincode] = useState((params.pincode as string) ?? "");
  const [landmark, setLandmark] = useState((params.landmark as string) ?? "");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(() => {
    const lat = parseFloat(params.latitude as string);
    const lng = parseFloat(params.longitude as string);
    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
    return null;
  });
  const [fetching, setFetching] = useState(false);

  const handleGetLocation = async () => {
    setFetching(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoordinates({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const addresses = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (addresses.length > 0) {
        const addr = addresses[0];
        setStreet(addr.street || addr.name || "");
        setCity(addr.city || addr.subregion || "");
        setState(addr.region || "");
        setPincode(addr.postalCode || "");
      }
    } catch {
      Alert.alert("Error", "Failed to get location. Please enter manually.");
    } finally {
      setFetching(false);
    }
  };

  const handleContinue = () => {
    if (!street.trim())
      return Alert.alert("Required", "Please enter street address");
    if (!city.trim()) return Alert.alert("Required", "Please enter city");
    if (!state.trim()) return Alert.alert("Required", "Please enter state");
    if (!pincode.trim()) return Alert.alert("Required", "Please enter pincode");
    if (pincode.length !== 6)
      return Alert.alert("Invalid", "Pincode must be 6 digits");
    if (!coordinates)
      return Alert.alert(
        "Required",
        "Please fetch or confirm location coordinates",
      );

    router.push({
      pathname: "/(owner)/register-restaurant/step3",
      params: {
        ...params,
        street,
        city,
        state,
        pincode,
        landmark,
        latitude: coordinates.latitude.toString(),
        longitude: coordinates.longitude.toString(),
      },
    });
  };

  const fields = [
    {
      label: "Street Address",
      req: true,
      value: street,
      set: setStreet,
      placeholder: "123 Main Street, Area Name",
      icon: "home",
    },
    {
      label: "City",
      req: true,
      value: city,
      set: setCity,
      placeholder: "e.g. Kanpur",
      icon: "location-city",
    },
    {
      label: "State",
      req: true,
      value: state,
      set: setState,
      placeholder: "e.g. Uttar Pradesh",
      icon: "map",
    },
    {
      label: "Pincode",
      req: true,
      value: pincode,
      set: setPincode,
      placeholder: "6-digit pincode",
      icon: "pin",
      keyboard: "number-pad" as const,
      max: 6,
    },
    {
      label: "Landmark",
      req: false,
      value: landmark,
      set: setLandmark,
      placeholder: "Near City Mall (Optional)",
      icon: "place",
    },
  ];

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
            <Text style={styles.headerTitle}>
              {isEdit ? "Edit Restaurant" : "Add Restaurant"}
            </Text>
            <Text style={styles.headerSub}>Step 2 of 5 — Location</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: "40%" }]}
          />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= 2 && styles.dotActive,
                i === 2 && styles.dotCurrent,
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
        {/* GPS Button */}
        <TouchableOpacity
          onPress={handleGetLocation}
          disabled={fetching}
          activeOpacity={0.8}
          style={styles.gpsCard}
        >
          <LinearGradient
            colors={["#F5F0FF", "#EDF0F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gpsInner}
          >
            <View style={styles.gpsIconWrap}>
              {fetching ? (
                <ActivityIndicator size="small" color="#6B2FA0" />
              ) : (
                <MaterialIcons name="my-location" size={22} color="#6B2FA0" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>
                {fetching ? "Fetching location…" : "Use Current Location"}
              </Text>
              <Text style={styles.gpsSub}>Auto-fill address from GPS</Text>
            </View>
            {!fetching && (
              <MaterialIcons name="chevron-right" size={22} color="#8A95A3" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or enter manually</Text>
          <View style={styles.dividerLine} />
        </View>

        {fields.map((f) => (
          <View key={f.label} style={styles.card}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldIconWrap}>
                <MaterialIcons name={f.icon as any} size={15} color="#FF9F43" />
              </View>
              <Text style={styles.label}>
                {f.label}{" "}
                {f.req ? (
                  <Text style={styles.req}>*</Text>
                ) : (
                  <Text style={styles.opt}>(Optional)</Text>
                )}
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder={f.placeholder}
              value={f.value}
              onChangeText={f.set}
              keyboardType={f.keyboard || "default"}
              maxLength={f.max}
              placeholderTextColor="#B0B8C4"
            />
          </View>
        ))}

        {coordinates && (
          <View style={styles.coordCard}>
            <LinearGradient
              colors={["#F0FFF4", "#E8F5E9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.coordInner}
            >
              <View style={styles.coordIcon}>
                <MaterialIcons name="location-on" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coordLabel}>Location Confirmed</Text>
                <Text style={styles.coordValue}>
                  {coordinates.latitude.toFixed(6)},{" "}
                  {coordinates.longitude.toFixed(6)}
                </Text>
              </View>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </LinearGradient>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

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
  scrollContent: { padding: 16, gap: 12 },
  gpsCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gpsInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(107,47,160,0.2)",
  },
  gpsIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(107,47,160,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  gpsTitle: { fontSize: 14, fontWeight: "700", color: "#3D1A6E" },
  gpsSub: { fontSize: 12, color: "#8A95A3", marginTop: 2 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8ECF2" },
  dividerText: { fontSize: 11, color: "#B0B8C4", fontWeight: "600" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  fieldIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,159,67,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  req: { color: "#FF5A5F" },
  opt: { fontSize: 12, fontWeight: "500", color: "#8A95A3" },
  input: {
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F1B2D",
  },
  coordCard: { borderRadius: 16, overflow: "hidden" },
  coordInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.3)",
  },
  coordIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  coordLabel: { fontSize: 12, fontWeight: "700", color: "#10B981" },
  coordValue: { fontSize: 12, color: "#065F46", marginTop: 2 },
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