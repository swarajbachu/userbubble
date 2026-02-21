import { UserbubbleSDK } from "./core/sdk";
import type { UserbubbleUser, UserbubbleWebConfig } from "./core/types";

const sdk = UserbubbleSDK.getInstance();

export const Userbubble = {
  init(config: UserbubbleWebConfig) {
    sdk.init(config);
  },

  identify(user: UserbubbleUser) {
    return sdk.identify(user);
  },

  open(path?: string) {
    sdk.open(path);
  },

  close() {
    sdk.close();
  },

  logout() {
    sdk.logout();
  },

  destroy() {
    sdk.destroy();
  },

  get isIdentified() {
    return sdk.getState().isIdentified;
  },

  get isOpen() {
    return sdk.getState().isOpen;
  },

  get user() {
    return sdk.getState().user;
  },
};

export type { UserbubbleUser, UserbubbleWebConfig } from "./core/types";
