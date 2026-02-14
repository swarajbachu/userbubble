import type { UserbubbleWebConfig } from "../core/types";
import { createLogger } from "../utils/logger";
import { bubbleIcon } from "./icons";
import { getWidgetStyles } from "./styles";

// Matches both old-style (/feedback) and embed-style (/embed/feedback) paths
const PATH_REGEX = /(?:\/embed)?\/(?:feedback|roadmap|changelog)/;

export class WidgetManager {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private panel: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private bubble: HTMLButtonElement | null = null;
  private activePath = "/feedback";
  private readonly config: UserbubbleWebConfig;
  private readonly log: ReturnType<typeof createLogger>;
  private readonly onOpen: () => void;
  private readonly onClose: () => void;
  private baseIframeUrl = "";
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

    // Panel — iframe fills the full panel, no header/nav
    this.panel = document.createElement("div");
    this.panel.className = "ub-panel";

    this.iframe = document.createElement("iframe");
    this.iframe.className = "ub-iframe";
    this.iframe.setAttribute("title", "Userbubble");
    this.iframe.setAttribute("loading", "lazy");
    this.panel.appendChild(this.iframe);

    root.appendChild(this.panel);
    document.body.appendChild(this.host);

    // Listen for theme changes
    this.setupThemeListener();

    // Listen for postMessage from iframe
    window.addEventListener("message", this.handleMessage);

    this.log.debug("Widget mounted");
  }

  show(url: string, path?: string): void {
    if (!(this.panel && this.iframe)) {
      return;
    }

    this.baseIframeUrl = url;
    if (path) {
      this.activePath = path;
    }

    const src = this.buildIframeSrc(this.activePath);
    this.iframe.src = src;
    this.panel.classList.add("ub-open");

    this.log.debug("Panel opened:", src);
  }

  hide(): void {
    if (!this.panel) {
      return;
    }
    this.panel.classList.remove("ub-open");
    this.log.debug("Panel closed");
  }

  destroy(): void {
    window.removeEventListener("message", this.handleMessage);

    if (this.themeQuery && this.themeHandler) {
      this.themeQuery.removeEventListener("change", this.themeHandler);
    }

    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
      this.panel = null;
      this.iframe = null;
      this.bubble = null;
    }

    this.log.debug("Widget destroyed");
  }

  private buildIframeSrc(path: string): string {
    // baseIframeUrl already has auth params: ?external_user=xxx&api_key=ub_xxx
    // We need to reconstruct with the correct path under /embed/
    const urlObj = new URL(this.baseIframeUrl);
    const params = urlObj.searchParams;

    // Strip any existing path (old-style or embed-style) to get the org base
    const origin = urlObj.origin;
    const basePath = urlObj.pathname.replace(PATH_REGEX, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const newUrl = new URL(`${origin}${basePath}/embed${normalizedPath}`);
    newUrl.searchParams.set("external_user", params.get("external_user") ?? "");
    newUrl.searchParams.set("api_key", params.get("api_key") ?? "");
    newUrl.searchParams.set("embed", "true");

    return newUrl.toString();
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
      // Send theme update to iframe
      if (this.iframe?.contentWindow) {
        const isDark = this.themeQuery?.matches ?? false;
        this.iframe.contentWindow.postMessage(
          { type: "userbubble:theme", dark: isDark },
          "*"
        );
      }
    };
    this.themeQuery.addEventListener("change", this.themeHandler);
  }

  private readonly handleMessage = (event: MessageEvent): void => {
    const data = event.data;
    if (!data || typeof data !== "object") {
      return;
    }

    if (data.type === "userbubble:ready") {
      this.log.debug("Iframe ready");
      // Send initial theme
      if (this.iframe?.contentWindow) {
        const isDark =
          this.config.theme === "dark" ||
          (this.config.theme === "auto" && (this.themeQuery?.matches ?? false));
        this.iframe.contentWindow.postMessage(
          { type: "userbubble:theme", dark: isDark },
          "*"
        );
      }
    }

    if (data.type === "userbubble:close") {
      this.log.debug("Close requested by embed");
      this.onClose();
    }
  };
}
