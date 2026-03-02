// import React, { useRef, useEffect } from "react";
// import {
//   View,
//   TextInput,
//   StyleSheet,
//   TouchableOpacity,
//   Animated,
// } from "react-native";
// import { MaterialIcons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";

// interface SearchBarProps {
//   value: string;
//   onChangeText: (text: string) => void;
//   onSearch: (text: string) => void;
//   onFilterPress: () => void;
// }

// export default function SearchBar({
//   value,
//   onChangeText,
//   onSearch,
//   onFilterPress,
// }: SearchBarProps) {
//   const inputScale = useRef(new Animated.Value(1)).current;
//   const glowAnim = useRef(new Animated.Value(0)).current;
//   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // 🔥 Debounce Search
//   useEffect(() => {
//     if (debounceRef.current) {
//       clearTimeout(debounceRef.current);
//     }

//     debounceRef.current = setTimeout(() => {
//       onSearch(value.trim());
//     }, 500);

//     return () => {
//       if (debounceRef.current) {
//         clearTimeout(debounceRef.current);
//       }
//     };
//   }, [value]);

//   const onInputFocus = () => {
//     Animated.parallel([
//       Animated.spring(inputScale, {
//         toValue: 1.015,
//         useNativeDriver: true,
//         speed: 40,
//       }),
//       Animated.timing(glowAnim, {
//         toValue: 1,
//         duration: 250,
//         useNativeDriver: false,
//       }),
//     ]).start();
//   };

//   const onInputBlur = () => {
//     Animated.parallel([
//       Animated.spring(inputScale, {
//         toValue: 1,
//         useNativeDriver: true,
//         speed: 40,
//       }),
//       Animated.timing(glowAnim, {
//         toValue: 0,
//         duration: 250,
//         useNativeDriver: false,
//       }),
//     ]).start();
//   };

//   const borderColor = glowAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: ["rgba(255,255,255,0.08)", "rgba(255,90,95,0.5)"],
//   });

//   return (
//     <View style={styles.container}>
//       <Animated.View
//         style={[styles.pillWrap, { transform: [{ scale: inputScale }] }]}
//       >
//         <LinearGradient
//           colors={["#12082A", "#1E0D42", "#2A1558"]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.pill}
//         >
//           <Animated.View style={[styles.focusRing, { borderColor }]} />
//           <View style={styles.orb} />
//           <View style={styles.orb2} />

//           {/* Search Icon */}
//           <View style={styles.searchIconWrap}>
//             <LinearGradient
//               colors={["#FF5A5F", "#FF9F43"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={styles.searchIconGrad}
//             >
//               <MaterialIcons name="search" size={17} color="#FFFFFF" />
//             </LinearGradient>
//           </View>

//           {/* Input */}
//           <TextInput
//             style={styles.input}
//             placeholder="Search restaurants, cuisines…"
//             value={value}
//             onChangeText={onChangeText}
//             placeholderTextColor="#FFFFFF"
//             returnKeyType="search"
//             onFocus={onInputFocus}
//             onBlur={onInputBlur}
//             onSubmitEditing={() => onSearch(value.trim())}
//           />

//           {/* Clear Button */}
//           {value.length > 0 && (
//             <TouchableOpacity
//               onPress={() => onChangeText("")}
//               hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//               activeOpacity={0.7}
//             >
//               <View style={styles.clearBtn}>
//                 <MaterialIcons
//                   name="close"
//                   size={11}
//                   color="rgba(255,255,255,0.8)"
//                 />
//               </View>
//             </TouchableOpacity>
//           )}

//           <View style={styles.divider} />

//           {/* Filter Button */}
//           <TouchableOpacity
//             onPress={onFilterPress}
//             activeOpacity={0.75}
//             style={styles.filterBtn}
//           >
//             <LinearGradient
//               colors={["rgba(255,90,95,0.2)", "rgba(255,159,67,0.2)"]}
//               start={{ x: 0, y: 0 }}
//               end={{ x: 1, y: 1 }}
//               style={styles.filterGrad}
//             >
//               <MaterialIcons name="tune" size={18} color="#FF9F43" />
//             </LinearGradient>
//           </TouchableOpacity>
//         </LinearGradient>
//       </Animated.View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#FFFFFF",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   pillWrap: {
//     borderRadius: 18,
//     shadowColor: "#1A0A2E",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.22,
//     shadowRadius: 14,
//     elevation: 8,
//   },
//   pill: {
//     flexDirection: "row",
//     alignItems: "center",
//     height: 52,
//     borderRadius: 18,
//     paddingHorizontal: 10,
//     gap: 10,
//     overflow: "hidden",
//   },
//   focusRing: {
//     position: "absolute",
//     inset: 0,
//     borderRadius: 18,
//     borderWidth: 1.5,
//   },
//   orb: {
//     position: "absolute",
//     width: 130,
//     height: 130,
//     borderRadius: 65,
//     backgroundColor: "rgba(255,90,95,0.1)",
//     top: -60,
//     right: 40,
//   },
//   orb2: {
//     position: "absolute",
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: "rgba(168,85,247,0.1)",
//     bottom: -40,
//     left: 60,
//   },
//   searchIconWrap: {
//     borderRadius: 11,
//     overflow: "hidden",
//     flexShrink: 0,
//   },
//   searchIconGrad: {
//     width: 32,
//     height: 32,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   input: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#FFFFFF",
//     paddingVertical: 0,
//     letterSpacing: 0.1,
//   },
//   clearBtn: {
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: "rgba(255,255,255,0.1)",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.15)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   divider: {
//     width: 1,
//     height: 22,
//     backgroundColor: "rgba(255,255,255,0.1)",
//   },
//   filterBtn: {
//     borderRadius: 11,
//     overflow: "hidden",
//     flexShrink: 0,
//   },
//   filterGrad: {
//     width: 36,
//     height: 36,
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 11,
//     borderWidth: 1,
//     borderColor: "rgba(255,159,67,0.25)",
//   },
// });
