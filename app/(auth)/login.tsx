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
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Enter your email above first.");
      return;
    }
    try {
      await sendPasswordResetEmail(getAuth(), email.trim());
      Alert.alert(
        "Reset Link Sent",
        "Check your inbox for a password reset link.",
      );
    } catch (error: any) {
      const msg =
        error.code === "auth/user-not-found"
          ? "No account found with this email."
          : error.code === "auth/invalid-email"
            ? "Please enter a valid email address."
            : error.message;
      Alert.alert("Error", msg);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      shake();
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      shake();
      const msg =
        error.code === "auth/user-not-found"
          ? "No account found with this email."
          : error.code === "auth/wrong-password"
            ? "Incorrect password."
            : error.code === "auth/invalid-email"
              ? "Invalid email address."
              : error.code === "auth/too-many-requests"
                ? "Too many attempts. Try again later."
                : error.code === "auth/network-request-failed"
                  ? "Network error. Check your connection."
                  : error.message;
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Purple gradient top section */}
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
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSub}>
            Sign in to continue your dining journey
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
                editable={!loading}
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
                placeholder="Enter your password"
                placeholderTextColor="#C4CAD4"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
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
          </View>

          {/* Forgot */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotWrap}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login btn */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
            style={styles.loginBtnWrap}
          >
            <LinearGradient
              colors={loading ? ["#C4CAD4", "#C4CAD4"] : ["#FF5A5F", "#FF9F43"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Signup link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              activeOpacity={0.7}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
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

  forgotWrap: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontSize: 13, fontWeight: "700", color: "#FF5A5F" },

  loginBtnWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
  },
  loginBtnText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },

  signupRow: { flexDirection: "row", justifyContent: "center" },
  signupText: { fontSize: 14, color: "#8A95A3", fontWeight: "400" },
  signupLink: { fontSize: 14, fontWeight: "700", color: "#FF5A5F" },
});
