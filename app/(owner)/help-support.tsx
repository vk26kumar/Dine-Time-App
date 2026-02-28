import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function OwnerHelpSupport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <TouchableOpacity
          onPress={() => router.push("/(owner)/profile")}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help & Support</Text>

        <View style={styles.headerSpacer} />
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Need help with Dine Time?</Text>

          <Text style={styles.desc}>
            For any queries related to your restaurant, bookings, payments or
            account, feel free to contact our support team.
          </Text>

          <TouchableOpacity
            style={styles.emailBox}
            onPress={() =>
              Linking.openURL("mailto:dinetimeteam@gmail.com")
            }
          >
            <MaterialIcons name="email" size={18} color="#FF5A5F" />
            <Text style={styles.emailText}>dinetimeteam@gmail.com</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Owner FAQs</Text>

          <Faq
            q="How do I list my restaurant?"
            a="Switch to owner mode and complete the restaurant registration steps."
          />

          <Faq
            q="How long does approval take?"
            a="Approval time depends on verification of the submitted details."
          />

          <Faq
            q="Where do my payments go?"
            a="All booking payments are transferred directly to your registered account."
          />

          <Faq
            q="Can I manage bookings?"
            a="Yes, you can accept, cancel or track bookings from your dashboard."
          />
        </View>

        <Text style={styles.footer}>
          © 2025 Dine Time. All Rights Reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const Faq = ({ q, a }: any) => (
  <View style={styles.faqItem}>
    <Text style={styles.faqQ}>{q}</Text>
    <Text style={styles.faqA}>{a}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  headerSpacer: { width: 38 },

  scroll: { padding: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
    color: "#0F1B2D",
  },

  desc: {
    fontSize: 13,
    color: "#8A95A3",
    marginBottom: 14,
    lineHeight: 18,
  },

  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF0F0",
    padding: 12,
    borderRadius: 12,
  },

  emailText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF5A5F",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
    color: "#0F1B2D",
  },

  faqItem: { marginBottom: 10 },

  faqQ: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F1B2D",
  },

  faqA: {
    fontSize: 12,
    color: "#8A95A3",
    marginTop: 2,
  },

  footer: {
    fontSize: 11,
    color: "#C4CAD4",
    textAlign: "center",
    marginTop: 10,
  },
});