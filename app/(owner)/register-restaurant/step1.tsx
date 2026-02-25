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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Aligned with Restaurant type — cuisine: string[]
const CUISINES = [
  { name: "Indian", emoji: "🍛" },
  { name: "Chinese", emoji: "🍜" },
  { name: "Italian", emoji: "🍕" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Thai", emoji: "🍲" },
  { name: "Japanese", emoji: "🍣" },
  { name: "Continental", emoji: "🥩" },
  { name: "Fast Food", emoji: "🍔" },
  { name: "Cafe", emoji: "☕" },
  { name: "American", emoji: "🍟" },
  { name: "Mediterranean", emoji: "🥗" },
  { name: "Korean", emoji: "🥘" },
];

// bookingFeePerPerson replaces priceRange — number stored in DB
const BOOKING_FEE_OPTIONS = [
  { label: "Budget", sublabel: "₹0 – ₹199", value: 49, tier: "₹" },
  { label: "Standard", sublabel: "₹200 – ₹499", value: 99, tier: "₹₹" },
  { label: "Premium", sublabel: "₹500 – ₹999", value: 199, tier: "₹₹₹" },
  { label: "Luxury", sublabel: "₹1000+", value: 299, tier: "₹₹₹₹" },
];

export default function RegisterStep1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(299);
  const [customFee, setCustomFee] = useState("");
  const bookingFeePerPerson =
    selectedPreset !== null ? selectedPreset : parseInt(customFee) || 0;
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter((c) => c !== cuisine));
    } else {
      if (selectedCuisines.length < 5) {
        setSelectedCuisines([...selectedCuisines, cuisine]);
      } else {
        Alert.alert("Limit Reached", "You can select up to 5 cuisines");
      }
    }
  };

  const handleContinue = () => {
    if (!name.trim())
      return Alert.alert("Required", "Please enter restaurant name");
    if (!description.trim())
      return Alert.alert("Required", "Please enter a description");
    if (selectedCuisines.length === 0)
      return Alert.alert("Required", "Select at least one cuisine");
    if (!phone.trim())
      return Alert.alert("Required", "Please enter contact phone");
    if (bookingFeePerPerson < 1)
      return Alert.alert("Required", "Please set a booking fee per person");

    router.push({
      pathname: "/(owner)/register-restaurant/step2",
      params: {
        name,
        description,
        cuisine: selectedCuisines.join(","),
        bookingFeePerPerson: bookingFeePerPerson.toString(),
        phone,
        email,
        website,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      {/* Gradient Header — extends into status bar via paddingTop: insets.top */}
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
            <MaterialIcons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add Restaurant</Text>
            <Text style={styles.headerSub}>Step 1 of 5 — Basic Info</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        {/* Progress */}
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: "20%" }]}
          />
        </View>
        {/* Step dots */}
        <View style={styles.stepDots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.dot, i === 1 && styles.dotActive]} />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Restaurant Name */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="restaurant" size={16} color="#FF9F43" />
            </View>
            <Text style={styles.label}>
              Restaurant Name <Text style={styles.req}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="e.g. The Grand Spice"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#B0B8C4"
          />
        </View>

        {/* Description */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="description" size={16} color="#FF9F43" />
            </View>
            <Text style={styles.label}>
              Description <Text style={styles.req}>*</Text>
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell guests what makes your restaurant special..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#B0B8C4"
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/300</Text>
        </View>

        {/* Cuisine Types */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="local-dining" size={16} color="#FF9F43" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                Cuisine Types <Text style={styles.req}>*</Text>
              </Text>
              <Text style={styles.helper}>
                {selectedCuisines.length}/5 selected
              </Text>
            </View>
          </View>
          <View style={styles.chipGrid}>
            {CUISINES.map((c) => {
              const sel = selectedCuisines.includes(c.name);
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.chip, sel && styles.chipSel]}
                  onPress={() => toggleCuisine(c.name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.chipEmoji}>{c.emoji}</Text>
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                    {c.name}
                  </Text>
                  {sel && <MaterialIcons name="check" size={13} color="#FFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Booking Fee (replaces priceRange) */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="payments" size={16} color="#FF9F43" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>
                Booking Fee per Person <Text style={styles.req}>*</Text>
              </Text>
              <Text style={styles.helper}>
                Non-refundable. Charged at time of booking.
              </Text>
            </View>
          </View>
          <View style={styles.feeGrid}>
            {BOOKING_FEE_OPTIONS.map((opt) => {
              const sel = selectedPreset === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.feeCard, sel && styles.feeCardSel]}
                  onPress={() => {
                    setSelectedPreset(opt.value);
                    setCustomFee("");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.feeTier, sel && styles.feeTierSel]}>
                    {opt.tier}
                  </Text>
                  <Text style={[styles.feeLabel, sel && styles.feeLabelSel]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.feeSub, sel && styles.feeSubSel]}>
                    {opt.sublabel}
                  </Text>
                  <Text style={[styles.feeAmount, sel && styles.feeAmountSel]}>
                    ₹{opt.value}/head
                  </Text>
                  {sel && (
                    <View style={styles.feeCheck}>
                      <MaterialIcons name="check" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom fee input */}
          <View style={styles.customFeeRow}>
            <View style={styles.customFeeDivider}>
              <View style={styles.customFeeLine} />
              <Text style={styles.customFeeOr}>or set custom amount</Text>
              <View style={styles.customFeeLine} />
            </View>
            <View
              style={[
                styles.customFeeInput,
                selectedPreset === null && styles.customFeeInputActive,
              ]}
            >
              <Text style={styles.customFeeSymbol}>₹</Text>
              <TextInput
                style={styles.customFeeField}
                placeholder="e.g. 149"
                value={customFee}
                onChangeText={(v) => {
                  const cleaned = v.replace(/[^0-9]/g, "");
                  setCustomFee(cleaned);
                  if (cleaned) setSelectedPreset(null);
                  else setSelectedPreset(299);
                }}
                keyboardType="number-pad"
                placeholderTextColor="#B0B8C4"
                maxLength={5}
              />
              <Text style={styles.customFeePerHead}>/person</Text>
            </View>
            {selectedPreset === null && customFee.length > 0 && (
              <View style={styles.customFeeHint}>
                <MaterialIcons name="info-outline" size={13} color="#6B2FA0" />
                <Text style={styles.customFeeHintText}>
                  Guests will be charged ₹{customFee} per person at booking
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Phone */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="phone" size={16} color="#FF9F43" />
            </View>
            <Text style={styles.label}>
              Contact Phone <Text style={styles.req}>*</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#B0B8C4"
          />
        </View>

        {/* Email */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="email" size={16} color="#A855F7" />
            </View>
            <Text style={styles.label}>
              Email <Text style={styles.opt}>(Optional)</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="restaurant@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#B0B8C4"
          />
        </View>

        {/* Website */}
        <View style={styles.card}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldIconWrap}>
              <MaterialIcons name="language" size={16} color="#A855F7" />
            </View>
            <Text style={styles.label}>
              Website <Text style={styles.opt}>(Optional)</Text>
            </Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="https://yourrestaurant.com"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
            placeholderTextColor="#B0B8C4"
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Bottom CTA */}
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

const CARD_RADIUS = 16;
const INPUT_BG = "#F8F9FC";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    overflow: "hidden",
  },
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
  dotActive: { width: 20, backgroundColor: "#FF9F43" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "#FFF",
    borderRadius: CARD_RADIUS,
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
    marginBottom: 12,
  },
  fieldIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,159,67,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  label: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  req: { color: "#FF5A5F" },
  opt: { fontSize: 12, fontWeight: "500", color: "#8A95A3" },
  helper: { fontSize: 11, color: "#8A95A3", marginTop: 2 },
  charCount: {
    fontSize: 11,
    color: "#B0B8C4",
    textAlign: "right",
    marginTop: 6,
  },

  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F1B2D",
  },
  textArea: { minHeight: 100, paddingTop: 12 },

  // Cuisine chips
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: INPUT_BG,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
  },
  chipSel: {
    backgroundColor: "#FF5A5F",
    borderColor: "#FF5A5F",
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: "600", color: "#0F1B2D" },
  chipTextSel: { color: "#FFF" },

  // Booking fee grid
  feeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  feeCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    backgroundColor: INPUT_BG,
    padding: 14,
    position: "relative",
  },
  feeCardSel: {
    borderColor: "#6B2FA0",
    backgroundColor: "#F5F0FF",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  feeTier: {
    fontSize: 20,
    fontWeight: "800",
    color: "#C4B5D0",
    marginBottom: 4,
  },
  feeTierSel: { color: "#6B2FA0" },
  feeLabel: { fontSize: 13, fontWeight: "700", color: "#0F1B2D" },
  feeLabelSel: { color: "#3D1A6E" },
  feeSub: { fontSize: 11, color: "#8A95A3", marginTop: 2 },
  feeSubSel: { color: "#6B2FA0" },
  feeAmount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0B8C4",
    marginTop: 6,
  },
  feeAmountSel: { color: "#6B2FA0" },
  feeCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#6B2FA0",
    justifyContent: "center",
    alignItems: "center",
  },

  // Custom fee
  customFeeRow: { marginTop: 14, gap: 10 },
  customFeeDivider: { flexDirection: "row", alignItems: "center", gap: 10 },
  customFeeLine: { flex: 1, height: 1, backgroundColor: "#EEF0F4" },
  customFeeOr: { fontSize: 11, fontWeight: "600", color: "#B0B8C4" },
  customFeeInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  customFeeInputActive: { borderColor: "#6B2FA0", backgroundColor: "#F5F0FF" },
  customFeeSymbol: { fontSize: 16, fontWeight: "700", color: "#6B2FA0" },
  customFeeField: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0F1B2D",
    paddingVertical: 0,
  },
  customFeePerHead: { fontSize: 12, fontWeight: "600", color: "#8A95A3" },
  customFeeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(107,47,160,0.06)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customFeeHintText: {
    fontSize: 12,
    color: "#6B2FA0",
    fontWeight: "500",
    flex: 1,
  },

  // Bottom bar
  bottomBar: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
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
    borderRadius: 14,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.2,
  },
});
