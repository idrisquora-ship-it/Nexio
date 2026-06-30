import { ExpoConfig, ConfigContext } from "expo/config";

const APP_NAME = "Nexio";
const APP_SLUG = "nexio";
const BUNDLE_ID = "com.nexio.app";
const BRAND_ICON = "./assets/nexio-icon.png";
const BRAND_BACKGROUND = "#080810";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  version: "0.1.0",
  orientation: "portrait",
  scheme: "nexio",
  userInterfaceStyle: "dark",
  icon: BRAND_ICON,
  backgroundColor: BRAND_BACKGROUND,
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      foregroundImage: BRAND_ICON,
      backgroundImage: BRAND_ICON,
      monochromeImage: BRAND_ICON,
      backgroundColor: BRAND_BACKGROUND,
    },
    googleServicesFile: "./google-services.json",
  },
  web: {
    favicon: BRAND_ICON,
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: BRAND_ICON,
        imageWidth: 240,
        resizeMode: "contain",
        backgroundColor: BRAND_BACKGROUND,
      },
    ],
    "expo-image",
    "expo-web-browser",
    "@livekit/react-native-expo-plugin",
    [
      "expo-notifications",
      {
        icon: BRAND_ICON,
        color: "#3366FF",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: "Nexio needs photo access to send images in chats.",
        cameraPermission: "Nexio needs camera access to take photos for chats.",
      },
    ],
    [
    "expo-audio",
    {
      microphonePermission: "Nexio needs microphone access for voice notes and calls.",
    },
  ],
  [
    "expo-location",
    {
      locationWhenInUsePermission: "Nexio needs location access to share where you are in chats.",
    },
  ],
],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "42ab374c-9724-491b-9195-d5e543a1ca24",
    },
  },
});
