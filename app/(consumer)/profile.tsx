// app/(consumer)/profile.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  Animated,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { DeleteAccountModal } from "../../components/common/DeleteAccountModal";

const CLOUD_NAME = "dzbazi9fw";
const UPLOAD_PRESET = "Restaurants_Image";
const { width: SW } = Dimensions.get("window");

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

const uploadToCloudinary = async (uri: string): Promise<string | null> => {
  try {
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: "profile.jpg",
    } as any);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("folder", "dine-time/profiles");
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: "POST", body: data },
    );
    const result = await res.json();
    return result.secure_url || null;
  } catch {
    return null;
  }
};

function useSheetAnim(visible: boolean, initialY = 350) {
  const slideAnim = useRef(new Animated.Value(initialY)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: initialY,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  return { slideAnim, fadeAnim };
}

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const OptionRow = ({
  icon,
  label,
  subtitle,
  onPress,
  danger,
  right,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) => (
  <TouchableOpacity
    style={styles.optionRow}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View
      style={[styles.optionIconWrap, danger && styles.optionIconWrapDanger]}
    >
      <MaterialIcons
        name={icon}
        size={20}
        color={danger ? C.error : C.accentSoft}
      />
    </View>
    <View style={styles.optionContent}>
      <Text style={[styles.optionLabel, danger && styles.optionLabelDanger]}>
        {label}
      </Text>
      {subtitle && <Text style={styles.optionSub}>{subtitle}</Text>}
    </View>
    {right ?? (
      <MaterialIcons name="chevron-right" size={20} color={C.textMuted} />
    )}
  </TouchableOpacity>
);

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmDanger = false,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  confirmDanger?: boolean;
}) => {
  const { slideAnim, fadeAnim } = useSheetAnim(visible, 200);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.confirmSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.confirmContent}>
            <View
              style={[
                styles.confirmIconCircle,
                confirmDanger && { backgroundColor: C.errorBg },
              ]}
            >
              <MaterialIcons
                name={confirmDanger ? "logout" : "swap-horiz"}
                size={28}
                color={confirmDanger ? C.error : C.accent}
              />
            </View>
            <Text style={styles.confirmTitle}>{title}</Text>
            <Text style={styles.confirmMessage}>{message}</Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmAction,
                  confirmDanger && styles.confirmActionDanger,
                ]}
                onPress={onConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmActionText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const EditProfileModal = ({
  visible,
  onClose,
  userData,
  updateUserProfile,
}: {
  visible: boolean;
  onClose: () => void;
  userData: any;
  updateUserProfile: any;
}) => {
  const { slideAnim, fadeAnim } = useSheetAnim(visible, 500);
  const [name, setName] = useState(userData?.fullName || "");
  const [email, setEmail] = useState(userData?.email || "");
  const [phone, setPhone] = useState(userData?.phoneNumber || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(userData?.fullName || "");
      setEmail(userData?.email || "");
      setPhone(userData?.phoneNumber || "");
    }
  }, [visible]);

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploading(true);
    const url = await uploadToCloudinary(result.assets[0].uri);
    if (url) await updateUserProfile?.({ profileImage: url });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateUserProfile?.({
      fullName: name.trim(),
      email: email.trim(),
      phoneNumber: phone.trim(),
    });
    setSaving(false);
    onClose();
  };

  const initials = userData?.fullName?.charAt(0).toUpperCase() || "U";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
          <Animated.View
            style={[
              styles.editSheet,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.offersHeader}>
              <View>
                <Text style={styles.offersTitle}>Edit Profile</Text>
                <Text style={styles.offersSub}>Update your personal info</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <MaterialIcons name="close" size={18} color={C.textSub} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ paddingHorizontal: 20 }}
            >
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  activeOpacity={0.85}
                  style={styles.editAvatarWrap}
                >
                  {userData?.profileImage ? (
                    <Image
                      source={{ uri: userData.profileImage }}
                      style={styles.editAvatarImg}
                    />
                  ) : (
                    <LinearGradient
                      colors={["#ff7f2a", "#f49b33"]}
                      style={styles.editAvatarImg}
                    >
                      <Text style={styles.avatarInitials}>{initials}</Text>
                    </LinearGradient>
                  )}
                  <View style={styles.editCameraOverlay}>
                    {uploading ? (
                      <ActivityIndicator size="small" color={C.white} />
                    ) : (
                      <MaterialIcons
                        name="camera-alt"
                        size={16}
                        color={C.white}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={styles.changePhotoText}>Tap to change photo</Text>
              </View>
              {[
                {
                  label: "Full Name",
                  value: name,
                  setter: setName,
                  icon: "person",
                  placeholder: "Your name",
                  keyboard: "default",
                },
                {
                  label: "Email",
                  value: email,
                  setter: setEmail,
                  icon: "email",
                  placeholder: "your@email.com",
                  keyboard: "email-address",
                },
                {
                  label: "Phone",
                  value: phone,
                  setter: setPhone,
                  icon: "phone",
                  placeholder: "+91 XXXXX XXXXX",
                  keyboard: "phone-pad",
                },
              ].map((field) => (
                <View key={field.label} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={styles.fieldInputWrap}>
                    <MaterialIcons
                      name={field.icon as any}
                      size={17}
                      color={C.accentSoft}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      style={styles.fieldInput}
                      value={field.value}
                      onChangeText={field.setter}
                      placeholder={field.placeholder}
                      placeholderTextColor={C.textMuted}
                      keyboardType={field.keyboard as any}
                      autoCapitalize="none"
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.88}
                style={{ marginBottom: 32, marginTop: 8 }}
              >
                <LinearGradient
                  colors={["#ff7f2a", "#f49b33"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <>
                      <MaterialIcons name="check" size={18} color={C.white} />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const OffersModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { slideAnim, fadeAnim } = useSheetAnim(visible, 300);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.offersSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.offersHeader}>
            <View>
              <Text style={styles.offersTitle}>Offers & Rewards</Text>
              <Text style={styles.offersSub}>Exclusive deals just for you</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <View style={styles.offersEmptyWrap}>
            <LinearGradient
              colors={["#fff7f0", "#fde8c8"]}
              style={styles.offersEmptyIcon}
            >
              <Text style={{ fontSize: 44 }}>🎁</Text>
            </LinearGradient>
            <Text style={styles.offersEmptyTitle}>No Active Offers</Text>
            <Text style={styles.offersEmptyDesc}>
              Exclusive deals and rewards are on their way.{"\n"}Keep exploring
              to unlock special perks!
            </Text>
            <View style={styles.comingSoonRow}>
              {[
                {
                  icon: "local-offer",
                  label: "First Booking\nDiscount",
                  color: "#ff7f2a",
                },
                {
                  icon: "card-giftcard",
                  label: "Referral\nBonus",
                  color: "#f49b33",
                },
                { icon: "stars", label: "Loyalty\nPoints", color: "#e8860a" },
              ].map((item) => (
                <View key={item.label} style={styles.comingSoonCard}>
                  <View
                    style={[
                      styles.comingSoonIcon,
                      { backgroundColor: item.color + "18" },
                    ]}
                  >
                    <MaterialIcons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.comingSoonLabel}>{item.label}</Text>
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonBadgeText}>Soon</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const HelpModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { slideAnim, fadeAnim } = useSheetAnim(visible, 400);
  const faqs = [
    {
      q: "What is Dine Time?",
      a: "Dine Time is a comprehensive restaurant reservation app. Search for your favourite or nearby establishments and book a table instantly.",
    },
    {
      q: "How do I find restaurants?",
      a: "Use the Explore tab to search by name, cuisine, or location.",
    },
    {
      q: "How do I book a table?",
      a: "Find your desired restaurant, tap 'Book a Table', choose your date, time, and guest count, then complete payment.",
    },
    {
      q: "What payment methods are available?",
      a: "Dine Time supports the restaurant's original payment options. All payment processing is handled securely within the app.",
    },
    {
      q: "What is the refund policy?",
      a: "All reservation payments through Dine Time are non-refundable. Please confirm all booking details carefully before completing.",
    },
    {
      q: "How do I list my restaurant?",
      a: "Switch to Owner mode from your profile page, then follow the restaurant registration steps.",
    },
    {
      q: "How do I change my profile picture?",
      a: "Tap 'Edit Profile' on your profile page, then tap your avatar to upload a new photo.",
    },
    {
      q: "Need more help?",
      a: "Contact our support team at dinetimeteam@gmail.com. Mon–Sat, 9 AM – 6 PM.",
    },
  ];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[styles.helpSheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.offersHeader}>
            <View>
              <Text style={styles.offersTitle}>Help & Support</Text>
              <Text style={styles.offersSub}>We're here for you</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => Linking.openURL("mailto:dinetimeteam@gmail.com")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#fff7f0", "#fde8c8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contactInner}
              >
                <View style={styles.contactIconWrap}>
                  <MaterialIcons
                    name="support-agent"
                    size={22}
                    color={C.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>Contact Support</Text>
                  <Text style={styles.contactEmail}>
                    dinetimeteam@gmail.com
                  </Text>
                  <Text style={styles.contactHours}>
                    Mon–Sat, 9 AM – 6 PM · Usually replies within 24h
                  </Text>
                </View>
                <MaterialIcons
                  name="open-in-new"
                  size={16}
                  color={C.accentSoft}
                />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.faqHeading}>Frequently Asked Questions</Text>
            {faqs.map((item, i) => (
              <View key={i} style={styles.faqItem}>
                <View style={styles.faqQ}>
                  <View style={styles.faqQDot} />
                  <Text style={styles.faqQText}>{item.q}</Text>
                </View>
                <Text style={styles.faqAText}>{item.a}</Text>
              </View>
            ))}
            <View style={{ height: 36 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const AboutModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { slideAnim, fadeAnim } = useSheetAnim(visible, 300);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.aboutSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.offersHeader}>
            <View>
              <Text style={styles.offersTitle}>About Dine Time</Text>
              <Text style={styles.offersSub}>Version 1.0.0 · Build 1</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialIcons name="close" size={18} color={C.textSub} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.aboutIdentity}>
              <Image
                source={require("../../assets/DTime.png")}
                style={{ width: 72, height: 72, borderRadius: 22 }}
                resizeMode="contain"
              />
              <Text style={styles.aboutAppName}>Dine Time</Text>
              <Text style={styles.aboutTagline}>
                Discover restaurants, reserve tables instantly,{"\n"}and enjoy
                seamless dining — all in one app.
              </Text>
            </View>
            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>
                What makes us special
              </Text>
              <View style={styles.featureGrid}>
                {[
                  { icon: "search", label: "Smart Discovery" },
                  { icon: "event-seat", label: "Instant Booking" },
                  { icon: "payments", label: "Secure Payments" },
                  { icon: "favorite", label: "Favourites" },
                ].map((f) => (
                  <View key={f.label} style={styles.featureBox}>
                    <MaterialIcons
                      name={f.icon as any}
                      size={22}
                      color={C.accent}
                    />
                    <Text style={styles.featureText}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.aboutSection}>
              <Text style={styles.aboutSectionTitle}>
                Why users love Dine Time
              </Text>
              {[
                "Fast & clean booking experience",
                "Verified restaurant listings",
                "Priority table access",
                "Owner & customer dual mode",
              ].map((b) => (
                <View key={b} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.aboutContactCard}
              onPress={() => Linking.openURL("mailto:dinetimeteam@gmail.com")}
              activeOpacity={0.8}
            >
              <MaterialIcons name="support-agent" size={22} color={C.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.contactTitle}>Contact Support</Text>
                <Text style={styles.contactEmail}>dinetimeteam@gmail.com</Text>
                <Text style={styles.contactHours}>
                  We usually reply within 24 hours
                </Text>
              </View>
              <MaterialIcons
                name="open-in-new"
                size={16}
                color={C.accentSoft}
              />
            </TouchableOpacity>
            <View style={styles.aboutSection}>
              {["Terms of Service", "Privacy Policy", "Licenses"].map(
                (label, i) => (
                  <TouchableOpacity
                    key={label}
                    style={[styles.legalRow, i === 0 && { borderTopWidth: 0 }]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.legalText}>{label}</Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={18}
                      color={C.textMuted}
                    />
                  </TouchableOpacity>
                ),
              )}
            </View>
            <View style={styles.aboutFooterWrap}>
              <Text style={styles.aboutFooter}>Made with ❤️ in India</Text>
              <Text style={styles.aboutCopy}>
                © 2025 Dine Time. All rights reserved.
              </Text>
            </View>
            <View style={{ height: 36 }} />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { logout, userData, updateUserProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showOffers, setShowOffers] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace("/(auth)/landing");
  };

  const doRoleSwitch = async () => {
    setShowSwitchConfirm(false);
    const newRole =
      userData?.rolePreference === "consumer" ? "owner" : "consumer";
    if (updateUserProfile) await updateUserProfile({ rolePreference: newRole });
    router.replace(
      newRole === "owner" ? "/(owner)/my-restaurants" : "/(consumer)/explore",
    );
  };

  const handleDeleteComplete = async () => {
    setShowDeleteAccount(false);
    await logout();
    router.replace("/(auth)/landing");
  };

  const initials = userData?.fullName?.charAt(0).toUpperCase() || "U";
  const isOwner = userData?.rolePreference === "owner";
  const switchLabel = isOwner ? "Switch to Diner" : "List Your Restaurant";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff2e1" />

      <OffersModal visible={showOffers} onClose={() => setShowOffers(false)} />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        userData={userData}
        updateUserProfile={updateUserProfile}
      />
      <DeleteAccountModal
        visible={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onDeleteComplete={handleDeleteComplete}
        isOwner={isOwner}
      />
      <ConfirmModal
        visible={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={doLogout}
        title="Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Yes, Logout"
        confirmDanger
      />
      <ConfirmModal
        visible={showSwitchConfirm}
        onClose={() => setShowSwitchConfirm(false)}
        onConfirm={doRoleSwitch}
        title={isOwner ? "Switch to Diner" : "Switch to Owner"}
        message={
          isOwner
            ? "You'll be switched to the customer view. You can switch back anytime."
            : "Switch to Owner mode to list and manage your restaurant on Dine Time."
        }
        confirmLabel="Switch"
        confirmDanger={false}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
      >
        {/* ── Header with Dine Time Logo ── */}
        <LinearGradient
          colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.headerTopRow}>
            {/* Dine Time Logo */}
            <View style={styles.logoRow}>
              <Image
                source={require("../../assets/DTime.png")}
                style={{ width: 36, height: 36, borderRadius: 10 }}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>
                <Text>Dine </Text>
                <Text style={{ color: C.accent }}>Time</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.helpBtn}
              activeOpacity={0.8}
              onPress={() => setShowHelp(true)}
            >
              <MaterialIcons name="help-outline" size={14} color={C.accent} />
              <Text style={styles.helpBtnText}>Help</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={[
              styles.avatarSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.avatarWrap}>
              {userData?.profileImage ? (
                <Image
                  source={{ uri: userData.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={["#ff7f2a", "#f49b33"]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.userName}>{userData?.fullName || "Guest"}</Text>
            <View style={styles.roleBadge}>
              <MaterialIcons
                name={isOwner ? "store" : "person"}
                size={11}
                color={C.accent}
              />
              <Text style={styles.roleBadgeText}>
                {isOwner ? "Restaurant Owner" : "Diner"}
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* ── Quick Actions ── */}
        <View style={styles.quickGrid}>
          {[
            {
              icon: "event",
              label: "Bookings",
              action: () => router.push("/(consumer)/bookings" as any),
            },
            {
              icon: "favorite",
              label: "Favourites",
              action: () => router.push("/(consumer)/favourites" as any),
            },
            {
              icon: "local-offer",
              label: "Offers",
              action: () => setShowOffers(true),
            },
            {
              icon: "edit",
              label: "Edit Profile",
              action: () => setShowEditProfile(true),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickItem}
              activeOpacity={0.75}
              onPress={item.action}
            >
              <View style={styles.quickIconWrap}>
                <MaterialIcons
                  name={item.icon as any}
                  size={21}
                  color={C.accent}
                />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account ── */}
        <SectionCard title="Account">
          <OptionRow
            icon="history"
            label="Booking History"
            onPress={() => router.push("/(consumer)/bookings" as any)}
          />
          <OptionRow
            icon="local-offer"
            label="Offers & Rewards"
            subtitle="New deals coming soon 🎉"
            onPress={() => setShowOffers(true)}
            right={
              <View style={styles.noOfferBadge}>
                <Text style={styles.noOfferText}>0 Active</Text>
              </View>
            }
          />
        </SectionCard>

        {/* ── Settings ── */}
        <SectionCard title="Settings">
          <OptionRow
            icon="person-outline"
            label="Edit Profile"
            subtitle="Name, email, phone & photo"
            onPress={() => setShowEditProfile(true)}
          />
          <OptionRow
            icon="help-outline"
            label="Help & Support"
            onPress={() => setShowHelp(true)}
          />
          <OptionRow
            icon="info-outline"
            label="About App"
            subtitle="Version 1.0.0"
            onPress={() => setShowAbout(true)}
          />
        </SectionCard>

        {/* ── Privacy & Security ── */}
        <SectionCard title="Privacy & Security">
          <OptionRow
            icon="delete-forever"
            label="Delete Account"
            subtitle="Permanently remove your account & all data"
            onPress={() => setShowDeleteAccount(true)}
            danger
          />
        </SectionCard>

        {/* ── Switch Role Banner ── */}
        <TouchableOpacity
          style={styles.roleBannerCard}
          onPress={() => setShowSwitchConfirm(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isOwner ? ["#f0f4ff", "#e8ecff"] : ["#fff7f0", "#fde8c8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.roleBannerGradient}
          >
            <View
              style={[
                styles.roleBannerIcon,
                { backgroundColor: isOwner ? "#e0e8ff" : C.accentBg },
              ]}
            >
              <MaterialIcons
                name={isOwner ? "person" : "store"}
                size={22}
                color={isOwner ? "#4B6BF5" : C.accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.roleBannerTitle,
                  { color: isOwner ? "#3350D0" : C.text },
                ]}
              >
                {switchLabel}
              </Text>
              <Text style={styles.roleBannerSub}>
                {isOwner
                  ? "Switch back to customer view"
                  : "Start receiving bookings today 🍽️"}
              </Text>
            </View>
            <MaterialIcons
              name="swap-horiz"
              size={20}
              color={isOwner ? "#4B6BF5" : C.accentSoft}
            />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutConfirm(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={18} color={C.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          © 2025 Dine Time. All Rights Reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  // Dine Time Logo
  logoRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 16,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.3,
  },
  logoSubText: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },

  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  helpBtnText: { color: C.accent, fontWeight: "600", fontSize: 13 },

  avatarSection: { alignItems: "center" },
  avatarWrap: { marginBottom: 10 },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: C.white,
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: C.white },
  userName: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 8 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "600", color: C.accent },

  quickGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: C.white,
    marginHorizontal: 14,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  quickItem: { alignItems: "center", gap: 6 },
  quickIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 11, color: C.text, fontWeight: "500" },

  sectionCard: {
    backgroundColor: C.white,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
    gap: 12,
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(244,155,51,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIconWrapDanger: { backgroundColor: C.errorBg },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: "500", color: C.text },
  optionLabelDanger: { color: C.error },
  optionSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },

  noOfferBadge: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  noOfferText: { fontSize: 11, fontWeight: "700", color: C.accentSoft },

  roleBannerCard: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  roleBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 16,
  },
  roleBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  roleBannerTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  roleBannerSub: { fontSize: 12, color: C.textSub },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 14,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.errorBg,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.15)",
  },
  logoutText: { fontSize: 14, fontWeight: "700", color: C.error },
  footer: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.divider,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  offersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  offersTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  offersSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },

  confirmSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  confirmContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 32,
  },
  confirmIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accentBg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },
  confirmCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.divider,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  confirmAction: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  confirmActionDanger: { backgroundColor: C.error },
  confirmActionText: { fontSize: 14, fontWeight: "700", color: C.white },

  editSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  editAvatarWrap: { position: "relative" },
  editAvatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: C.accentBorder,
  },
  editCameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.white,
  },
  changePhotoText: { fontSize: 12, color: C.textMuted, marginTop: 8 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.textSub,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: C.accentBg,
  },
  fieldInput: { flex: 1, fontSize: 14, color: C.text },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: C.white },

  offersSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
  },
  offersEmptyWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  offersEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  offersEmptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.text,
    marginBottom: 6,
  },
  offersEmptyDesc: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  comingSoonRow: { flexDirection: "row", gap: 10 },
  comingSoonCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: C.divider,
  },
  comingSoonIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  comingSoonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.text,
    textAlign: "center",
    lineHeight: 15,
  },
  soonBadge: {
    backgroundColor: C.accentBg,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  soonBadgeText: { fontSize: 9, fontWeight: "700", color: C.accent },

  helpSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  contactCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  contactInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 14,
  },
  contactIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.white,
    justifyContent: "center",
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 2,
  },
  contactEmail: { fontSize: 13, fontWeight: "600", color: C.accent },
  contactHours: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  faqHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  faqItem: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.divider,
  },
  faqQ: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 5,
  },
  faqQDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginTop: 5,
  },
  faqQText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    lineHeight: 18,
  },
  faqAText: { fontSize: 12, color: C.textSub, lineHeight: 18, paddingLeft: 14 },

  aboutSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
  },
  aboutIdentity: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    marginBottom: 4,
  },
  aboutLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: "900",
    color: C.text,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  aboutTagline: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 20,
  },
  aboutSection: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.divider,
  },
  aboutSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureBox: {
    width: "48%",
    backgroundColor: C.accentBg,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  featureText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: C.text,
    textAlign: "center",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  bulletText: { fontSize: 13, color: C.textSub },
  aboutContactCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: C.accentBg,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  legalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  legalText: { fontSize: 13, color: C.text },
  aboutFooterWrap: { alignItems: "center", marginTop: 20 },
  aboutFooter: { fontSize: 13, color: C.textSub },
  aboutCopy: { fontSize: 11, color: C.textMuted, marginTop: 4 },
});
