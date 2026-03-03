import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../../contexts/AuthContext";

const CLOUD_NAME = "dzbazi9fw";
const UPLOAD_PRESET = "Restaurants_Image";

const AMENITIES = [
  { label: "WiFi", icon: "wifi" },
  { label: "Parking", icon: "local-parking" },
  { label: "AC", icon: "ac-unit" },
  { label: "Bar", icon: "local-bar" },
  { label: "Live Music", icon: "music-note" },
  { label: "Rooftop", icon: "roofing" },
  { label: "Valet", icon: "directions-car" },
  { label: "Pet Friendly", icon: "pets" },
  { label: "Wheelchair", icon: "accessible" },
  { label: "Takeaway", icon: "takeout-dining" },
  { label: "Delivery", icon: "delivery-dining" },
  { label: "CCTV", icon: "videocam" },
];

const FEATURES = [
  { label: "Family Friendly", icon: "family-restroom" },
  { label: "Romantic", icon: "favorite" },
  { label: "Business Dining", icon: "business-center" },
  { label: "Casual Dining", icon: "restaurant" },
  { label: "Fine Dining", icon: "wine-bar" },
  { label: "Buffet", icon: "set-meal" },
  { label: "Outdoor Seating", icon: "deck" },
  { label: "Private Events", icon: "celebration" },
  { label: "Halal", icon: "cruelty-free" },
  { label: "Vegetarian Friendly", icon: "eco" },
  { label: "Late Night", icon: "nights-stay" },
  { label: "Happy Hours", icon: "local-drink" },
];

