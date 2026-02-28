import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HelpSupport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(consumer)/profile")}>
          <MaterialIcons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Help & Support</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          Dine Time - Restaurant Reservation App: Frequently Asked Questions
        </Text>

        <Text style={styles.q}>1. What is Dine Time?</Text>
        <Text style={styles.a}>
          Dine Time is a comprehensive restaurant reservation application that lists various restaurants from across the country. It allows users to search for their favorite or nearby establishments and conveniently book a table.
        </Text>

        <Text style={styles.q}>2. How do I find restaurants on Dine Time?</Text>
        <Text style={styles.a}>
          You can easily search for restaurants using our app. You have the option to look for specific favorite restaurants or discover new ones based on your current location or proximity.
        </Text>

        <Text style={styles.q}>3. How do I book a table through Dine Time?</Text>
        <Text style={styles.a}>
          Once you have found your desired restaurant, you can proceed to book a table directly through the application using the original payment option provided.
        </Text>

        <Text style={styles.q}>4. What payment methods are available for reservations?</Text>
        <Text style={styles.a}>
          Dine Time facilitates reservations using the restaurant's original payment options. All payment processing is handled securely within the app.
        </Text>

        <Text style={styles.q}>5. Where do my payment funds go after booking a reservation?</Text>
        <Text style={styles.a}>
          All payments made for reservations through Dine Time are directly transferred into the respective restaurant's account.
        </Text>

        <Text style={styles.q}>6. What is Dine Time's refund policy for reservations?</Text>
        <Text style={styles.a}>
          Please be advised that all payments made for reservations through Dine Time are non-refundable. We encourage users to confirm their booking details carefully before completing the transaction.
        </Text>

        <Text style={styles.q}>7. I own a restaurant; how can I list it on the Dine Time app?</Text>
        <Text style={styles.a}>
          Restaurant owners can list their establishment by accessing a dedicated section within the app. You will need to switch to an "owner" profile and provide all necessary restaurant details for review.
        </Text>

        <Text style={styles.q}>8. What is the process for a restaurant to be approved for listing on Dine Time?</Text>
        <Text style={styles.a}>
          After an owner submits their restaurant details, our administration team will conduct a thorough verification process. If all provided information is found to be correct and compliant, the restaurant listing will be approved.
        </Text>

        <Text style={styles.q}>9. How long does the restaurant verification and approval process typically take?</Text>
        <Text style={styles.a}>
          While we strive for efficiency, the verification and approval timeline can vary depending on the completeness of the submitted details and the volume of applications. Our team will process it as quickly as possible.
        </Text>

        <Text style={styles.q}>10. Whom should I contact if I have further questions or require assistance?</Text>
        <Text style={styles.a}>
          For any queries related to Dine Time, its services, or your account, please do not hesitate to contact our support team via email at <Text style={{ fontWeight: "700" }}>dinetimeteam@gmail.com</Text>. We are here to assist you with any concerns or issues you may have.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

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

  content: { padding: 16, paddingBottom: 110 },

  title: { fontSize: 16, fontWeight: "700", marginBottom: 14, color: "#222" },

  q: { fontWeight: "700", marginTop: 12, color: "#ff7f2a" },

  a: { color: "#444", marginTop: 4, lineHeight: 20 },
});