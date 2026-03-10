import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { getAuth, sendEmailVerification } from "firebase/auth";

const { width: SW, height: SH } = Dimensions.get("window");

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";

function Toast({
  visible,
  type,
  title,
  message,
}: {
  visible: boolean;
  type: ToastType;
  title: string;
  message: string;
}) {
  const ty = useRef(new Animated.Value(-100)).current;
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(ty, {
        toValue: visible ? 0 : -100,
        tension: 72,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(op, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const cfg = {
    success: {
      bg: "#ECFDF5",
      border: "#6EE7B7",
      icon: "check-circle" as const,
      ic: "#059669",
      tc: "#065F46",
    },
    error: {
      bg: "#FFF1F2",
      border: "#FECDD3",
      icon: "error" as const,
      ic: "#E11D48",
      tc: "#9F1239",
    },
    info: {
      bg: "#EFF6FF",
      border: "#BFDBFE",
      icon: "info" as const,
      ic: "#2563EB",
      tc: "#1E3A8A",
    },
  }[type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
        { transform: [{ translateY: ty }], opacity: op },
      ]}
    >
      <View style={[styles.toastIconWrap, { backgroundColor: cfg.ic + "15" }]}>
        <MaterialIcons name={cfg.icon} size={17} color={cfg.ic} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toastTitle, { color: cfg.tc }]}>{title}</Text>
        {!!message && <Text style={styles.toastMsg}>{message}</Text>}
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
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
  const [focused, setFocused] = useState<string | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    type: "error" as ToastType,
    title: "",
    message: "",
  });

  const shakeX = useRef(new Animated.Value(0)).current;
  const orb1 = useRef(new Animated.Value(1)).current;
  const orb2 = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(24)).current;

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 55,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(formSlide, {
          toValue: 0,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, {
          toValue: 1.2,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(orb1, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, {
          toValue: 1.3,
          duration: 3600,
          useNativeDriver: true,
        }),
        Animated.timing(orb2, {
          toValue: 1,
          duration: 3600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const showToast = (type: ToastType, title: string, message = "") => {
    setToast({ visible: true, type, title, message });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
  };

  const shake = () =>
    Animated.sequence([
      Animated.timing(shakeX, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 7,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: -7,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeX, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

  const getReadableError = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try signing in.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password too weak. Use at least 6 characters.";
      case "auth/network-request-failed":
        return "No connection. Check your internet.";
      case "auth/too-many-requests":
        return "Verification link already sent. Check your inbox.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 6)
      return { label: "Too short", color: "#EF4444", w: "25%" };
    if (password.length < 8)
      return { label: "Weak", color: "#FF9F43", w: "50%" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return { label: "Fair", color: "#FBBF24", w: "65%" };
    return { label: "Strong", color: "#10B981", w: "100%" };
  };

  const strength = passwordStrength();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      shake();
      showToast("error", "Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      shake();
      showToast("error", "Weak password", "Use at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      shake();
      showToast(
        "error",
        "Passwords don't match",
        "Please re-enter to confirm.",
      );
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
      if (!auth.currentUser) throw new Error("USER_INIT_FAILED");
      await sendEmailVerification(auth.currentUser);

      showToast(
        "success",
        "Verification sent",
        "Check your inbox before continuing.",
      );
      setTimeout(() => router.replace("/(onboarding)/tell-us-about-you"), 1200);
    } catch (error: any) {
      const code = error?.code || error?.message;
      if (code === "auth/too-many-requests") {
        showToast(
          "info",
          "Email sent",
          "Check your inbox for the verification link.",
        );
        setTimeout(
          () => router.replace("/(onboarding)/tell-us-about-you"),
          1200,
        );
      } else {
        shake();
        showToast("error", "Signup failed", getReadableError(code));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Toast */}
      <View
        style={[styles.toastWrap, { top: insets.top + 12 }]}
        pointerEvents="none"
      >
        <Toast {...toast} />
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "android" ? 80 : 20}
        enableResetScrollToCoords={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top }]}>
          <LinearGradient
            colors={["#0D1826", "#132338", "#0D1826"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Orbs */}
          <Animated.View
            style={[styles.orb1, { transform: [{ scale: orb1 }] }]}
          />
          <Animated.View
            style={[styles.orb2, { transform: [{ scale: orb2 }] }]}
          />

          {/* Diagonal lines */}
          {[0.15, 0.38, 0.62, 0.85].map((r, i) => (
            <View key={i} style={[styles.diag, { left: SW * r }]} />
          ))}

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 10 }]}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name="arrow-back"
              size={18}
              color="rgba(255,255,255,0.65)"
            />
          </TouchableOpacity>

          {/* ── Centered brand ── */}
          <Animated.View
            style={[
              styles.brandWrap,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
          >
            {/* ── DineTime Logo Image ── */}
            <Image
              source={require("../../assets/DTime.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandCaption}>
              Join thousands of food lovers ✦
            </Text>
          </Animated.View>

          {/* Arch */}
          <View style={styles.arch}>
            <View style={styles.archShape} />
          </View>
        </View>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <Animated.View
          style={[
            styles.formWrap,
            { paddingBottom: insets.bottom + 32 },
            { opacity: formOpacity, transform: [{ translateY: formSlide }] },
          ]}
        >
          <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSubtitle}>
              Start your dining journey today
            </Text>

            {/* ── Email ── */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View
                style={[
                  styles.inputWrap,
                  focused === "email" && styles.inputWrapFocused,
                ]}
              >
                <LinearGradient
                  colors={
                    focused === "email"
                      ? ["#FF5A5F", "#FF9F43"]
                      : ["#F3F4F6", "#F3F4F6"]
                  }
                  style={styles.inputStrip}
                >
                  <MaterialIcons
                    name="mail-outline"
                    size={16}
                    color={focused === "email" ? "#FFF" : "#9CA3AF"}
                  />
                </LinearGradient>
                <TextInput
                  style={styles.textInput}
                  placeholder="you@example.com"
                  placeholderTextColor="#C4CAD4"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
                {email.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setEmail("")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.inputAction}
                  >
                    <MaterialIcons name="cancel" size={16} color="#D1D5DB" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Password ── */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  focused === "password" && styles.inputWrapFocused,
                ]}
              >
                <LinearGradient
                  colors={
                    focused === "password"
                      ? ["#FF5A5F", "#FF9F43"]
                      : ["#F3F4F6", "#F3F4F6"]
                  }
                  style={styles.inputStrip}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={16}
                    color={focused === "password" ? "#FFF" : "#9CA3AF"}
                  />
                </LinearGradient>
                <TextInput
                  ref={passwordRef}
                  style={styles.textInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#C4CAD4"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.inputAction}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={17}
                    color="#C4CAD4"
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
                  <Text
                    style={[styles.strengthLabel, { color: strength.color }]}
                  >
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Confirm Password ── */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Confirm password</Text>
              <View
                style={[
                  styles.inputWrap,
                  focused === "confirm" && styles.inputWrapFocused,
                  confirmPassword &&
                    confirmPassword !== password &&
                    styles.inputWrapError,
                ]}
              >
                <LinearGradient
                  colors={
                    confirmPassword && confirmPassword !== password
                      ? ["#EF4444", "#EF4444"]
                      : focused === "confirm"
                        ? ["#FF5A5F", "#FF9F43"]
                        : ["#F3F4F6", "#F3F4F6"]
                  }
                  style={styles.inputStrip}
                >
                  <MaterialIcons
                    name="lock-outline"
                    size={16}
                    color={
                      confirmPassword && confirmPassword !== password
                        ? "#FFF"
                        : focused === "confirm"
                          ? "#FFF"
                          : "#9CA3AF"
                    }
                  />
                </LinearGradient>
                <TextInput
                  ref={confirmRef}
                  style={styles.textInput}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#C4CAD4"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused(null)}
                />
                {confirmPassword ? (
                  <View style={styles.inputAction}>
                    <MaterialIcons
                      name={
                        confirmPassword === password ? "check-circle" : "cancel"
                      }
                      size={18}
                      color={
                        confirmPassword === password ? "#10B981" : "#EF4444"
                      }
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowConfirm((p) => !p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.inputAction}
                  >
                    <MaterialIcons
                      name={showConfirm ? "visibility" : "visibility-off"}
                      size={17}
                      color="#C4CAD4"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Terms ── */}
            <Text style={styles.termsText}>
              By creating an account you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* ── Create account button ── */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.86}
              style={[styles.signupOuter, loading && { opacity: 0.65 }]}
            >
              <LinearGradient
                colors={["#FF5A5F", "#FF7A2F", "#FF9F43"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.signupLabel}>Create Account</Text>
                    <View style={styles.signupChevron}>
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

            {/* ── Inline sign in prompt ── */}
            <View style={styles.signinRow}>
              <Text style={styles.signinPrompt}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text style={styles.signinLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FB" },
  scrollContent: { flexGrow: 1 },

  // Toast
  toastWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 12,
  },
  toastIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  toastTitle: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  toastMsg: { fontSize: 11, color: "#6B7280", lineHeight: 15 },

  // Hero
  hero: {
    height: SH * 0.3,
    minHeight: 195,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  orb1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(255,80,80,0.14)",
    top: -110,
    right: -90,
  },
  orb2: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,150,40,0.1)",
    bottom: 10,
    left: -70,
  },
  diag: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  backBtn: {
    position: "absolute",
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Brand
  brandWrap: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 36,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  brandCaption: {
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
    fontWeight: "500",
    letterSpacing: 0.5,
  },

  arch: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 38,
    overflow: "hidden",
  },
  archShape: {
    position: "absolute",
    left: -SW * 0.12,
    right: -SW * 0.12,
    top: 0,
    height: 76,
    backgroundColor: "#F8F9FB",
    borderTopLeftRadius: SW * 0.65,
    borderTopRightRadius: SW * 0.65,
  },

  // Form
  formWrap: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0D1826",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
    marginBottom: 22,
  },

  // Fields
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.1,
    marginBottom: 6,
  },

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
  inputWrapFocused: {
    borderColor: "#FF5A5F",
    shadowColor: "#FF5A5F",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  inputWrapError: {
    borderColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
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
    color: "#0D1826",
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  inputAction: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // Strength
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
    backgroundColor: "#E9EBF0",
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    minWidth: 52,
    textAlign: "right",
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18,
  },
  termsLink: { color: "#FF5A5F", fontWeight: "700" },

  // Create account button
  signupOuter: {
    borderRadius: 13,
    overflow: "hidden",
    marginBottom: 28,
    shadowColor: "#FF5A5F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 7,
  },
  signupGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 10,
  },
  signupLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 0.2,
  },
  signupChevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Inline sign in text
  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signinPrompt: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  signinLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF5A5F",
    textDecorationColor: "#FF5A5F",
  },
});
