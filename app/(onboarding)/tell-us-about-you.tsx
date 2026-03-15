import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { RolePreference } from "../../types";

const C = {
  bg: "#FFF8F2",
  bgMid: "#FFF2E6",
  ember: "#F06020",
  emberLight: "#FF8C42",
  textPrimary: "#1A0800",
  textSub: "rgba(60,25,5,0.5)",
  white: "#FFFFFF",
};

export default function TellUsAboutYouScreen() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedRole, setSelectedRole] = useState<RolePreference>("consumer");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const formOp = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) setEmailVerified(currentUser.emailVerified);

    Animated.parallel([
      Animated.timing(formOp, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(formY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        Alert.alert(
          "Email Sent",
          "Verification email resent. Check your inbox.",
        );
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      await currentUser.reload();
      setEmailVerified(currentUser.emailVerified);
      if (currentUser.emailVerified) {
        Alert.alert("✅ Verified", "Your email is now verified!");
      } else {
        Alert.alert("Not Yet", "Email not verified yet. Check your inbox.");
      }
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Please enter your full name");
      return false;
    }
    if (!phoneNumber.trim() || phoneNumber.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user found. Please sign in again.");
      return;
    }
    await currentUser.reload();
    if (!currentUser.emailVerified) {
      Alert.alert(
        "Email Not Verified",
        "Please verify your email before continuing.",
        [
          { text: "Resend Email", onPress: handleResendVerification },
          { text: "OK", style: "cancel" },
        ],
      );
      return;
    }
    setLoading(true);
    try {
      await updateUserProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        rolePreference: selectedRole,
      });
      if (selectedRole === "owner" || selectedRole === "both") {
        Alert.alert(
          "Success",
          "Profile created! Restaurant registration coming soon.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(consumer)/explore"),
            },
          ],
        );
      } else {
        router.replace("/(consumer)/explore");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={st.root}>
      <LinearGradient
        colors={[C.bg, C.bgMid, "#FFEEDA"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            st.scroll,
            { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              st.inner,
              { opacity: formOp, transform: [{ translateY: formY }] },
            ]}
          >
            {/* ── Page Title ── */}
            <View style={st.titleBlock}>
              <Text style={st.pageTitle}>Complete{"\n"}Your Profile</Text>
              <Text style={st.pageSub}>
                A few details to personalise your experience
              </Text>
            </View>

            {/* ── Email Verification Banner ── */}
            {!emailVerified && (
              <View style={st.banner}>
                <LinearGradient
                  colors={["#FFF8EC", "#FFF3DC"]}
                  style={st.bannerGrad}
                >
                  <View style={st.bannerIconWrap}>
                    <MaterialIcons
                      name="mark-email-unread"
                      size={18}
                      color={C.ember}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.bannerTitle}>Verify your email</Text>
                    <Text style={st.bannerMsg}>
                      Check your inbox and verify before submitting.
                    </Text>
                    <View style={st.bannerActions}>
                      <TouchableOpacity
                        onPress={handleCheckVerification}
                        style={st.bannerBtn}
                      >
                        <Text style={st.bannerBtnText}>I've verified</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleResendVerification}
                        style={[st.bannerBtn, st.bannerBtnOutline]}
                        disabled={resending}
                      >
                        {resending ? (
                          <ActivityIndicator size="small" color={C.ember} />
                        ) : (
                          <Text style={[st.bannerBtnText, { color: C.ember }]}>
                            Resend
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* ── Verified badge ── */}
            {emailVerified && (
              <View style={st.verifiedBadge}>
                <MaterialIcons name="verified" size={15} color="#059669" />
                <Text style={st.verifiedText}>Email verified</Text>
              </View>
            )}

            {/* ── Full Name ── */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>
                Full Name <Text style={st.req}>*</Text>
              </Text>
              <View
                style={[st.inputWrap, focused === "name" && st.inputFocused]}
              >
                <LinearGradient
                  colors={
                    focused === "name"
                      ? [C.ember, "#FF9F43"]
                      : ["#F3F4F6", "#F3F4F6"]
                  }
                  style={st.inputStrip}
                >
                  <MaterialIcons
                    name="person"
                    size={16}
                    color={focused === "name" ? "#FFF" : "#9CA3AF"}
                  />
                </LinearGradient>
                <TextInput
                  style={st.textInput}
                  placeholder="John Doe"
                  placeholderTextColor="#C4CAD4"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* ── Email read-only ── */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>Email</Text>
              <View style={[st.inputWrap, st.inputDisabled]}>
                <LinearGradient
                  colors={["#F3F4F6", "#F3F4F6"]}
                  style={st.inputStrip}
                >
                  <MaterialIcons
                    name="mail-outline"
                    size={16}
                    color="#9CA3AF"
                  />
                </LinearGradient>
                <TextInput
                  style={[st.textInput, { color: "#9CA3AF" }]}
                  value={user?.email || ""}
                  editable={false}
                />
                <MaterialIcons
                  name={emailVerified ? "verified" : "error-outline"}
                  size={16}
                  color={emailVerified ? "#059669" : "#F59E0B"}
                  style={{ marginRight: 12 }}
                />
              </View>
            </View>

            {/* ── Phone ── */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>
                Phone Number <Text style={st.req}>*</Text>
              </Text>
              <View
                style={[st.inputWrap, focused === "phone" && st.inputFocused]}
              >
                <LinearGradient
                  colors={
                    focused === "phone"
                      ? [C.ember, "#FF9F43"]
                      : ["#F3F4F6", "#F3F4F6"]
                  }
                  style={st.inputStrip}
                >
                  <MaterialIcons
                    name="phone"
                    size={16}
                    color={focused === "phone" ? "#FFF" : "#9CA3AF"}
                  />
                </LinearGradient>
                <TextInput
                  style={st.textInput}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#C4CAD4"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* ── Role ── */}
            <View style={st.field}>
              <Text style={st.fieldLabel}>
                I want to <Text style={st.req}>*</Text>
              </Text>
              <Text style={st.fieldHelper}>Choose what applies to you</Text>
              <View style={st.roleRow}>
                {/* Consumer */}
                <TouchableOpacity
                  style={[
                    st.roleCard,
                    selectedRole === "consumer" && st.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole("consumer")}
                  activeOpacity={0.75}
                >
                  {selectedRole === "consumer" && (
                    <LinearGradient
                      colors={[C.ember, "#FF9F43"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={st.roleCardBar}
                    />
                  )}
                  <View
                    style={[
                      st.roleIcon,
                      selectedRole === "consumer" && st.roleIconSelected,
                    ]}
                  >
                    <MaterialIcons
                      name="restaurant-menu"
                      size={22}
                      color={selectedRole === "consumer" ? C.white : C.ember}
                    />
                  </View>
                  <Text
                    style={[
                      st.roleTitle,
                      selectedRole === "consumer" && st.roleTitleSelected,
                    ]}
                  >
                    Book Tables
                  </Text>
                  <Text style={st.roleDesc}>
                    Discover & reserve restaurants
                  </Text>
                  {selectedRole === "consumer" && (
                    <View style={st.roleCheck}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={C.ember}
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Owner */}
                <TouchableOpacity
                  style={[
                    st.roleCard,
                    selectedRole === "owner" && st.roleCardSelected,
                  ]}
                  onPress={() => setSelectedRole("owner")}
                  activeOpacity={0.75}
                >
                  {selectedRole === "owner" && (
                    <LinearGradient
                      colors={[C.ember, "#FF9F43"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={st.roleCardBar}
                    />
                  )}
                  <View
                    style={[
                      st.roleIcon,
                      selectedRole === "owner" && st.roleIconSelected,
                    ]}
                  >
                    <MaterialIcons
                      name="storefront"
                      size={22}
                      color={selectedRole === "owner" ? C.white : C.ember}
                    />
                  </View>
                  <Text
                    style={[
                      st.roleTitle,
                      selectedRole === "owner" && st.roleTitleSelected,
                    ]}
                  >
                    Own a Restaurant
                  </Text>
                  <Text style={st.roleDesc}>Register & manage your venue</Text>
                  {selectedRole === "owner" && (
                    <View style={st.roleCheck}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={C.ember}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Continue Button ── */}
            <TouchableOpacity
              onPress={handleContinue}
              disabled={loading}
              activeOpacity={0.86}
              style={[st.btnOuter, loading && { opacity: 0.65 }]}
            >
              <LinearGradient
                colors={["#FF5A5F", "#FF7A2F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={st.btn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={st.btnLabel}>Continue</Text>
                    <View style={st.btnChevron}>
                      <MaterialIcons
                        name="arrow-forward"
                        size={15}
                        color="#FF6B35"
                      />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  inner: { paddingHorizontal: 24 },

  // Title block
  titleBlock: { marginBottom: 24 },
  pageTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: C.textPrimary,
    letterSpacing: -1.2,
    lineHeight: 40,
    marginBottom: 8,
  },
  pageSub: { fontSize: 14, color: C.textSub, lineHeight: 20 },

  // Banner
  banner: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: "rgba(240,96,32,0.25)",
    shadowColor: C.ember,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerGrad: { flexDirection: "row", gap: 12, padding: 14 },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(240,96,32,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textPrimary,
    marginBottom: 2,
  },
  bannerMsg: {
    fontSize: 11,
    color: C.textSub,
    lineHeight: 15,
    marginBottom: 10,
  },
  bannerActions: { flexDirection: "row", gap: 8 },
  bannerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.ember,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  bannerBtnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: C.ember,
  },
  bannerBtnText: { fontSize: 12, fontWeight: "700", color: C.white },

  // Verified badge
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#6EE7B7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 18,
    alignSelf: "flex-start",
  },
  verifiedText: { fontSize: 12, fontWeight: "700", color: "#065F46" },

  // Fields
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  fieldHelper: { fontSize: 11, color: C.textSub, marginBottom: 8 },
  req: { color: "#EF4444" },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E9EBF0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputFocused: {
    borderColor: C.ember,
    shadowColor: C.ember,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  inputDisabled: { backgroundColor: "#F9FAFB" },
  inputStrip: {
    width: 42,
    height: "100%" as any,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: C.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontWeight: "500",
  },

  // Role cards
  roleRow: { flexDirection: "row", gap: 12 },
  roleCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(240,96,32,0.2)",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(240,96,32,0.04)",
    overflow: "hidden",
    position: "relative",
  },
  roleCardSelected: {
    borderColor: C.ember,
    backgroundColor: "rgba(240,96,32,0.07)",
  },
  roleCardBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(240,96,32,0.1)",
    borderWidth: 1,
    borderColor: "rgba(240,96,32,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 2,
  },
  roleIconSelected: { backgroundColor: C.ember, borderColor: C.ember },
  roleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: C.textPrimary,
    marginBottom: 4,
    marginLeft: 2,
  },
  roleTitleSelected: { color: C.ember },
  roleDesc: { fontSize: 11, color: C.textSub, lineHeight: 15, marginLeft: 2 },
  roleCheck: { position: "absolute", top: 10, right: 10 },

  // Button
  btnOuter: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
    borderRadius: 16,
  },
  btnLabel: {
    fontSize: 15.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  btnChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
