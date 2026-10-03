import Constants from "expo-constants";

/** Native builds use the configured application origin; Metro host inference is development-only. */
export const getBaseUrl = () => {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const configured = process.env.EXPO_PUBLIC_APP_URL;
  if (configured) {
    const url = new URL(configured);
    if (
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && isDevelopment)
    ) {
      throw new Error("EXPO_PUBLIC_APP_URL must use HTTPS in production");
    }
    return url.origin;
  }
  if (isDevelopment) {
    const host = Constants.expoConfig?.hostUri?.split(":")[0];
    if (host) {
      return `http://${host}:3000`;
    }
  }
  return "https://app.userbubble.com";
};
