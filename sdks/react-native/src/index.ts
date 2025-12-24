/**
 * Userbubble React Native SDK
 *
 * Seamless user identification for React Native and Expo apps
 */

export {
  identify as identifyUser,
  logout as logoutUser,
} from "./auth/authenticate";
export { UserbubbleProvider } from "./context/userbubble-provider";
export { useUserbubble } from "./hooks/use-userbubble";
export type {
  StorageAdapter,
  UserbubbleConfig,
  UserbubbleContextValue,
  UserbubbleUser,
} from "./types";
// Re-export utilities for advanced usage
export { generateUserbubbleUrl } from "./utils/url";
