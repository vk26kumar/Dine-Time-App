// components/DeleteAccountModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";

const C = {
  accent: "#ff7f2a",
  accentSoft: "#f49b33",
  accentBg: "#fff7f0",
  accentBorder: "#ffd7b0",
  white: "#FFFFFF",
  bg: "#f8f9fb",
  text: "#222222",
  textSub: "#666666",
  textMuted: "#999999",
  divider: "#f2f2f2",
  error: "#ff4b4b",
  errorBg: "#fff0f0",
};

// ── Sheet animation hook ──────────────────────────────────────────────────────
function useSheetAnim(visible: boolean, initialY = 500) {
  const slideAnim = useRef(new Animated.Value(initialY)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: visible ? 1 : 0,
        duration: visible ? 250 : 200,
        useNativeDriver: true,
      }),
      visible
        ? Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 12,
            useNativeDriver: true,
          })
        : Animated.timing(slideAnim, {
            toValue: initialY,
            duration: 200,
            useNativeDriver: true,
          }),
    ]).start();
  }, [visible]);

  return { slideAnim, fadeAnim };
}

// ── Core deletion logic ───────────────────────────────────────────────────────
const performAccountDeletion = async (
  uid: string,
  isOwner: boolean,
): Promise<void> => {
  const auth = getAuth();

  // 1. Delete Firebase Auth first — if this fails, nothing else runs
  //    (prevents ghost accounts with deleted Firestore data)
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }

  // 2. Batch delete: user doc + restaurant docs (owner only)
  const batch = writeBatch(db);

  batch.delete(doc(db, "users", uid));

  const restaurantIds: string[] = [];
  if (isOwner) {
    const rSnap = await getDocs(
      query(collection(db, "restaurants"), where("ownerId", "==", uid)),
    );
    rSnap.forEach((d) => {
      restaurantIds.push(d.id);
      batch.delete(d.ref);
    });
  }

  await batch.commit();

  // 3. Anonymize bookings — runs after batch, non-blocking per-doc updates
  //    Payment fields (amount, razorpayPaymentId, etc.) are untouched
  const anonPromises: Promise<void>[] = [];

  // Bookings made BY this user
  const userBookingsSnap = await getDocs(
    query(collection(db, "bookings"), where("userId", "==", uid)),
  );
  userBookingsSnap.forEach((d) => {
    anonPromises.push(
      updateDoc(d.ref, {
        userId: "",
        userName: "Deleted User",
        userEmail: "",
        userPhone: "",
        updatedAt: serverTimestamp(),
      }),
    );
  });

  // Bookings AT owner's restaurants (in chunks of 30 — Firestore "in" limit)
  for (let i = 0; i < restaurantIds.length; i += 30) {
    const chunk = restaurantIds.slice(i, i + 30);
    const rBookingsSnap = await getDocs(
      query(collection(db, "bookings"), where("restaurantId", "in", chunk)),
    );
    rBookingsSnap.forEach((d) => {
      const data = d.data();
      const update: Record<string, any> = {
        restaurantId: "",
        restaurantName: "Deleted Restaurant",
        restaurantAddress: "",
        restaurantPhone: "",
        updatedAt: serverTimestamp(),
      };
      // If the booking was also made by this user, anonymize that too
      if (data.userId === uid) {
        update.userId = "";
        update.userName = "Deleted User";
        update.userEmail = "";
        update.userPhone = "";
      }
      anonPromises.push(updateDoc(d.ref, update));
    });
  }

  await Promise.all(anonPromises);
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = "warning" | "confirm" | "deleting" | "done";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDeleteComplete: () => void;
  isOwner?: boolean;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export const DeleteAccountModal = ({
  visible,
  onClose,
  onDeleteComplete,
  isOwner = false,
}: Props) => {
  const { slideAnim, fadeAnim } = useSheetAnim(visible, 500);
  const [step, setStep] = useState<Step>("warning");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  // Reset state every time modal opens
  useEffect(() => {
    if (visible) {
      setStep("warning");
      setPassword("");
      setError("");
      setLoading(false);
      setShowPassword(false);
    }
  }, [visible]);

  const handleDelete = async () => {
    if (!password.trim()) {
      setError("Please enter your password to confirm.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user?.email) throw new Error("No authenticated user found.");

      // Re-authenticate before deletion
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      setStep("deleting");
      await performAccountDeletion(user.uid, isOwner);
      setStep("done");
    } catch (err: any) {
      setStep("confirm");
      const msg =
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
          ? "Incorrect password. Please try again."
          : err.code === "auth/too-many-requests"
            ? "Too many attempts. Please wait and try again."
            : err.code === "auth/network-request-failed"
              ? "No internet connection. Check your network."
              : err.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step: Warning ─────────────────────────────────────────────────────────
  const renderWarning = () => (
    <View style={st.content}>
      <View style={st.iconRing}>
        <View style={st.iconInner}>
          <MaterialIcons name="delete-forever" size={34} color={C.error} />
        </View>
      </View>

      <Text style={st.title}>Delete Account?</Text>
      <Text style={st.subtitle}>
        This is permanent and cannot be undone.{"\n"}Here's what will be
        deleted:
      </Text>

      {/* What gets deleted */}
      <View style={st.listBox}>
        {[
          { icon: "person", text: "Your profile — name, email, phone, photo" },
          {
            icon: "location-on",
            text: "Your saved addresses and location data",
          },
          ...(isOwner
            ? [{ icon: "store", text: "Your restaurant listing" }]
            : []),
          { icon: "lock", text: "Your login access — immediately" },
        ].map((item, i) => (
          <View key={i} style={st.listRow}>
            <View style={st.listIconWrap}>
              <MaterialIcons
                name={item.icon as any}
                size={14}
                color={C.error}
              />
            </View>
            <Text style={st.listText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {/* What stays */}
      <View style={[st.listBox, st.keepBox]}>
        <View style={st.keepHeader}>
          <MaterialIcons name="info-outline" size={14} color={C.accentSoft} />
          <Text style={st.keepHeaderText}>Kept for legal compliance</Text>
        </View>
        <View style={st.listRow}>
          <View style={[st.listIconWrap, { backgroundColor: "#f0fff4" }]}>
            <MaterialIcons name="payments" size={14} color="#22c55e" />
          </View>
          <Text style={[st.listText, { color: C.textSub }]}>
            Payment records — anonymized, no identity attached
          </Text>
        </View>
      </View>

      <View style={st.btnRow}>
        <TouchableOpacity
          style={st.cancelBtn}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={st.cancelBtnText}>Keep Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={st.nextBtn}
          onPress={() => {
            setStep("confirm");
            setError("");
            setTimeout(() => passwordRef.current?.focus(), 400);
          }}
          activeOpacity={0.85}
        >
          <Text style={st.nextBtnText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={16} color={C.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Step: Confirm (password) ──────────────────────────────────────────────
  const renderConfirm = () => (
    <View style={st.content}>
      <View style={[st.iconRing, { borderColor: "#fecaca" }]}>
        <View style={st.iconInner}>
          <MaterialIcons name="lock" size={34} color={C.error} />
        </View>
      </View>

      <Text style={st.title}>Confirm Identity</Text>
      <Text style={st.subtitle}>
        Enter your password to permanently{"\n"}delete your account.
      </Text>

      <Text style={st.inputLabel}>Password</Text>
      <View style={[st.inputWrap, error ? st.inputWrapError : null]}>
        <MaterialIcons name="lock-outline" size={18} color={C.accentSoft} />
        <TextInput
          ref={passwordRef}
          style={st.input}
          placeholder="Enter your password"
          placeholderTextColor={C.textMuted}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) setError("");
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleDelete}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((p) => !p)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name={showPassword ? "visibility-off" : "visibility"}
            size={18}
            color={C.textMuted}
          />
        </TouchableOpacity>
      </View>

      {!!error && (
        <View style={st.errorRow}>
          <MaterialIcons name="error-outline" size={14} color={C.error} />
          <Text style={st.errorText}>{error}</Text>
        </View>
      )}

      <View style={st.btnRow}>
        <TouchableOpacity
          style={st.cancelBtn}
          onPress={() => {
            setStep("warning");
            setError("");
          }}
          activeOpacity={0.8}
        >
          <Text style={st.cancelBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.deleteBtn, loading && { opacity: 0.65 }]}
          onPress={handleDelete}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={C.white} />
          ) : (
            <>
              <MaterialIcons name="delete-forever" size={16} color={C.white} />
              <Text style={st.deleteBtnText}>Delete Forever</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Step: Deleting ────────────────────────────────────────────────────────
  const renderDeleting = () => (
    <View style={st.content}>
      <View style={[st.iconRing, { borderColor: "#fde8c8" }]}>
        <View style={[st.iconInner, { backgroundColor: C.accentBg }]}>
          <ActivityIndicator size="large" color={C.accent} />
        </View>
      </View>

      <Text style={st.title}>Deleting Account</Text>
      <Text style={st.subtitle}>
        Please wait while we securely remove your data.{"\n"}Do not close the
        app.
      </Text>

      <View style={st.progressSteps}>
        {[
          "Removing profile data",
          isOwner ? "Removing restaurant listing" : null,
          "Anonymizing payment records",
          "Closing your account",
        ]
          .filter(Boolean)
          .map((s, i) => (
            <View key={i} style={st.progressRow}>
              <ActivityIndicator size="small" color={C.accentSoft} />
              <Text style={st.progressText}>{s}</Text>
            </View>
          ))}
      </View>
    </View>
  );

  // ── Step: Done ────────────────────────────────────────────────────────────
  const renderDone = () => (
    <View style={st.content}>
      <View style={[st.iconRing, { borderColor: "#bbf7d0" }]}>
        <View style={[st.iconInner, { backgroundColor: "#f0fff4" }]}>
          <MaterialIcons name="check-circle" size={34} color="#22c55e" />
        </View>
      </View>

      <Text style={st.title}>Account Deleted</Text>
      <Text style={st.subtitle}>
        Your account and personal data have been permanently removed from Dine
        Time.
      </Text>

      <View style={[st.listBox, st.keepBox]}>
        {[
          "Profile, email, phone — deleted",
          isOwner ? "Restaurant listing — deleted" : null,
          "Login access — revoked",
          "Payment records — anonymized only",
        ]
          .filter(Boolean)
          .map((item, i) => (
            <View key={i} style={st.listRow}>
              <MaterialIcons name="check" size={14} color="#22c55e" />
              <Text style={[st.listText, { color: C.textSub }]}>{item}</Text>
            </View>
          ))}
      </View>

      <Text style={st.gdprNote}>
        Compliant with DPDP Act 2023 — your personal data has been fully erased.
      </Text>

      <TouchableOpacity
        style={[st.deleteBtn, { backgroundColor: C.accent }]}
        onPress={onDeleteComplete}
        activeOpacity={0.85}
      >
        <Text style={st.deleteBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );

  const stepTitles: Record<Step, { title: string; sub: string }> = {
    warning: { title: "Delete Account", sub: "Permanent — cannot be undone" },
    confirm: {
      title: "Confirm Identity",
      sub: "Verify your identity to proceed",
    },
    deleting: { title: "Processing", sub: "Please do not close the app" },
    done: { title: "Completed", sub: "Account successfully removed" },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={step === "deleting" ? undefined : onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <Animated.View style={[st.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={
              step === "warning" || step === "confirm" ? onClose : undefined
            }
          />

          <Animated.View
            style={[st.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={st.handle} />

            {/* Header */}
            <View style={st.sheetHeader}>
              <View>
                <Text style={st.sheetTitle}>{stepTitles[step].title}</Text>
                <Text style={st.sheetSub}>{stepTitles[step].sub}</Text>
              </View>
              {(step === "warning" || step === "confirm") && (
                <TouchableOpacity style={st.closeBtn} onPress={onClose}>
                  <MaterialIcons name="close" size={18} color={C.textSub} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {step === "warning" && renderWarning()}
              {step === "confirm" && renderConfirm()}
              {step === "deleting" && renderDeleting()}
              {step === "done" && renderDone()}
              <View style={{ height: 32 }} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.divider,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  sheetSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },

  content: { paddingHorizontal: 22, paddingTop: 20 },

  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#fecaca",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.errorBg,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },

  listBox: {
    backgroundColor: C.errorBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.15)",
    gap: 10,
    marginBottom: 12,
  },
  keepBox: { backgroundColor: C.accentBg, borderColor: C.accentBorder },
  keepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  keepHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.accentSoft,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  listIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: C.errorBg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  listText: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
    fontWeight: "500",
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSub,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: C.accentBg,
    gap: 10,
    marginBottom: 12,
  },
  inputWrapError: { borderColor: C.error },
  input: { flex: 1, fontSize: 15, color: C.text, fontWeight: "500" },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.errorBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.2)",
  },
  errorText: { flex: 1, fontSize: 12, color: C.error, lineHeight: 17 },

  btnRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.divider,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nextBtnText: { fontSize: 14, fontWeight: "700", color: C.white },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700", color: C.white },

  progressSteps: { gap: 12, marginBottom: 16 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.divider,
  },
  progressText: { fontSize: 13, color: C.textSub, fontWeight: "500" },

  gdprNote: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
});