const uploadToCloudinary = async (uri: string): Promise<string | null> => {
  try {
    const data = new FormData();
    data.append("file", { uri, type: "image/jpeg", name: "upload.jpg" } as any);
    data.append("upload_preset", UPLOAD_PRESET);
    data.append("folder", "restaurants");
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

// ── Check if URI is a local device file (needs upload) or already a remote URL ──
const isLocalUri = (uri: string) =>
  uri.startsWith("file://") || uri.startsWith("content://");

export default function RegisterStep5() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, userData } = useAuth();
  const insets = useSafeAreaInsets();

  const isEdit = params.isEdit === "true";
  const restaurantId = params.restaurantId as string;

  // ── Pre-fill from params ──
  const [coverImage, setCoverImage] = useState<string | null>(
    (params.existingCoverImage as string) || null,
  );
  const [gallery, setGallery] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(params.existingGallery as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(params.amenities as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(() => {
    try {
      const parsed = JSON.parse(params.features as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const toggle = (
    item: string,
    list: string[],
    setList: (v: string[]) => void,
  ) =>
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    );

  const pickCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission Denied", "Camera roll access required");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!res.canceled) setCoverImage(res.assets[0].uri);
  };

  const pickGallery = async () => {
    if (gallery.length >= 10)
      return Alert.alert("Limit Reached", "Maximum 10 gallery images");
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission Denied", "Camera roll access required");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!res.canceled) {
      const newUris = res.assets.map((a) => a.uri);
      if (gallery.length + newUris.length > 10)
        return Alert.alert("Limit Exceeded", "Maximum 10 gallery images total");
      setGallery((prev) => [...prev, ...newUris]);
    }
  };

  const handleSubmit = async () => {
    if (!coverImage)
      return Alert.alert("Required", "Please upload a cover image");
    if (!user) return Alert.alert("Error", "You must be logged in");

    setUploading(true);
    try {
      const operatingHours = JSON.parse(params.operatingHours as string);
      const tables = JSON.parse(params.tables as string);
      const cuisineArray = (params.cuisine as string)
        .split(",")
        .filter(Boolean);
      const bookingFeePerPerson =
        parseInt(params.bookingFeePerPerson as string) || 299;

      // ── EDIT MODE ──
      if (isEdit && restaurantId) {
        // Only upload cover if it changed to a new local file
        let coverUrl = coverImage;
        if (isLocalUri(coverImage)) {
          setProgress("Uploading cover image…");
          const uploaded = await uploadToCloudinary(coverImage);
          if (!uploaded) throw new Error("Cover image upload failed");
          coverUrl = uploaded;
        }

        // Only upload new local gallery images, keep existing remote URLs
        const galleryUrls: string[] = [];
        for (let i = 0; i < gallery.length; i++) {
          if (isLocalUri(gallery[i])) {
            setProgress(`Uploading gallery ${i + 1}/${gallery.length}…`);
            const url = await uploadToCloudinary(gallery[i]);
            if (url) galleryUrls.push(url);
          } else {
            galleryUrls.push(gallery[i]);
          }
        }

        setProgress("Saving changes…");
        const searchKeywords = [
          params.name?.toString().toLowerCase(),
          ...cuisineArray.map((c: string) => c.toLowerCase()),
          params.city?.toString().toLowerCase(),
        ].filter(Boolean);

        await updateDoc(doc(db, "restaurants", restaurantId), {
          name: params.name ?? "",
          description: params.description ?? "",
          cuisine: cuisineArray,
          address: {
            street: params.street ?? "",
            city: params.city ?? "",
            state: params.state ?? "",
            pincode: params.pincode ?? "",
            landmark: params.landmark ?? "",
          },
          coordinates: {
            latitude: parseFloat(params.latitude as string),
            longitude: parseFloat(params.longitude as string),
          },
          phone: params.phone ?? "",
          email: params.email ?? "",
          website: params.website ?? "",
          operatingHours,
          tables,
          totalCapacity: parseInt(params.totalCapacity as string),
          images: { coverImage: coverUrl, gallery: galleryUrls, menuImages: [] },
          amenities: selectedAmenities,
          features: selectedFeatures,
          bookingFeePerPerson,
          status: "pending",
          updatedAt: serverTimestamp(),
          searchKeywords,
        });

        Alert.alert(
          "Changes Submitted",
          "Your changes have been sent to admin for review. Your restaurant will be live again once approved.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(owner)/my-restaurants"),
            },
          ],
        );
      } else {
        // ── NEW MODE ──
        setProgress("Uploading cover image…");
        const coverUrl = await uploadToCloudinary(coverImage);
        if (!coverUrl) throw new Error("Cover image upload failed");

        const galleryUrls: string[] = [];
        for (let i = 0; i < gallery.length; i++) {
          setProgress(`Uploading gallery ${i + 1}/${gallery.length}…`);
          const url = await uploadToCloudinary(gallery[i]);
          if (url) galleryUrls.push(url);
        }

        setProgress("Creating restaurant…");
        const searchKeywords = [
          params.name?.toString().toLowerCase(),
          ...cuisineArray.map((c: string) => c.toLowerCase()),
          params.city?.toString().toLowerCase(),
        ].filter(Boolean);

        const restaurantData = {
          ownerId: user.uid,
          ownerName: userData?.fullName ?? "",
          ownerContact: userData?.phoneNumber ?? "",
          name: params.name ?? "",
          description: params.description ?? "",
          cuisine: cuisineArray,
          address: {
            street: params.street ?? "",
            city: params.city ?? "",
            state: params.state ?? "",
            pincode: params.pincode ?? "",
            landmark: params.landmark ?? "",
          },
          coordinates: {
            latitude: parseFloat(params.latitude as string),
            longitude: parseFloat(params.longitude as string),
          },
          phone: params.phone ?? "",
          email: params.email ?? "",
          website: params.website ?? "",
          operatingHours,
          tables,
          totalCapacity: parseInt(params.totalCapacity as string),
          images: { coverImage: coverUrl, gallery: galleryUrls, menuImages: [] },
          amenities: selectedAmenities,
          features: selectedFeatures,
          bookingFeePerPerson,
          cancellationPolicy: {
            allowCancellation: true,
            isRefundable: false,
            minimumNoticeHours: 0,
          },
          status: "pending",
          totalBookings: 0,
          averageRating: 0,
          totalReviews: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          searchKeywords,
        };

        const docRef = await addDoc(
          collection(db, "restaurants"),
          restaurantData,
        );
        await updateDoc(docRef, { id: docRef.id });
        await updateDoc(doc(db, "users", user.uid), {
          ownedRestaurants: arrayUnion(docRef.id),
        });

        Alert.alert(
          "Submitted 🎉",
          "Your restaurant is pending admin approval.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(owner)/my-restaurants"),
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Submission failed. Please try again.",
      );
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

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
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {isEdit ? "Edit Restaurant" : "Add Restaurant"}
            </Text>
            <Text style={styles.headerSub}>
              Step 5 of 5 — Finishing Touches
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: "100%" }]}
          />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                styles.dotActive,
                i === 5 && styles.dotCurrent,
              ]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Amenities */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <MaterialIcons name="star" size={16} color="#FF9F43" />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                Amenities <Text style={styles.opt}>(Optional)</Text>
              </Text>
              <Text style={styles.cardSub}>
                {selectedAmenities.length} selected
              </Text>
            </View>
          </View>
          <View style={styles.chipGrid}>
            {AMENITIES.map(({ label, icon }) => {
              const sel = selectedAmenities.includes(label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, sel && styles.chipSel]}
                  onPress={() =>
                    toggle(label, selectedAmenities, setSelectedAmenities)
                  }
                  activeOpacity={0.75}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={14}
                    color={sel ? "#FFF" : "#8A95A3"}
                  />
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dining Style */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: "rgba(168,85,247,0.1)" },
              ]}
            >
              <MaterialIcons name="local-dining" size={16} color="#A855F7" />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                Dining Style <Text style={styles.opt}>(Optional)</Text>
              </Text>
              <Text style={styles.cardSub}>
                {selectedFeatures.length} selected
              </Text>
            </View>
          </View>
          <View style={styles.chipGrid}>
            {FEATURES.map(({ label, icon }) => {
              const sel = selectedFeatures.includes(label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, sel && styles.chipSelPurple]}
                  onPress={() =>
                    toggle(label, selectedFeatures, setSelectedFeatures)
                  }
                  activeOpacity={0.75}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={14}
                    color={sel ? "#FFF" : "#8A95A3"}
                  />
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cover Image */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: "rgba(255,159,67,0.1)" },
              ]}
            >
              <MaterialIcons name="image" size={16} color="#FF9F43" />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                Cover Image <Text style={styles.req}>*</Text>
              </Text>
              <Text style={styles.cardSub}>16:9 ratio recommended</Text>
            </View>
          </View>
          {coverImage ? (
            <View style={styles.coverWrap}>
              <Image source={{ uri: coverImage }} style={styles.coverImg} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setCoverImage(null)}
              >
                <MaterialIcons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.coverBadge}>
                <MaterialIcons name="check" size={12} color="#FFF" />
                <Text style={styles.coverBadgeText}>Cover</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickCover}
              activeOpacity={0.8}
              style={styles.uploadZone}
            >
              <View style={styles.uploadIcon}>
                <MaterialIcons
                  name="add-photo-alternate"
                  size={32}
                  color="#6B2FA0"
                />
              </View>
              <Text style={styles.uploadTitle}>Tap to upload</Text>
              <Text style={styles.uploadSub}>
                JPEG or PNG, 16:9 recommended
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Gallery */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIconWrap,
                { backgroundColor: "rgba(168,85,247,0.1)" },
              ]}
            >
              <MaterialIcons name="photo-library" size={16} color="#A855F7" />
            </View>
            <View>
              <Text style={styles.cardTitle}>
                Gallery <Text style={styles.opt}>(Optional)</Text>
              </Text>
              <Text style={styles.cardSub}>{gallery.length}/10 images</Text>
            </View>
          </View>
          <View style={styles.galleryGrid}>
            {gallery.map((uri, i) => (
              <View key={i} style={styles.galleryItem}>
                <Image source={{ uri }} style={styles.galleryImg} />
                <TouchableOpacity
                  style={styles.galleryRemove}
                  onPress={() =>
                    setGallery((g) => g.filter((_, idx) => idx !== i))
                  }
                >
                  <MaterialIcons name="close" size={12} color="#FFF" />
                </TouchableOpacity>
              </View>
            ))}
            {gallery.length < 10 && (
              <TouchableOpacity
                onPress={pickGallery}
                activeOpacity={0.8}
                style={styles.galleryAdd}
              >
                <MaterialIcons name="add" size={26} color="#8A95A3" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={["rgba(107,47,160,0.08)", "rgba(168,85,247,0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.infoInner}
          >
            <View style={styles.infoIcon}>
              <MaterialIcons name="info-outline" size={18} color="#6B2FA0" />
            </View>
            <Text style={styles.infoText}>
              {isEdit
                ? "Your changes will be sent to admin for review. The restaurant status will be set back to Pending until approved."
                : "Your restaurant will be reviewed by our team. You'll be notified once approved."}
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        {uploading ? (
          <View style={styles.uploadingRow}>
            <ActivityIndicator size="small" color="#6B2FA0" />
            <Text style={styles.uploadingText}>{progress}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={!coverImage}
            style={[styles.ctaWrap, !coverImage && { opacity: 0.5 }]}
          >
            <LinearGradient
              colors={["#6B2FA0", "#FF5A5F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
              <Text style={styles.ctaText}>
                {isEdit ? "Submit Changes" : "Submit for Approval"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F2F7" },
  header: { paddingHorizontal: 16, paddingBottom: 20, overflow: "hidden" },
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
  dotActive: { backgroundColor: "rgba(255,159,67,0.6)" },
  dotCurrent: { width: 20, backgroundColor: "#FF9F43" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,159,67,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  cardSub: { fontSize: 11, color: "#8A95A3", marginTop: 2 },
  req: { color: "#FF5A5F" },
  opt: { fontSize: 12, fontWeight: "500", color: "#8A95A3" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F5F6F8",
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
  },
  chipSel: {
    backgroundColor: "#FF9F43",
    borderColor: "#FF9F43",
    shadowColor: "#FF9F43",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  chipSelPurple: {
    backgroundColor: "#6B2FA0",
    borderColor: "#6B2FA0",
    shadowColor: "#6B2FA0",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#0F1B2D" },
  chipTextSel: { color: "#FFF", fontWeight: "700" },
  coverWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
  },
  coverImg: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  coverBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(107,47,160,0.85)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  coverBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  uploadZone: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(107,47,160,0.3)",
    backgroundColor: "#F8F6FF",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(107,47,160,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadTitle: { fontSize: 15, fontWeight: "700", color: "#3D1A6E" },
  uploadSub: { fontSize: 11, color: "#8A95A3" },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  galleryItem: {
    position: "relative",
    width: "30.5%",
    aspectRatio: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  galleryImg: { width: "100%", height: "100%" },
  galleryRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  galleryAdd: {
    width: "30.5%",
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#DDE1EC",
    backgroundColor: "#F8F9FC",
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: { borderRadius: 14, overflow: "hidden" },
  infoInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(107,47,160,0.15)",
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(107,47,160,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  infoText: { flex: 1, fontSize: 13, color: "#3D1A6E", lineHeight: 20 },
  bottomBar: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
  },
  uploadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 15,
  },
  uploadingText: { fontSize: 14, color: "#6B2FA0", fontWeight: "600" },
  ctaWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#6B2FA0",
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
  },
  ctaText: { fontSize: 16, fontWeight: "800", color: "#FFF" },
});