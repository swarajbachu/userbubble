import type { WidgetApiClient } from "../api-client";
import { checkCircleIcon } from "../icons";

type FeedbackState = "form" | "submitting" | "success";

const CATEGORIES = [
  { value: "feature_request", label: "Feature Request" },
  { value: "bug", label: "Bug Report" },
  { value: "improvement", label: "Improvement" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
] as const;

export class FeedbackView {
  private readonly api: WidgetApiClient;
  private state: FeedbackState = "form";
  private title = "";
  private description = "";
  private category = "feature_request";
  private error = "";

  constructor(api: WidgetApiClient) {
    this.api = api;
  }

  render(): string {
    if (this.state === "success") {
      return this.renderSuccess();
    }
    return this.renderForm();
  }

  bind(container: HTMLElement): void {
    if (this.state === "success") {
      const submitAnother = container.querySelector(
        '[data-action="submit-another"]'
      );
      submitAnother?.addEventListener("click", (e) => {
        e.preventDefault();
        this.state = "form";
        this.title = "";
        this.description = "";
        this.category = "feature_request";
        this.error = "";
        this.rerender(container);
      });
      return;
    }

    const titleInput = container.querySelector<HTMLInputElement>(
      '[data-field="title"]'
    );
    const descInput = container.querySelector<HTMLTextAreaElement>(
      '[data-field="description"]'
    );
    const categorySelect = container.querySelector<HTMLSelectElement>(
      '[data-field="category"]'
    );
    const form = container.querySelector<HTMLFormElement>("[data-form]");

    titleInput?.addEventListener("input", () => {
      this.title = titleInput.value;
    });
    descInput?.addEventListener("input", () => {
      this.description = descInput.value;
    });
    categorySelect?.addEventListener("change", () => {
      this.category = categorySelect.value;
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      void this.handleSubmit(container);
    });
  }

  private async handleSubmit(container: HTMLElement): Promise<void> {
    if (!(this.title.trim() && this.description.trim())) {
      this.error = "Please fill in all fields";
      this.rerender(container);
      return;
    }

    this.state = "submitting";
    this.error = "";
    this.rerender(container);

    const result = await this.api.submitFeedback({
      title: this.title.trim(),
      description: this.description.trim(),
      category: this.category,
    });

    if ("error" in result) {
      this.state = "form";
      this.error = result.error.message;
      this.rerender(container);
      return;
    }

    this.state = "success";
    this.rerender(container);
  }

  private rerender(container: HTMLElement): void {
    const content =
      (container.closest(".ub-content") as HTMLElement | null) ?? container;
    content.innerHTML = this.render();
    this.bind(content);
  }

  private renderForm(): string {
    const disabled = this.state === "submitting";
    const categoryOptions = CATEGORIES.map(
      (cat) =>
        `<option value="${cat.value}"${cat.value === this.category ? " selected" : ""}>${cat.label}</option>`
    ).join("");

    return `
      <form data-form class="ub-feedback-form">
        ${this.error ? `<div class="ub-error">${this.error}</div>` : ""}
        <input
          type="text"
          class="ub-input"
          data-field="title"
          placeholder="Title"
          value="${escapeAttr(this.title)}"
          ${disabled ? "disabled" : ""}
        />
        <textarea
          class="ub-textarea"
          data-field="description"
          placeholder="Describe your feedback in detail..."
          rows="6"
          ${disabled ? "disabled" : ""}
        >${escapeHtml(this.description)}</textarea>
        <div class="ub-form-actions">
          <select class="ub-select" data-field="category" ${disabled ? "disabled" : ""}>
            ${categoryOptions}
          </select>
          <button type="submit" class="ub-btn-submit" ${disabled ? "disabled" : ""}>
            ${disabled ? "Sending..." : "Submit"}
          </button>
        </div>
      </form>
    `;
  }

  private renderSuccess(): string {
    return `
      <div class="ub-success">
        <div class="ub-success-icon">${checkCircleIcon}</div>
        <div class="ub-success-title">Thank you!</div>
        <div class="ub-success-text">Your feedback has been submitted successfully.</div>
        <a href="#" class="ub-success-link" data-action="submit-another">Submit another</a>
      </div>
    `;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
