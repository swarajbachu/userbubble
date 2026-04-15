import type { UserbubbleWebConfig } from "../core/types";
import { createLogger } from "../utils/logger";
import { WidgetApiClient } from "./api-client";
import { bubbleIcon } from "./icons";
import { getWidgetStyles } from "./styles";
import { WidgetUI } from "./ui";

export class WidgetManager {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private panel: HTMLDivElement | null = null;
  private panelContent: HTMLDivElement | null = null;
  private bubble: HTMLButtonElement | null = null;
  private widgetUI: WidgetUI | null = null;
  private apiClient: WidgetApiClient | null = null;
  private currentAuthToken: string | null = null;
  private readonly config: UserbubbleWebConfig;
  private readonly log: ReturnType<typeof createLogger>;
  private readonly onOpen: () => void;
  private readonly onClose: () => void;
  private themeQuery: MediaQueryList | null = null;
  private themeHandler: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(
    config: UserbubbleWebConfig,
    callbacks: { onOpen: () => void; onClose: () => void }
  ) {
    this.config = config;
    this.log = createLogger(config.debug ?? false);
    this.onOpen = callbacks.onOpen;
    this.onClose = callbacks.onClose;
  }

  mount(): void {
    if (this.host) {
      return;
    }

    this.host = document.createElement("div");
    this.host.id = "userbubble-widget";
    this.shadow = this.host.attachShadow({ mode: "closed" });

    // Styles
    const style = document.createElement("style");
    style.textContent = getWidgetStyles(this.config);
    this.shadow.appendChild(style);

    // Root wrapper (for theme class)
    const root = document.createElement("div");
    root.className = `ub-root ${this.getThemeClass()}`;
    this.shadow.appendChild(root);

    // Bubble button
    this.bubble = document.createElement("button");
    this.bubble.className = "ub-bubble";
    this.bubble.setAttribute("aria-label", "Open feedback");
    this.bubble.innerHTML = bubbleIcon;
    if (this.config.hideWidget) {
      this.bubble.classList.add("ub-hidden");
    }
    this.bubble.addEventListener("click", () => this.onOpen());
    root.appendChild(this.bubble);

    // Panel — content rendered by WidgetUI
    this.panel = document.createElement("div");
    this.panel.className = "ub-panel";

    this.panelContent = document.createElement("div");
    this.panelContent.style.display = "flex";
    this.panelContent.style.flexDirection = "column";
    this.panelContent.style.height = "100%";
    this.panel.appendChild(this.panelContent);

    root.appendChild(this.panel);
    document.body.appendChild(this.host);

    // Listen for theme changes
    this.setupThemeListener();

    this.log.debug("Widget mounted");
  }

  show(opts: {
    baseUrl: string;
    apiKey: string;
    authToken: string | null;
    path?: string;
    organizationSlug?: string;
  }): void {
    const { baseUrl, apiKey, authToken, path, organizationSlug } = opts;
    if (!(this.panel && this.panelContent)) {
      return;
    }

    // Store token mutably so the API client always reads the latest
    this.currentAuthToken = authToken;

    // Create API client if not yet created
    if (!this.apiClient) {
      this.apiClient = new WidgetApiClient(
        baseUrl,
        apiKey,
        () => this.currentAuthToken
      );
    }

    // Create WidgetUI if not yet created
    if (!this.widgetUI) {
      const roadmapUrl = organizationSlug
        ? `https://${organizationSlug}.userbubble.com`
        : null;
      this.widgetUI = new WidgetUI(
        this.apiClient,
        () => this.onClose(),
        roadmapUrl,
        () => this.currentAuthToken
      );
      this.widgetUI.mount(this.panelContent);
    }

    // Map path to tab
    if (path) {
      const tabMap: Record<string, "feedback" | "roadmap" | "changelog"> = {
        "/feedback": "feedback",
        "/roadmap": "roadmap",
        "/changelog": "changelog",
      };
      const tab = tabMap[path];
      if (tab) {
        this.widgetUI.setTab(tab);
      }
    }

    this.widgetUI.activate();
    this.panel.classList.add("ub-open");

    this.log.debug("Panel opened");
  }

  hide(): void {
    if (!this.panel) {
      return;
    }
    this.panel.classList.remove("ub-open");
    this.log.debug("Panel closed");
  }

  destroy(): void {
    if (this.themeQuery && this.themeHandler) {
      this.themeQuery.removeEventListener("change", this.themeHandler);
    }

    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
      this.panel = null;
      this.panelContent = null;
      this.bubble = null;
    }

    this.widgetUI = null;
    this.apiClient = null;

    this.log.debug("Widget destroyed");
  }

  private getThemeClass(): string {
    const theme = this.config.theme ?? "auto";
    if (theme === "auto") {
      return "ub-auto";
    }
    return theme === "dark" ? "ub-dark" : "";
  }

  private setupThemeListener(): void {
    if (this.config.theme !== "auto") {
      return;
    }

    this.themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.themeHandler = () => {
      // Theme updates are handled by CSS media queries on the shadow DOM
      // No need for postMessage — the ub-auto class handles it
    };
    this.themeQuery.addEventListener("change", this.themeHandler);
  }
}
