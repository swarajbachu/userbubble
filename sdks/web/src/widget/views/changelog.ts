import type { WidgetApiClient } from "../api-client";
import { chevronLeftIcon } from "../icons";

type ChangelogEntry = {
  id: string;
  title: string;
  description: string;
  version: string | null;
  coverImageUrl: string | null;
  tags: string[] | null;
  publishedAt: string | null;
  author: { name: string; image: string | null } | null;
};

export class ChangelogView {
  private readonly api: WidgetApiClient;
  private entries: ChangelogEntry[] = [];
  private loading = true;
  private error = "";
  private detailEntry: ChangelogEntry | null = null;

  constructor(api: WidgetApiClient) {
    this.api = api;
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = "";

    const result = await this.api.getChangelog(20, 0);
    if ("error" in result) {
      this.error = result.error.message;
      this.loading = false;
      return;
    }

    this.entries = result.data;
    this.loading = false;
  }

  render(): string {
    if (this.detailEntry) {
      return this.renderDetail(this.detailEntry);
    }

    if (this.loading) {
      return this.renderSkeleton();
    }

    if (this.error) {
      return `<div class="ub-error">${escapeHtml(this.error)}</div>`;
    }

    if (this.entries.length === 0) {
      return `<div class="ub-empty">No updates published yet.</div>`;
    }

    return `
      <div class="ub-release-list">
        ${this.entries.map((entry) => this.renderEntryCard(entry)).join("")}
      </div>
    `;
  }

  bind(container: HTMLElement): void {
    if (this.detailEntry) {
      const backBtn = container.querySelector('[data-action="back"]');
      backBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        const previousId = this.detailEntry?.id;
        this.detailEntry = null;
        const content =
          (container.closest(".ub-content") as HTMLElement | null) ?? container;
        content.innerHTML = this.render();
        this.bind(content);
        const previous = Array.from(
          content.querySelectorAll<HTMLButtonElement>("[data-entry]")
        ).find((card) => card.dataset.entry === previousId);
        previous?.focus();
      });
      return;
    }

    const cards = container.querySelectorAll<HTMLElement>("[data-entry]");
    for (const card of cards) {
      card.addEventListener("click", () => {
        const entryId = card.dataset.entry;
        if (!entryId) {
          return;
        }
        this.showDetail(entryId, container);
      });
    }
  }

  private showDetail(entryId: string, container: HTMLElement): void {
    // The list contract includes the complete sanitized release body.
    const entry = this.entries.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    this.detailEntry = entry;
    const content =
      (container.closest(".ub-content") as HTMLElement | null) ?? container;
    content.innerHTML = this.render();
    this.bind(content);
    content.querySelector<HTMLButtonElement>('[data-action="back"]')?.focus();
  }

  private renderEntryCard(entry: ChangelogEntry): string {
    const date = entry.publishedAt ? formatDate(entry.publishedAt) : "";

    const tags = entry.tags?.length
      ? entry.tags
          .map((t) => `<span class="ub-badge">${escapeHtml(t)}</span>`)
          .join("")
      : "";

    const truncated =
      entry.description.length > 120
        ? `${stripHtml(entry.description).slice(0, 120)}...`
        : stripHtml(entry.description);

    return `
      <button type="button" class="ub-entry-card" data-entry="${escapeAttr(entry.id)}">
        ${entry.coverImageUrl ? `<img class="ub-entry-cover" src="${escapeAttr(entry.coverImageUrl)}" alt="" loading="lazy" />` : ""}
        <div class="ub-entry-date">${date}</div>
        <div class="ub-entry-title">${escapeHtml(entry.title)}</div>
        ${tags ? `<div class="ub-entry-tags">${tags}</div>` : ""}
        <div class="ub-entry-desc">${escapeHtml(truncated)}</div>
      </button>
    `;
  }

  private renderDetail(entry: ChangelogEntry): string {
    const date = entry.publishedAt ? formatDate(entry.publishedAt) : "";

    const tags = entry.tags?.length
      ? entry.tags
          .map((t) => `<span class="ub-badge">${escapeHtml(t)}</span>`)
          .join("")
      : "";

    const coverImage = entry.coverImageUrl
      ? `<img class="ub-entry-cover" src="${escapeAttr(entry.coverImageUrl)}" alt="" />`
      : "";

    return `
      <div class="ub-entry-detail">
        <button type="button" class="ub-back-btn" data-action="back">${chevronLeftIcon} All releases</button>
        ${coverImage}
        <div class="ub-entry-date">${date}</div>
        <div class="ub-entry-detail-title">${escapeHtml(entry.title)}</div>
        ${tags ? `<div class="ub-entry-tags">${tags}</div>` : ""}
        <div class="ub-entry-body">${entry.description}</div>
      </div>
    `;
  }

  private renderSkeleton(): string {
    const rows = Array.from(
      { length: 3 },
      () => `
      <div class="ub-skeleton-row">
        <div class="ub-skeleton" style="height:12px;width:30%"></div>
        <div class="ub-skeleton" style="height:16px;width:80%;margin-top:8px"></div>
        <div class="ub-skeleton" style="height:12px;width:60%;margin-top:6px"></div>
      </div>
    `
    ).join("");
    return `<div class="ub-skeleton-list">${rows}</div>`;
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
