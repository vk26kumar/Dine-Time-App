import "dotenv/config";

export default {
  expo: {
    name: "DineTime",
    slug: "dinetime",
    scheme: "dinetime",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow DineTime to use your location to show nearby restaurants.",
          locationAlwaysPermission:
            "Allow DineTime to use your location to show nearby restaurants.",
          locationWhenInUsePermission:
            "Allow DineTime to use your location to show nearby restaurants.",
        },
      ],
    ],

    android: {
      package: "com.project.dinetime",
      versionCode: 10,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      googleServicesFile: "./google-services.json",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"]
    },

    ios: {
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "DineTime needs access to your location to show nearby restaurants.",
        NSLocationAlwaysUsageDescription:
          "DineTime needs access to your location to show nearby restaurants.",
      },
    },

    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },

    extra: {
      eas: {
        projectId: "e1f5487d-663d-44fd-8dc2-3037bc1e4f1b"
      },
    },
  },
};
