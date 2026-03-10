// app/(admin)/pending-approvals.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { Restaurant } from "../../types";
import { LinearGradient } from "expo-linear-gradient";

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
  green: "#10B981",
  greenBg: "#D1FAE5",
  amber: "#F59E0B",
  amberBg: "#FFFBEB",
};

const InfoItem = ({ icon, text }: { icon: any; text: string }) => (
  <View style={st.infoItem}>
    <MaterialIcons name={icon} size={15} color={C.textMuted} />
    <Text style={st.infoText}>{text}</Text>
  </View>
);

export default function PendingApprovalsScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingRestaurants();
  }, []);

  const loadPendingRestaurants = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "restaurants"),
        where("status", "==", "pending"),
      );
      const snapshot = await getDocs(q);
      const restaurantsList: Restaurant[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        restaurantsList.push({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Restaurant);
      });
      setRestaurants(restaurantsList);
    } catch (error) {
      console.error("Error loading pending restaurants:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPendingRestaurants();
  };

  const handleApprove = async (restaurant: Restaurant) => {
    Alert.alert(
      "Approve Restaurant",
      `Are you sure you want to approve "${restaurant.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            try {
              setProcessing(true);
              await updateDoc(doc(db, "restaurants", restaurant.id), {
                status: "approved",
                approvedAt: serverTimestamp(),
                approvedBy: user?.uid,
                updatedAt: serverTimestamp(),
              });
              Alert.alert("Success", "Restaurant approved successfully");
              loadPendingRestaurants();
            } catch (error) {
              Alert.alert("Error", "Failed to approve restaurant");
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a rejection reason");
      return;
    }
    if (!selectedRestaurant) return;
    try {
      setProcessing(true);
      await updateDoc(doc(db, "restaurants", selectedRestaurant.id), {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Success", "Restaurant rejected");
      setShowRejectModal(false);
      setSelectedRestaurant(null);
      setRejectionReason("");
      loadPendingRestaurants();
    } catch (error) {
      Alert.alert("Error", "Failed to reject restaurant");
    } finally {
      setProcessing(false);
    }
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <View style={st.restaurantCard}>
      <View style={st.imageContainer}>
        <Image
          source={{ uri: item.images.coverImage }}
          style={st.restaurantImage}
          resizeMode="cover"
        />
        <View style={st.imageOverlay}>
          <View style={st.statusBadge}>
            <MaterialIcons name="schedule" size={13} color={C.amber} />
            <Text style={st.statusText}>Pending Review</Text>
          </View>
        </View>
      </View>
      <View style={st.cardContent}>
        <View style={st.nameSection}>
          <Text style={st.restaurantName}>{item.name}</Text>
          <View style={st.priceBadge}>
            <Text style={st.priceText}>{item.bookingFeePerPerson}</Text>
          </View>
        </View>
        <Text style={st.description} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={st.infoSection}>
          <InfoItem
            icon="place"
            text={`${item.address.city}, ${item.address.state}`}
          />
          <InfoItem icon="phone" text={item.phone} />
          <InfoItem icon="person-outline" text={item.ownerName} />
          <InfoItem icon="event-seat" text={`${item.totalCapacity} seats`} />
        </View>
        <View style={st.cuisineSection}>
          <Text style={st.cuisineLabel}>Cuisines</Text>
          <View style={st.cuisineList}>
            {item.cuisine.slice(0, 4).map((cuisine, index) => (
              <View key={index} style={st.cuisineChip}>
                <Text style={st.cuisineText}>{cuisine}</Text>
              </View>
            ))}
            {item.cuisine.length > 4 && (
              <View style={st.cuisineChip}>
                <Text style={st.cuisineText}>+{item.cuisine.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={st.divider} />
        <View style={st.actionSection}>
          <TouchableOpacity
            style={st.approveButton}
            onPress={() => handleApprove(item)}
            disabled={processing}
            activeOpacity={0.85}
          >
            <MaterialIcons name="check-circle" size={20} color={C.white} />
            <Text style={st.approveText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.rejectButton}
            onPress={() => {
              setSelectedRestaurant(item);
              setShowRejectModal(true);
            }}
            disabled={processing}
            activeOpacity={0.85}
          >
            <MaterialIcons name="cancel" size={20} color={C.white} />
            <Text style={st.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={st.emptyContainer}>
      <LinearGradient
        colors={["#D1FAE5", "#a7f3d0"]}
        style={st.emptyIconCircle}
      >
        <MaterialIcons name="check-circle-outline" size={48} color={C.green} />
      </LinearGradient>
      <Text style={st.emptyTitle}>All Caught Up!</Text>
      <Text style={st.emptySubtitle}>
        No pending restaurant approvals at the moment.
      </Text>
      <Text style={st.emptyHint}>
        New submissions will appear here for review.
      </Text>
    </View>
  );

  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff2e1" />
      <LinearGradient
        colors={["#fff2e1", "#fde8c8", "#fff2e1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[st.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={st.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={st.headerTitle}>Pending Approvals</Text>
            <Text style={st.headerSubtitle}>
              Review and approve restaurant applications
            </Text>
          </View>
          {restaurants.length > 0 && (
            <View style={st.countBadge}>
              <Text style={st.countText}>{restaurants.length}</Text>
            </View>
          )}
        </View>
      </LinearGradient>
      {loading ? (
        <View style={st.loadingContainer}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={st.loadingText}>Loading pending approvals...</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          renderItem={renderRestaurant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.accent}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="none"
        onRequestClose={() => {
          setShowRejectModal(false);
          setSelectedRestaurant(null);
          setRejectionReason("");
        }}
      >
        <View style={st.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => {
              setShowRejectModal(false);
              setSelectedRestaurant(null);
              setRejectionReason("");
            }}
          />
          <View style={st.modalSheet}>
            <View style={st.sheetHandle} />
            <View style={st.modalHeaderRow}>
              <View>
                <Text style={st.modalTitle}>Reject Restaurant</Text>
                <Text style={st.modalSub}>Provide a reason for the owner</Text>
              </View>
              <TouchableOpacity
                style={st.closeBtn}
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedRestaurant(null);
                  setRejectionReason("");
                }}
              >
                <MaterialIcons name="close" size={18} color={C.textSub} />
              </TouchableOpacity>
            </View>
            <View style={st.modalIconCircle}>
              <MaterialIcons name="cancel" size={28} color={C.error} />
            </View>
            <Text style={st.modalDesc}>
              Please provide a clear reason for rejection. This will help the
              restaurant owner understand what needs to be improved.
            </Text>
            <Text style={st.inputLabel}>Rejection Reason</Text>
            <TextInput
              style={st.textInput}
              placeholder="e.g., Incomplete documentation, invalid license..."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              placeholderTextColor={C.textMuted}
              textAlignVertical="top"
            />
            <View style={st.modalActions}>
              <TouchableOpacity
                style={st.cancelButton}
                onPress={() => {
                  setShowRejectModal(false);
                  setSelectedRestaurant(null);
                  setRejectionReason("");
                }}
                disabled={processing}
              >
                <Text style={st.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.confirmButton, processing && st.buttonDisabled]}
                onPress={handleRejectConfirm}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color={C.white} size="small" />
                ) : (
                  <>
                    <MaterialIcons name="cancel" size={18} color={C.white} />
                    <Text style={st.confirmButtonText}>Reject</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 13, color: C.textSub, fontWeight: "500" },
  countBadge: {
    backgroundColor: C.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 36,
    alignItems: "center",
  },
  countText: { fontSize: 14, fontWeight: "700", color: C.white },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: C.textSub, fontWeight: "500" },
  listContent: { padding: 14, paddingBottom: 110 },
  restaurantCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.divider,
  },
  imageContainer: { position: "relative", width: "100%", height: 190 },
  restaurantImage: {
    width: "100%",
    height: "100%",
    backgroundColor: C.divider,
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "space-between",
    padding: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: C.amberBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  statusText: { fontSize: 12, fontWeight: "700", color: C.amber },
  cardContent: { padding: 14 },
  nameSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  restaurantName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginRight: 10,
  },
  priceBadge: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  priceText: { fontSize: 12, fontWeight: "700", color: C.accent },
  description: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 19,
    marginBottom: 14,
  },
  infoSection: { gap: 7, marginBottom: 14 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  infoText: { fontSize: 13, color: C.textSub, fontWeight: "500" },
  cuisineSection: { marginBottom: 14 },
  cuisineLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cuisineList: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  cuisineChip: {
    backgroundColor: C.accentBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  cuisineText: { fontSize: 12, color: C.accent, fontWeight: "600" },
  divider: { height: 1, backgroundColor: C.divider, marginBottom: 14 },
  actionSection: { flexDirection: "row", gap: 10 },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.green,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 7,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  approveText: { fontSize: 14, fontWeight: "700", color: C.white },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.error,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 7,
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  rejectText: { fontSize: 14, fontWeight: "700", color: C.white },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textSub,
    textAlign: "center",
    marginBottom: 4,
  },
  emptyHint: { fontSize: 13, color: C.textMuted, textAlign: "center" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
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
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  modalSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.errorBg,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalDesc: {
    fontSize: 13,
    color: C.textSub,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.accentBg,
    minHeight: 110,
    fontWeight: "500",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.divider,
    alignItems: "center",
  },
  cancelButtonText: { fontSize: 14, fontWeight: "600", color: C.textSub },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: C.error,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  confirmButtonText: { fontSize: 14, fontWeight: "700", color: C.white },
  buttonDisabled: { opacity: 0.6 },
});
