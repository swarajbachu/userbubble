import type { WidgetApiClient } from "./api-client";
import { changelogIcon, closeIcon, feedbackIcon, roadmapIcon } from "./icons";
import { ChangelogView } from "./views/changelog";
import { FeedbackView } from "./views/feedback";
import { RoadmapView } from "./views/roadmap";

type TabId = "feedback" | "roadmap" | "changelog";

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "feedback", label: "Feedback", icon: feedbackIcon },
  { id: "roadmap", label: "Roadmap", icon: roadmapIcon },
  { id: "changelog", label: "Updates", icon: changelogIcon },
];

const TAB_META: Record<TabId, { title: string; subtitle: string }> = {
  feedback: { title: "Submit Feedback", subtitle: "Share your ideas" },
  roadmap: { title: "Roadmap", subtitle: "See what we're working on" },
  changelog: { title: "What's New", subtitle: "Latest updates" },
};

export class WidgetUI {
  private activeTab: TabId = "feedback";
  private container: HTMLElement | null = null;
  private readonly feedbackView: FeedbackView;
  private readonly roadmapView: RoadmapView;
  private readonly changelogView: ChangelogView;
  private readonly onClose: () => void;
  private readonly lastFetchTime: Partial<Record<TabId, number>> = {};

  constructor(
    api: WidgetApiClient,
    onClose: () => void,
    roadmapUrl: string | null,
    getAuthToken: () => string | null
  ) {
    this.onClose = onClose;
    this.feedbackView = new FeedbackView(api);
    this.roadmapView = new RoadmapView(api, roadmapUrl, getAuthToken);
    this.changelogView = new ChangelogView(api);
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  setTab(tab: TabId): void {
    this.activeTab = tab;
    this.render();
    void this.loadTabData();
  }

  activate(): void {
    this.render();
    void this.loadTabData();
  }

  private render(): void {
    if (!this.container) {
      return;
    }

    const meta = TAB_META[this.activeTab];

    this.container.innerHTML = `
      <div class="ub-header">
        <div class="ub-header-text">
          <div class="ub-header-title">${meta.title}</div>
          <div class="ub-header-subtitle">${meta.subtitle}</div>
        </div>
        <button class="ub-close-btn" data-action="close" aria-label="Close">${closeIcon}</button>
      </div>
      <div class="ub-content">
        ${this.renderActiveView()}
      </div>
      <div class="ub-tab-bar">
        ${TABS.map(
          (tab) =>
            `<button class="ub-tab${tab.id === this.activeTab ? " ub-tab-active" : ""}" data-tab="${tab.id}">
              ${tab.icon}
              <span>${tab.label}</span>
            </button>`
        ).join("")}
      </div>
      <div class="ub-footer">
        Powered by <a href="https://userbubble.com" target="_blank" rel="noopener">Userbubble</a>
      </div>
    `;

    this.bindEvents();
  }

  private renderActiveView(): string {
    switch (this.activeTab) {
      case "feedback":
        return this.feedbackView.render();
      case "roadmap":
        return this.roadmapView.render();
      case "changelog":
        return this.changelogView.render();
      default:
        return "";
    }
  }

  private bindEvents(): void {
    if (!this.container) {
      return;
    }

    // Close button
    const closeBtn = this.container.querySelector('[data-action="close"]');
    closeBtn?.addEventListener("click", () => this.onClose());

    // Tab buttons
    const tabs =
      this.container.querySelectorAll<HTMLButtonElement>("[data-tab]");
    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        const tabId = tab.dataset.tab as TabId;
        if (tabId !== this.activeTab) {
          this.setTab(tabId);
        }
      });
    }

    // Bind active view events
    const content = this.container.querySelector<HTMLElement>(".ub-content");
    if (content) {
      switch (this.activeTab) {
        case "feedback":
          this.feedbackView.bind(content);
          break;
        case "roadmap":
          this.roadmapView.bind(content);
          break;
        case "changelog":
          this.changelogView.bind(content);
          break;
        default:
          break;
      }
    }
  }

  private async loadTabData(): Promise<void> {
    const now = Date.now();
    const lastFetch = this.lastFetchTime[this.activeTab] ?? 0;
    const isStale = now - lastFetch > 30_000;

    if (this.activeTab === "roadmap" && isStale) {
      await this.roadmapView.load();
      this.lastFetchTime.roadmap = Date.now();
      this.render();
    } else if (this.activeTab === "changelog" && isStale) {
      await this.changelogView.load();
      this.lastFetchTime.changelog = Date.now();
      this.render();
    }
  }
}
