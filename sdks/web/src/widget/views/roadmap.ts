import type { WidgetApiClient } from "../api-client";
import { arrowUpIcon } from "../icons";

type FeedbackPost = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  voteCount: number;
  hasUserVoted: boolean;
};

const STATUS_GROUPS = [
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
] as const;

export class RoadmapView {
  private readonly api: WidgetApiClient;
  private readonly roadmapUrl: string | null;
  private readonly getAuthToken: () => string | null;
  private posts: FeedbackPost[] = [];
  private loading = true;
  private error = "";

  constructor(
    api: WidgetApiClient,
    roadmapUrl: string | null,
    getAuthToken: () => string | null
  ) {
    this.api = api;
    this.roadmapUrl = roadmapUrl;
    this.getAuthToken = getAuthToken;
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = "";

    const result = await this.api.getFeedback("votes");
    if ("error" in result) {
      this.error = result.error.message;
      this.loading = false;
      return;
    }

    this.posts = result.data;
    this.loading = false;
  }

  render(): string {
    if (this.loading) {
      return this.renderSkeleton();
    }

    if (this.error) {
      return `<div class="ub-error">${this.error}</div>`;
    }

    if (this.posts.length === 0) {
      return `<div class="ub-empty">No feedback posts yet.</div>`;
    }

    const grouped = new Map<string, FeedbackPost[]>();
    for (const group of STATUS_GROUPS) {
      grouped.set(group.key, []);
    }

    for (const post of this.posts) {
      const existing = grouped.get(post.status);
      if (existing) {
        existing.push(post);
      }
    }

    let html = "";
    for (const group of STATUS_GROUPS) {
      const posts = grouped.get(group.key) ?? [];
      if (posts.length === 0) {
        continue;
      }

      html += `
        <div class="ub-timeline-group">
          <div class="ub-timeline-label">
            <span class="ub-timeline-dot ub-dot-${group.key}"></span>
            ${group.label}
          </div>
          ${posts.map((post) => this.renderPostCard(post)).join("")}
        </div>
      `;
    }

    if (!html) {
      return `<div class="ub-empty">No planned items yet.</div>`;
    }

    return `<div class="ub-timeline">${html}</div>`;
  }

  bind(container: HTMLElement): void {
    const voteButtons =
      container.querySelectorAll<HTMLButtonElement>("[data-vote]");
    for (const btn of voteButtons) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const postId = btn.dataset.vote;
        if (!postId) {
          return;
        }
        void this.handleVote(postId, container);
      });
    }

    if (this.roadmapUrl) {
      const cards = container.querySelectorAll<HTMLElement>("[data-post-id]");
      for (const card of cards) {
        card.addEventListener("click", () => {
          const postId = card.dataset.postId;
          const token = this.getAuthToken();
          // {orgSlug}.userbubble.com/feedback/{postId}?auth_token={authToken}
          let feedbackUrl = `${this.roadmapUrl}/feedback/${postId}`;
          if (token) {
            feedbackUrl += `?auth_token=${encodeURIComponent(token)}`;
          }
          window.open(feedbackUrl, "_blank", "noopener");
        });
      }
    }
  }

  private async handleVote(
    postId: string,
    container: HTMLElement
  ): Promise<void> {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) {
      return;
    }

    const newValue = post.hasUserVoted ? 0 : 1;
    const result = await this.api.voteFeedback(postId, newValue);
    if ("error" in result) {
      return;
    }

    post.hasUserVoted = !post.hasUserVoted;
    post.voteCount += post.hasUserVoted ? 1 : -1;

    const content =
      (container.closest(".ub-content") as HTMLElement | null) ?? container;
    content.innerHTML = this.render();
    this.bind(content);
  }

  private renderPostCard(post: FeedbackPost): string {
    return `
      <div class="ub-post-card" data-post-id="${post.id}">
        <div class="ub-post-content">
          <div class="ub-post-title">${escapeHtml(post.title)}</div>
          <div class="ub-post-meta">${escapeHtml(post.category.replace("_", " "))}</div>
        </div>
        <button class="ub-vote-btn${post.hasUserVoted ? " ub-voted" : ""}" data-vote="${post.id}">
          ${arrowUpIcon}
          <span>${post.voteCount}</span>
        </button>
      </div>
    `;
  }

  private renderSkeleton(): string {
    const rows = Array.from(
      { length: 4 },
      () => `
      <div class="ub-skeleton-row">
        <div class="ub-skeleton" style="height:16px;width:70%"></div>
        <div class="ub-skeleton" style="height:12px;width:40%;margin-top:6px"></div>
      </div>
    `
    ).join("");
    return `<div class="ub-skeleton-list">${rows}</div>`;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
