// import React from "react";
// import { TouchableOpacity, Text, StyleSheet } from "react-native";

// interface PrimaryButtonProps {
//   title: string;
//   onPress: () => void;
//   outline?: boolean;
// }

// export default function PrimaryButton({
//   title,
//   onPress,
//   outline,
// }: PrimaryButtonProps) {
//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       style={[styles.button, outline ? styles.outline : styles.filled]}
//     >
//       <Text
//         style={[styles.text, outline ? styles.outlineText : styles.filledText]}
//       >
//         {title}
//       </Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   button: {
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   filled: {
//     backgroundColor: "#007bff",
//   },
//   outline: {
//     borderColor: "#007bff",
//     borderWidth: 1,
//     backgroundColor: "transparent",
//   },
//   text: {
//     fontSize: 16,
//     fontWeight: "600",
//     textAlign: "center",
//   },
//   filledText: {
//     color: "#fff",
//   },
//   outlineText: {
//     color: "#007bff",
//   },
// });
