// app/(consumer)/favourites.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  favouritesService,
  FavouriteItem,
} from "../../services/favouritesService";

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [favourites, setFavourites] = useState<FavouriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await favouritesService.getAll();
      data.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
      setFavourites(data);
    } catch {
      Alert.alert("Error", "Could not load favourites.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Refresh every time the screen comes into focus ────────────────────────
  // Handles: user saves/unsaves from restaurant detail or card, then navigates here
  useFocusEffect(
    useCallback(() => {
      load(true); // silent = don't flash full-screen spinner on re-focus
    }, [load]),
  );

  const handleRemove = async (item: FavouriteItem) => {
    Alert.alert(
      "Remove Favourite",
      `Remove ${item.restaurantName} from your favourites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemoving(item.restaurantId);
            try {
              await favouritesService.remove(item.restaurantId);
              // Optimistically remove from list
              setFavourites((prev) =>
                prev.filter((f) => f.restaurantId !== item.restaurantId),
              );
            } catch {
              Alert.alert("Error", "Could not remove. Please try again.");
            } finally {
              setRemoving(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: FavouriteItem }) => {
    const isFree = item.bookingFeePerPerson === 0;
    const hasRating = (item.averageRating ?? 0) > 0;
    const isRemoving = removing === item.restaurantId;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={() =>
          router.push(`/(consumer)/restaurant/${item.restaurantId}` as any)
        }
      >
        <View style={styles.imageWrap}>
          <Image
            source={{
              uri:
                item.coverImage ||
                "https://via.placeholder.com/400x160?text=No+Image",
            }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(15,27,45,0.75)"]}
            style={styles.imageGradient}
          />

          {isFree && (
            <View style={styles.freeBadge}>
              <MaterialIcons name="local-offer" size={10} color="#FFF" />
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          )}

          {hasRating && (
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={11} color="#FF9F43" />
              <Text style={styles.ratingText}>
                {item.averageRating!.toFixed(1)}
              </Text>
            </View>
          )}

          <View style={styles.imageOverlay}>
            <Text style={styles.nameOnImage} numberOfLines={1}>
              {item.restaurantName}
            </Text>
            <View style={styles.locationRow}>
              <MaterialIcons
                name="place"
                size={11}
                color="rgba(255,255,255,0.8)"
              />
              <Text style={styles.locationText}>{item.city}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.contentRow}>
            <View style={styles.cuisineRow}>
              {item.cuisine.slice(0, 2).map((c, i) => (
                <View key={i} style={styles.cuisineTag}>
                  <Text style={styles.cuisineText}>{c}</Text>
                </View>
              ))}
            </View>
            <View>
              {isFree ? (
                <Text style={styles.freeText}>Free</Text>
              ) : (
                <Text style={styles.priceText}>
                  ₹{item.bookingFeePerPerson}
                  <Text style={styles.pricePer}>/person</Text>
                </Text>
              )}
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.savedRow}>
              <MaterialIcons name="bookmark" size={12} color="#8A95A3" />
              <Text style={styles.savedText}>
                Saved{" "}
                {item.savedAt.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(item)}
                activeOpacity={0.7}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <MaterialIcons name="favorite" size={18} color="#EF4444" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bookBtn}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    `/(consumer)/restaurant/${item.restaurantId}` as any,
                  )
                }
              >
                <LinearGradient
                  colors={["#FF5A5F", "#FF9F43"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookBtnGrad}
                >
                  <Text style={styles.bookBtnText}>Book</Text>
                  <MaterialIcons name="arrow-forward" size={13} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={["#FFF0F0", "#FFF7F0"]}
        style={styles.emptyIconWrap}
      >
        <MaterialIcons name="favorite-border" size={40} color="#FF9F43" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No favourites yet</Text>
      <Text style={styles.emptySub}>
        Tap the heart on any restaurant to save it here for quick access
      </Text>
      <TouchableOpacity
        style={styles.exploreBtn}
        onPress={() => router.replace("/(consumer)/explore")}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={["#FF5A5F", "#FF9F43"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.exploreBtnGrad}
        >
          <MaterialIcons name="explore" size={16} color="#FFF" />
          <Text style={styles.exploreBtnText}>Explore Restaurants</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A0A2E" />

      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.headerOrb1} />
        <View style={styles.headerOrb2} />
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Favourites</Text>
            {!loading && favourites.length > 0 && (
              <View style={styles.countPill}>
                <Text style={styles.countText}>{favourites.length} saved</Text>
              </View>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#FF5A5F" />
      ) : (
        <FlatList
          data={favourites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={["#FF5A5F"]}
              tintColor="#FF5A5F"
            />
          }
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  header: { overflow: "hidden", paddingHorizontal: 16, paddingBottom: 20 },
  headerOrb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,90,95,0.18)",
    top: -40,
    right: -20,
  },
  headerOrb2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,159,67,0.12)",
    top: 20,
    right: 70,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFF" },
  countPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#EEF0F4",
  },
  imageWrap: { width: "100%", height: 160, position: "relative" },
  image: { width: "100%", height: "100%" },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  freeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFF" },
  ratingBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(15,27,45,0.65)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 11, fontWeight: "700", color: "#FFF" },
  imageOverlay: { position: "absolute", bottom: 10, left: 12, right: 12 },
  nameOnImage: { fontSize: 16, fontWeight: "800", color: "#FFF" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  locationText: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  content: { padding: 12 },
  contentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cuisineRow: { flexDirection: "row", gap: 6 },
  cuisineTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,90,95,0.07)",
    borderRadius: 6,
  },
  cuisineText: { fontSize: 11, fontWeight: "600", color: "#FF5A5F" },
  priceText: { fontSize: 14, fontWeight: "800", color: "#0F1B2D" },
  pricePer: { fontSize: 11, fontWeight: "500", color: "#8A95A3" },
  freeText: { fontSize: 14, fontWeight: "800", color: "#10B981" },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  savedText: { fontSize: 11, color: "#8A95A3", fontWeight: "500" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
  },
  bookBtn: { borderRadius: 10, overflow: "hidden" },
  bookBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bookBtnText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F1B2D",
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 13,
    color: "#8A95A3",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  exploreBtn: { borderRadius: 14, overflow: "hidden" },
  exploreBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  exploreBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});
