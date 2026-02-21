import { createLogger } from "../utils/logger";

import { WidgetManager } from "../widget/widget";
import { identify } from "./auth";
import * as storage from "./storage";
import type {
  StateListener,
  UserbubbleState,
  UserbubbleUser,
  UserbubbleWebConfig,
} from "./types";

const DEFAULT_CONFIG: Partial<UserbubbleWebConfig> = {
  baseUrl: "https://app.userbubble.com",
  position: "bottom-right",
  theme: "auto",
  debug: false,
  useDirectUrls: false,
  hideWidget: false,
};

export class UserbubbleSDK {
  private static instance: UserbubbleSDK | null = null;

  private config: UserbubbleWebConfig = { apiKey: "" };
  private state: UserbubbleState = {
    isInitialized: false,
    isIdentified: false,
    isOpen: false,
    user: null,
    organizationSlug: null,
    externalId: null,
    authToken: null,
  };
  private readonly listeners = new Set<StateListener>();
  private widget: WidgetManager | null = null;
  private log = createLogger(false);

  static getInstance(): UserbubbleSDK {
    if (!UserbubbleSDK.instance) {
      UserbubbleSDK.instance = new UserbubbleSDK();
    }
    return UserbubbleSDK.instance;
  }

  init(config: UserbubbleWebConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.log = createLogger(this.config.debug ?? false);

    this.log.debug("Initializing SDK", {
      baseUrl: this.config.baseUrl,
      position: this.config.position,
      theme: this.config.theme,
    });

    // Restore from localStorage
    const savedUser = storage.getUser();
    const savedSlug = storage.getOrganizationSlug();
    const savedExternalId = storage.getExternalId();
    const savedAuthToken = storage.getAuthToken();

    if (savedUser && savedSlug && savedExternalId) {
      this.log.debug("Restored user from storage:", savedUser.email);
      this.setState({
        user: savedUser,
        organizationSlug: savedSlug,
        externalId: savedExternalId,
        authToken: savedAuthToken,
        isIdentified: true,
      });
    }

    // Create and mount widget
    if (typeof document !== "undefined") {
      this.widget = new WidgetManager(this.config, {
        onOpen: () => this.open(),
        onClose: () => this.close(),
      });
      this.widget.mount();
    }

    this.setState({ isInitialized: true });
    this.log.debug("SDK initialized");
  }

  async identify(user: UserbubbleUser): Promise<void> {
    this.log.debug("Identifying user:", user.email);

    const response = await identify(user, this.config);

    // Save to localStorage
    storage.setUser(user);
    storage.setOrganizationSlug(response.organizationSlug);
    storage.setExternalId(user.id);
    storage.setAuthToken(response.token);

    this.setState({
      user,
      organizationSlug: response.organizationSlug,
      externalId: user.id,
      authToken: response.token,
      isIdentified: true,
    });

    this.log.debug("User identified:", response.organizationSlug);
  }

  open(path = "/feedback"): void {
    if (
      !(
        this.state.isIdentified &&
        this.state.organizationSlug &&
        this.state.authToken
      )
    ) {
      this.log.warn("Cannot open: user not identified. Call identify() first.");
      return;
    }

    const baseUrl = this.config.baseUrl ?? "https://app.userbubble.com";
    const authParams = new URLSearchParams({
      auth_token: this.state.authToken,
      embed: "true",
    }).toString();

    this.widget?.show(baseUrl, this.state.organizationSlug, authParams, path);
    this.setState({ isOpen: true });
  }

  close(): void {
    this.widget?.hide();
    this.setState({ isOpen: false });
  }

  logout(): void {
    storage.clear();
    this.setState({
      user: null,
      organizationSlug: null,
      externalId: null,
      authToken: null,
      isIdentified: false,
      isOpen: false,
    });
    // Notify iframe to clear session
    this.widget?.postMessage({ type: "userbubble:logout" });
    this.widget?.hide();
    this.log.debug("User logged out");
  }

  destroy(): void {
    this.widget?.destroy();
    this.widget = null;
    this.setState({
      isInitialized: false,
      isIdentified: false,
      isOpen: false,
      user: null,
      organizationSlug: null,
      externalId: null,
      authToken: null,
    });
    this.listeners.clear();
    UserbubbleSDK.instance = null;
    this.log.debug("SDK destroyed");
  }

  // --- React integration (useSyncExternalStore) ---

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): UserbubbleState {
    return this.state;
  }

  // --- Private ---

  private setState(partial: Partial<UserbubbleState>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
