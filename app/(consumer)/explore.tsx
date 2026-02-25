import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "../../contexts/LocationContext";
import { restaurantService } from "../../services/restaurantService";
import LocationFetchingModal from "../../components/common/LocationFetchingModal";
import ExploreHeader from "../../components/consumer/ExploreHeader";
import SearchBar from "../../components/restaurant/SearchBar";
import CuisineFilter from "../../components/restaurant/CuisineFilter";
import RestaurantCard, {
  RestaurantCardSkeleton,
} from "../../components/restaurant/RestaurantCard";
import { Restaurant } from "../../types";

type ListItem =
  | { type: "header" }
  | { type: "search" }
  | { type: "filter" }
  | { type: "restaurant"; data: Restaurant }
  | { type: "skeleton"; id: string };

// Show 3 skeletons while refreshing
const SKELETON_ITEMS: ListItem[] = [
  { type: "skeleton", id: "sk1" },
  { type: "skeleton", id: "sk2" },
  { type: "skeleton", id: "sk3" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loading: locationLoading } = useLocation();

  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const data = (await restaurantService.getRestaurants()).restaurants;
      setAllRestaurants(data);
      setRestaurants(data);
    } catch (e) {
      console.error("Error fetching restaurants:", e);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchQuery("");
    setSelectedCuisine(null);
    try {
      const data = (await restaurantService.getRestaurants()).restaurants;
      setAllRestaurants(data);
      setRestaurants(data);
    } catch (e) {
      console.error("Error refreshing restaurants:", e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Local search + cuisine filter
  useEffect(() => {
    let filtered = [...allRestaurants];
    const q = searchQuery.trim().toLowerCase();

    if (selectedCuisine) {
      filtered = filtered.filter((r) => r.cuisine.includes(selectedCuisine));
    }
    if (q.length > 0) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.some((c) => c.toLowerCase().includes(q)) ||
          r.address?.city?.toLowerCase().includes(q) ||
          r.address?.state?.toLowerCase().includes(q),
      );
    }

    setRestaurants(filtered);
  }, [searchQuery, selectedCuisine, allRestaurants]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 80 && !isScrolled) setIsScrolled(true);
    else if (offsetY <= 80 && isScrolled) setIsScrolled(false);
  };

  // While refreshing: replace restaurant rows with skeletons
  const restaurantRows: ListItem[] = refreshing
    ? SKELETON_ITEMS
    : restaurants.map((r): ListItem => ({ type: "restaurant", data: r }));

  const listData: ListItem[] = [
    { type: "header" },
    { type: "search" },
    { type: "filter" },
    ...restaurantRows,
  ];

  const renderItem = ({ item }: { item: ListItem }) => {
    switch (item.type) {
      case "header":
        return <ExploreHeader />;

      case "search":
        return (
          <View
            style={[
              styles.stickyWrapper,
              { paddingTop: isScrolled ? insets.top : 0 },
            ]}
          >
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSearch={(text) => setSearchQuery(text)}
              onFilterPress={() => {}}
            />
          </View>
        );

      case "filter":
        return (
          <View style={styles.whiteSection}>
            <CuisineFilter
              selectedCuisine={selectedCuisine}
              onSelectCuisine={setSelectedCuisine}
            />
          </View>
        );

      case "skeleton":
        return <RestaurantCardSkeleton />;

      case "restaurant":
        return (
          <RestaurantCard
            restaurant={item.data}
            onPress={() =>
              router.push(`/(consumer)/restaurant/${item.data.id}`)
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isScrolled ? "dark-content" : "light-content"}
        translucent
        backgroundColor="transparent"
      />

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === "skeleton"
            ? item.id
            : item.type === "restaurant"
              ? item.data.id
              : `${item.type}-${index}`
        }
        stickyHeaderIndices={[1]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#FF5A5F"]}
            tintColor="#FF5A5F"
            progressViewOffset={0}
          />
        }
      />

      <LocationFetchingModal visible={locationLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },
  stickyWrapper: {
    backgroundColor: "#FFFFFF",
    marginTop: -2,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF2",
    paddingBottom: 8,
    paddingHorizontal: 4,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  whiteSection: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EDEEF2",
    paddingBottom: 4,
  },
  listContent: { paddingBottom: 100 },
});
