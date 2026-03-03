import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { TableLocation } from "../../../types";

interface Table {
  tableId: string;
  tableNumber: string;
  capacity: number;
  location: TableLocation;
}

const LOCATION_OPTIONS: {
  value: TableLocation;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "indoor", label: "Indoor", icon: "meeting-room", color: "#6B2FA0" },
  { value: "outdoor", label: "Outdoor", icon: "wb-sunny", color: "#FF9F43" },
  { value: "private", label: "Private", icon: "lock", color: "#FF5A5F" },
];

export default function RegisterStep4() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const isEdit = params.isEdit === "true";

  // ── Pre-fill tables from params if in edit mode ──
  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const raw = params.tables as string;
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [location, setLocation] = useState<TableLocation>("indoor");

  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);

  const handleAdd = () => {
    if (!tableNumber.trim())
      return Alert.alert("Required", "Enter a table number");
    const cap = parseInt(capacity);
    if (!cap || cap < 1 || cap > 30)
      return Alert.alert("Invalid", "Capacity must be between 1 and 30");
    if (tables.some((t) => t.tableNumber === tableNumber.trim()))
      return Alert.alert("Duplicate", "Table number already exists");
    setTables((prev) => [
      ...prev,
      {
        tableId: `T${Date.now()}`,
        tableNumber: tableNumber.trim(),
        capacity: cap,
        location,
      },
    ]);
    setShowForm(false);
    setTableNumber("");
    setCapacity("2");
    setLocation("indoor");
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Table", "Remove this table?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setTables((t) => t.filter((x) => x.tableId !== id)),
      },
    ]);
  };

  const handleContinue = () => {
    if (tables.length === 0)
      return Alert.alert("Required", "Add at least one table");
    router.push({
      pathname: "/(owner)/register-restaurant/step5",
      params: {
        ...params,
        tables: JSON.stringify(tables),
        totalCapacity: totalCapacity.toString(),
      },
    });
  };

  const grouped = LOCATION_OPTIONS.map((opt) => ({
    ...opt,
    tables: tables.filter((t) => t.location === opt.value),
  }));

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
            <Text style={styles.headerSub}>Step 4 of 5 — Tables</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: "80%" }]}
          />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i <= 4 && styles.dotActive,
                i === 4 && styles.dotCurrent,
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
        <View style={styles.statsRow}>
          {[
            {
              icon: "table-restaurant",
              label: "Tables",
              value: tables.length,
              color: "#6B2FA0",
            },
            {
              icon: "people",
              label: "Total Seats",
              value: totalCapacity,
              color: "#FF9F43",
            },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View
                style={[styles.statIcon, { backgroundColor: `${s.color}15` }]}
              >
                <MaterialIcons name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {!showForm && (
          <TouchableOpacity
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
            style={styles.addBtn}
          >
            <LinearGradient
              colors={["rgba(107,47,160,0.08)", "rgba(107,47,160,0.04)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addBtnInner}
            >
              <MaterialIcons
                name="add-circle-outline"
                size={22}
                color="#6B2FA0"
              />
              <Text style={styles.addBtnText}>Add Table</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formTitleRow}>
              <Text style={styles.formTitle}>New Table</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <View style={styles.formCloseBtn}>
                  <MaterialIcons name="close" size={16} color="#8A95A3" />
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Table No.</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. T1, A1"
                  value={tableNumber}
                  onChangeText={setTableNumber}
                  placeholderTextColor="#B0B8C4"
                />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Seats</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="2"
                  value={capacity}
                  onChangeText={setCapacity}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholderTextColor="#B0B8C4"
                />
              </View>
            </View>
            <Text style={styles.formLabel}>Location</Text>
            <View style={styles.locationRow}>
              {LOCATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.locationBtn,
                    location === opt.value && styles.locationBtnActive,
                    location === opt.value && { borderColor: opt.color },
                  ]}
                  onPress={() => setLocation(opt.value)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={opt.icon as any}
                    size={18}
                    color={location === opt.value ? opt.color : "#8A95A3"}
                  />
                  <Text
                    style={[
                      styles.locationBtnText,
                      location === opt.value && { color: opt.color },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.85}
                style={styles.saveWrap}
              >
                <LinearGradient
                  colors={["#6B2FA0", "#3D1A6E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  <MaterialIcons name="add" size={18} color="#FFF" />
                  <Text style={styles.saveBtnText}>Add Table</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {grouped
          .filter((g) => g.tables.length > 0)
          .map((group) => (
            <View key={group.value}>
              <View style={styles.groupHeader}>
                <MaterialIcons
                  name={group.icon as any}
                  size={14}
                  color={group.color}
                />
                <Text style={[styles.groupLabel, { color: group.color }]}>
                  {group.label} ({group.tables.length})
                </Text>
              </View>
              {group.tables.map((table) => (
                <View key={table.tableId} style={styles.tableRow}>
                  <View
                    style={[
                      styles.tableIconWrap,
                      { backgroundColor: `${group.color}12` },
                    ]}
                  >
                    <MaterialIcons
                      name={group.icon as any}
                      size={18}
                      color={group.color}
                    />
                  </View>
                  <View style={styles.tableInfo}>
                    <Text style={styles.tableName}>
                      Table {table.tableNumber}
                    </Text>
                    <Text style={styles.tableSub}>{table.capacity} seats</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(table.tableId)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color="#FF5A5F"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={tables.length === 0}
          style={[styles.ctaWrap, tables.length === 0 && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={["#FF5A5F", "#FF9F43"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>Continue</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
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
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 26, fontWeight: "900", color: "#0F1B2D" },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8A95A3",
    marginTop: 2,
  },
  addBtn: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(107,47,160,0.3)",
  },
  addBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  addBtnText: { fontSize: 15, fontWeight: "700", color: "#6B2FA0" },
  formCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  formTitle: { fontSize: 16, fontWeight: "800", color: "#0F1B2D" },
  formCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#F0F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  formRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  formField: { flex: 1 },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A95A3",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  formInput: {
    backgroundColor: "#F8F9FC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: "#0F1B2D",
  },
  locationRow: { flexDirection: "row", gap: 8, marginBottom: 16, marginTop: 4 },
  locationBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    backgroundColor: "#F8F9FC",
  },
  locationBtnActive: { backgroundColor: "#FFF", borderWidth: 2 },
  locationBtnText: { fontSize: 12, fontWeight: "700", color: "#8A95A3" },
  formActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EEF0F4",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#8A95A3" },
  saveWrap: { flex: 2, borderRadius: 12, overflow: "hidden" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#1A0A2E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tableIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  tableInfo: { flex: 1 },
  tableName: { fontSize: 14, fontWeight: "700", color: "#0F1B2D" },
  tableSub: { fontSize: 12, color: "#8A95A3", marginTop: 1 },
  deleteBtn: { padding: 4 },
  bottomBar: {
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F4",
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FF5A5F",
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