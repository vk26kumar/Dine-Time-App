import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocation } from "../../contexts/LocationContext";

interface SearchResult {
  id: string;
  mainText: string;
  subText: string;
  latitude: number;
  longitude: number;
  fullAddress: string;
}

// In-memory recents — survives navigation, resets on app restart
let recentSearches: SearchResult[] = [];

export default function LocationSelector() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    setCurrentAddress,
    requestLocation,
    loading: gpsLoading,
  } = useLocation();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<TextInput>(null);

  // ✅ FIXED: Provide initial value
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ✅ Cleanup when component unmounts
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((text: string) => {
    setQuery(text);
    setError("");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (text.trim().length < 3) {
      setResults([]);
      return;
    }

    setSearching(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const geocoded = await Location.geocodeAsync(text.trim());

        if (geocoded.length === 0) {
          setResults([]);
          setError("No locations found. Try a different search.");
          setSearching(false);
          return;
        }

        const enriched: SearchResult[] = await Promise.all(
          geocoded.slice(0, 6).map(async (g, i) => {
            const reversed = await Location.reverseGeocodeAsync({
              latitude: g.latitude,
              longitude: g.longitude,
            });

            const r = reversed[0];

            const mainText = r
              ? [r.name, r.street].filter(Boolean).join(", ") || text
              : text;

            const subText = r
              ? [r.city || r.subregion, r.region, r.country]
                  .filter(Boolean)
                  .join(", ")
              : `${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}`;

            const fullAddress = r
              ? [
                  r.name,
                  r.street,
                  r.city || r.subregion,
                  r.region,
                  r.postalCode,
                  r.country,
                ]
                  .filter(Boolean)
                  .join(", ")
              : subText;

            return {
              id: `${g.latitude}-${g.longitude}-${i}`,
              mainText,
              subText,
              latitude: g.latitude,
              longitude: g.longitude,
              fullAddress,
            };
          }),
        );

        const seen = new Set<string>();
        const unique = enriched.filter((r) => {
          const key = `${r.mainText}|${r.subText}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setResults(unique);
      } catch (e) {
        setError("Search failed. Check your connection.");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  const handleSelect = (item: SearchResult) => {
    Keyboard.dismiss();

    recentSearches = [
      item,
      ...recentSearches.filter((r) => r.id !== item.id),
    ].slice(0, 5);

    setCurrentAddress({
      id: item.id,
      label: item.mainText,
      address: item.fullAddress,
      coordinates: { latitude: item.latitude, longitude: item.longitude },
      isActive: true,
    });

    router.back();
  };

  const handleGPS = async () => {
    Keyboard.dismiss();
    await requestLocation();
    router.back();
  };

  const showRecent = query.trim().length === 0 && recentSearches.length > 0;

  const listData =
    query.trim().length >= 3 ? results : showRecent ? recentSearches : [];

  const sectionLabel = showRecent
    ? "RECENT"
    : results.length > 0
      ? "RESULTS"
      : "";

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#1A0A2E", "#3D1A6E", "#6B2FA0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Set Location</Text>
            <Text style={styles.headerSub}>
              Search any city, area or landmark
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Search bar */}
        <View style={[styles.searchWrap, focused && styles.searchWrapFocused]}>
          <MaterialIcons
            name="search"
            size={20}
            color={focused ? "#FF5A5F" : "#8A95A3"}
          />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="e.g. Lucknow, Hazratganj, MG Road…"
            placeholderTextColor={
              focused ? "#B0B8C4" : "rgba(255,255,255,0.45)"
            }
            value={query}
            onChangeText={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color="#FF5A5F" />
          ) : query.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setResults([]);
                setError("");
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.clearBtn}>
                <MaterialIcons name="close" size={12} color="#8A95A3" />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.accentBar}>
          <View style={[styles.accentSeg, { backgroundColor: "#FF5A5F" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#FF9F43" }]} />
          <View style={[styles.accentSeg, { backgroundColor: "#A855F7" }]} />
        </View>
      </LinearGradient>

      {/* GPS Row */}
      <TouchableOpacity
        onPress={handleGPS}
        disabled={gpsLoading}
        style={styles.gpsRow}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#FF5A5F", "#FF9F43"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gpsIcon}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <MaterialIcons name="my-location" size={18} color="#FFF" />
          )}
        </LinearGradient>
        <View style={styles.gpsTextWrap}>
          <Text style={styles.gpsTitle}>
            {gpsLoading ? "Detecting location…" : "Use current location"}
          </Text>
          <Text style={styles.gpsSub}>Auto-detect via GPS</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#C4CAD4" />
      </TouchableOpacity>

      <View style={styles.listDivider} />

      {/* Results List */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListHeaderComponent={
          sectionLabel ? (
            <Text style={styles.sectionLabel}>{sectionLabel}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultRow}
            onPress={() => handleSelect(item)}
            activeOpacity={0.75}
          >
            <View style={styles.resultIcon}>
              <MaterialIcons
                name={showRecent ? "history" : "place"}
                size={18}
                color={showRecent ? "#8A95A3" : "#FF5A5F"}
              />
            </View>
            <View style={styles.resultText}>
              <Text style={styles.resultMain} numberOfLines={1}>
                {item.mainText}
              </Text>
              <Text style={styles.resultSub} numberOfLines={1}>
                {item.subText}
              </Text>
            </View>
            <MaterialIcons name="north-west" size={15} color="#D0D5DD" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F6F8" },

  header: { paddingHorizontal: 16, paddingBottom: 0, overflow: "hidden" },

  orb1: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,90,95,0.15)",
    top: -30,
    right: -10,
  },
  orb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,159,67,0.1)",
    top: 20,
    right: 80,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
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
  },
  headerSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchWrapFocused: {
    backgroundColor: "#FFF",
    borderColor: "#FF5A5F",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F1B2D",
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EEF0F4",
    justifyContent: "center",
    alignItems: "center",
  },

  accentBar: { flexDirection: "row", height: 3 },
  accentSeg: { flex: 1 },

  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  gpsIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  gpsTextWrap: { flex: 1 },
  gpsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1B2D",
  },
  gpsSub: {
    fontSize: 12,
    color: "#8A95A3",
    marginTop: 1,
  },
  listDivider: { height: 1, backgroundColor: "#EEF0F4" },

  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A95A3",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
  },
  resultIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#F5F6F8",
    justifyContent: "center",
    alignItems: "center",
  },
  resultText: { flex: 1 },
  resultMain: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F1B2D",
  },
  resultSub: {
    fontSize: 12,
    color: "#8A95A3",
    marginTop: 2,
  },
  separator: { height: 6 },
});
