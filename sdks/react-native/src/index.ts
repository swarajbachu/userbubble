/**
 * Userbubble React Native SDK
 *
 * Seamless user identification for React Native and Expo apps
 */

// Re-export core utilities for advanced usage
export {
  generateOrganizationUrl,
  generatePortalUrl,
  identify,
} from "@userbubble/core";
export { UserbubbleProvider } from "./context/userbubble-provider";
export { useUserbubble } from "./hooks/use-userbubble";
export type {
  StorageAdapter,
  UserbubbleContextValue,
  UserbubbleRNConfig,
  UserbubbleUser,
} from "./types";
