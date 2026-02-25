import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { getAuth, sendEmailVerification } from "firebase/auth";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Don't Match",
        "Please make sure both passwords match.",
      );
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      shake();
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      const auth = getAuth();
      let attempts = 0;
      while (!auth.currentUser && attempts < 5) {
        await new Promise((r) => setTimeout(r, 300));
        attempts++;
      }
      if (!auth.currentUser)
        throw new Error("Failed to initialize user. Please try again.");
      await sendEmailVerification(auth.currentUser);
      Alert.alert(
        "Verification Email Sent",
        "Check your inbox and verify your email before continuing.",
      );
      setTimeout(() => router.replace("/(onboarding)/tell-us-about-you"), 800);
    } catch (error: any) {
      if (error.code === "auth/too-many-requests") {
        Alert.alert(
          "Email Sent",
          "Verification link has been sent to your email.",
        );
        setTimeout(
          () => router.replace("/(onboarding)/tell-us-about-you"),
          800,
        );
      } else {
        shake();
        Alert.alert("Signup Failed", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6)
      return { label: "Too short", color: "#EF4444", w: "25%" };
    if (password.length < 8)
      return { label: "Weak", color: "#FF9F43", w: "50%" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Fair", color: "#FF9F43", w: "65%" };
    return { label: "Strong", color: "#10B981", w: "100%" };
  };
  const strength = passwordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGrad, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerOrb} />
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoBadgeGrad}
            >
              <MaterialIcons name="restaurant" size={14} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>
            Join thousands of food lovers today
          </Text>
        </View>
        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputRow,
                focusedField === "email" && styles.inputRowFocused,
              ]}
            >
              <View style={styles.inputIconWrap}>
                <MaterialIcons
                  name="email"
                  size={16}
                  color={focusedField === "email" ? "#FF5A5F" : "#8A95A3"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#C4CAD4"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputRow,
                focusedField === "password" && styles.inputRowFocused,
              ]}
            >
              <View style={styles.inputIconWrap}>
                <MaterialIcons
                  name="lock"
                  size={16}
                  color={focusedField === "password" ? "#FF5A5F" : "#8A95A3"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor="#C4CAD4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={18}
                  color="#8A95A3"
                />
              </TouchableOpacity>
            </View>
            {/* Strength bar */}
            {strength && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBg}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: strength.w as any,
                        backgroundColor: strength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Confirm Password</Text>
            <View
              style={[
                styles.inputRow,
                focusedField === "confirm" && styles.inputRowFocused,
                confirmPassword &&
                  confirmPassword !== password &&
                  styles.inputRowError,
              ]}
            >
              <View style={styles.inputIconWrap}>
                <MaterialIcons
                  name="lock"
                  size={16}
                  color={focusedField === "confirm" ? "#FF5A5F" : "#8A95A3"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#C4CAD4"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
              />
              {confirmPassword ? (
                <MaterialIcons
                  name={
                    confirmPassword === password ? "check-circle" : "cancel"
                  }
                  size={18}
                  color={confirmPassword === password ? "#10B981" : "#EF4444"}
                />
              ) : (
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons
                    name={showConfirm ? "visibility" : "visibility-off"}
                    size={18}
                    color="#8A95A3"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By creating an account you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Signup btn */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.88}
            style={styles.signupBtnWrap}
          >
            <LinearGradient
              colors={loading ? ["#C4CAD4", "#C4CAD4"] : ["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.signupBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.signupBtnText}>Create Account</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  headerGrad: {
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 0,
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  headerOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,90,95,0.15)",
    top: -40,
    right: -30,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  headerContent: { alignItems: "flex-start", marginBottom: 24 },
  logoBadge: { borderRadius: 10, overflow: "hidden", marginBottom: 14 },
  logoBadgeGrad: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "400",
  },
  accentBar: { flexDirection: "row", height: 3, marginTop: 20 },
  accentSeg: { flex: 1 },

  scrollContent: { padding: 20 },
  fieldWrap: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F1B2D",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  inputRowFocused: {
    borderColor: "#FF5A5F",
    shadowColor: "#FF5A5F",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  inputRowError: { borderColor: "#EF4444" },
  inputIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F1B2D",
    paddingVertical: 12,
    fontWeight: "500",
  },

  strengthWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  strengthBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EEF0F4",
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    minWidth: 50,
    textAlign: "right",
  },

  termsText: {
    fontSize: 12,
    color: "#8A95A3",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  termsLink: { color: "#FF5A5F", fontWeight: "700" },

  signupBtnWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  signupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
  },
  signupBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },

  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginText: { fontSize: 14, color: "#8A95A3" },
  loginLink: { fontSize: 14, fontWeight: "700", color: "#FF5A5F" },
});
