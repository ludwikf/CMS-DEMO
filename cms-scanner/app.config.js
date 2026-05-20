/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "cms-scanner",
    slug: "cms-scanner",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission:
            "Aplikacja potrzebuje dostępu do aparatu, aby skanować kody QR dostaw magazynowych.",
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "Aplikacja potrzebuje dostępu do aparatu, aby skanować kody QR dostaw magazynowych.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["CAMERA"],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL,
    },
  },
};
