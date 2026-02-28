import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutApp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(consumer)/profile")}>
          <MaterialIcons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>About App</Text>
      </LinearGradient>

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ opacity: fade, transform: [{ translateY: slide }] }}
      >
        {/* App Identity */}
        <View style={styles.cardCenter}>
          <LinearGradient colors={["#ff7f2a", "#f49b33"]} style={styles.logo}>
            <MaterialIcons name="restaurant" size={30} color="#fff" />
          </LinearGradient>

          <Text style={styles.appName}>Dine Time</Text>
          <Text style={styles.version}>Version 1.0.0 • Build 1</Text>

          <Text style={styles.desc}>
            Discover restaurants, reserve tables instantly, and enjoy seamless
            dining experiences — all in one powerful platform.
          </Text>
        </View>

        {/* Feature Grid */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What makes us special</Text>

          <View style={styles.grid}>
            <Feature icon="search" label="Smart Discovery" />
            <Feature icon="event-seat" label="Instant Booking" />
            <Feature icon="payments" label="Secure Payments" />
            <Feature icon="favorite" label="Favourites" />
          </View>
        </View>

        {/* Trust */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Why users love Dine Time</Text>

          <Bullet text="Fast & clean booking experience" />
          <Bullet text="Verified restaurant listings" />
          <Bullet text="Priority table access" />
          <Bullet text="Owner & customer dual mode" />
        </View>

        {/* Contact */}
        <TouchableOpacity
          style={styles.cardCenter}
          onPress={() => Linking.openURL("mailto:dinetimeteam@gmail.com")}
        >
          <MaterialIcons name="support-agent" size={26} color="#ff7f2a" />
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <Text style={styles.email}>dinetimeteam@gmail.com</Text>
          <Text style={styles.supportSub}>We usually reply within 24 hours</Text>
        </TouchableOpacity>

        {/* Legal */}
        <View style={styles.card}>
          <LegalRow label="Terms of Service" />
          <LegalRow label="Privacy Policy" />
          <LegalRow label="Licenses" />
        </View>

        <Text style={styles.footer}>Made with ❤️ in India</Text>
        <Text style={styles.copy}>© 2025 Dine Time. All rights reserved.</Text>
      </Animated.ScrollView>
    </View>
  );
}

const Feature = ({ icon, label }: any) => (
  <View style={styles.featureBox}>
    <MaterialIcons name={icon} size={22} color="#ff7f2a" />
    <Text style={styles.featureText}>{label}</Text>
  </View>
);

const Bullet = ({ text }: any) => (
  <Text style={styles.bullet}>• {text}</Text>
);

const LegalRow = ({ label }: any) => (
  <View style={styles.legalRow}>
    <Text style={styles.legalText}>{label}</Text>
    <MaterialIcons name="chevron-right" size={18} color="#999" />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },

  header: { paddingHorizontal: 20, paddingBottom: 14 },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  headerTitle: { fontSize: 18, fontWeight: "700", color: "#222" },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    borderRadius: 16,
  },

  cardCenter: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  appName: { fontSize: 24, fontWeight: "800", color: "#ff7f2a" },

  version: { fontSize: 12, color: "#666", marginBottom: 10 },

  desc: { fontSize: 14, textAlign: "center", color: "#444", lineHeight: 20 },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featureBox: {
    width: "48%",
    backgroundColor: "#fff7f0",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  featureText: { marginTop: 6, fontSize: 12, fontWeight: "600", color: "#444" },

  bullet: { fontSize: 13, color: "#444", marginBottom: 6 },

  email: { fontSize: 14, fontWeight: "700", color: "#ff7f2a" },

  supportSub: { fontSize: 11, color: "#999", marginTop: 4 },

  legalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
  },

  legalText: { fontSize: 13, color: "#444" },

  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
    color: "#666",
  },

  copy: {
    textAlign: "center",
    fontSize: 11,
    color: "#999",
    marginTop: 6,
  },
});