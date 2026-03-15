import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { LocationProvider } from "../contexts/LocationContext";
import { PaperProvider } from "react-native-paper";
import { ActivityIndicator, View } from "react-native";
import { theme } from "../constants/theme";

function RootLayoutNav() {
  const { user, userData, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Don't do anything until Firebase Auth + Firestore both resolved
    if (loading || (user && !userData)) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";
    const inConsumerGroup = segments[0] === "(consumer)";
    const inOwnerGroup = segments[0] === "(owner)";
    const inAdminGroup = segments[0] === "(admin)";

    // 1. Not logged in → landing
    if (!user) {
      if (!inAuthGroup) {
        router.replace("/(auth)/landing");
      }
      setAppReady(true);
      return;
    }

    // 2. Onboarding not done → onboarding
    if (!userData?.fullName?.trim() || !userData?.phoneNumber?.trim()) {
      if (!inOnboardingGroup) {
        router.replace("/(onboarding)/tell-us-about-you");
      }
      setAppReady(true);
      return;
    }

    // 3. Admin → admin dashboard
    if (userData.isAdmin) {
      if (!inAdminGroup) {
        router.replace("/(admin)/dashboard");
      }
      setAppReady(true);
      return;
    }

    // 4. Owner/consumer → their sections
    if (userData.rolePreference === "owner") {
      if (!inOwnerGroup) {
        router.replace("/(owner)/my-restaurants");
      }
    } else {
      if (!inConsumerGroup) {
        router.replace("/(consumer)/explore");
      }
    }

    setAppReady(true);
  }, [user, userData, loading, segments]);

  // Block Stack from mounting until auth state is fully resolved
  // This prevents landing page flash
  if (!appReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(consumer)" />
      <Stack.Screen name="(owner)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <PaperProvider theme={theme}>
          <RootLayoutNav />
        </PaperProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
