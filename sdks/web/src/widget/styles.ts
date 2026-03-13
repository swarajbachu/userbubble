import type { UserbubbleWebConfig } from "../core/types";

export function getWidgetStyles(config: UserbubbleWebConfig): string {
  const accent = config.accentColor ?? "#6366f1";
  const pos = config.position ?? "bottom-right";

  const isRight = pos === "bottom-right" || pos === "top-right";
  const isBottom = pos === "bottom-right" || pos === "bottom-left";

  const horizontalProp = isRight ? "right" : "left";
  const verticalProp = isBottom ? "bottom" : "top";
  const slideFrom = isRight ? "translateX(110%)" : "translateX(-110%)";
  const panelHorizontal = isRight ? "right: 24px" : "left: 24px";
  const panelVertical = isBottom ? "bottom: 84px" : "top: 84px";

  return `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    /* Light theme (default) — COSS UI color system */
    .ub-root {
      --ub-accent: ${accent};
      --ub-accent-hover: color-mix(in srgb, ${accent} 85%, black);
      --ub-accent-text: #fff;
      --ub-bg: #ffffff;
      --ub-bg-secondary: rgba(0,0,0,0.04);
      --ub-bg-tertiary: rgba(0,0,0,0.06);
      --ub-text: #262626;
      --ub-text-secondary: #525252;
      --ub-text-muted: color-mix(in srgb, #737373 90%, #000);
      --ub-border: rgba(0,0,0,0.08);
      --ub-border-light: rgba(0,0,0,0.06);
      --ub-input-border: rgba(0,0,0,0.10);
      --ub-ring: #a3a3a3;
      --ub-shadow: 0 16px 70px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.08);
      --ub-btn-shadow: 0 4px 16px rgba(0,0,0,0.16);
      --ub-success: #10b981;
      --ub-success-fg: #047857;
      --ub-destructive: #ef4444;
      --ub-destructive-fg: #b91c1c;
      --ub-info: #3b82f6;
      --ub-warning: #f59e0b;
      --ub-radius: 0.625rem;
    }

    /* Dark theme — COSS UI */
    .ub-root.ub-dark {
      --ub-bg: color-mix(in srgb, #0a0a0a 95%, #fff);
      --ub-bg-secondary: rgba(255,255,255,0.04);
      --ub-bg-tertiary: rgba(255,255,255,0.06);
      --ub-text: #f5f5f5;
      --ub-text-secondary: #d4d4d4;
      --ub-text-muted: color-mix(in srgb, #737373 90%, #fff);
      --ub-border: rgba(255,255,255,0.06);
      --ub-border-light: rgba(255,255,255,0.05);
      --ub-input-border: rgba(255,255,255,0.08);
      --ub-ring: #737373;
      --ub-shadow: 0 16px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
      --ub-btn-shadow: 0 4px 16px rgba(0,0,0,0.4);
      --ub-success: #10b981;
      --ub-success-fg: #34d399;
      --ub-destructive: color-mix(in srgb, #ef4444 90%, #fff);
      --ub-destructive-fg: #f87171;
      --ub-info: #3b82f6;
      --ub-warning: #f59e0b;
    }

    /* Auto theme via prefers-color-scheme */
    @media (prefers-color-scheme: dark) {
      .ub-root.ub-auto {
        --ub-bg: color-mix(in srgb, #0a0a0a 95%, #fff);
        --ub-bg-secondary: rgba(255,255,255,0.04);
        --ub-bg-tertiary: rgba(255,255,255,0.06);
        --ub-text: #f5f5f5;
        --ub-text-secondary: #d4d4d4;
        --ub-text-muted: color-mix(in srgb, #737373 90%, #fff);
        --ub-border: rgba(255,255,255,0.06);
        --ub-border-light: rgba(255,255,255,0.05);
        --ub-input-border: rgba(255,255,255,0.08);
        --ub-ring: #737373;
        --ub-shadow: 0 16px 70px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06);
        --ub-btn-shadow: 0 4px 16px rgba(0,0,0,0.4);
        --ub-success: #10b981;
        --ub-success-fg: #34d399;
        --ub-destructive: color-mix(in srgb, #ef4444 90%, #fff);
        --ub-destructive-fg: #f87171;
        --ub-info: #3b82f6;
        --ub-warning: #f59e0b;
      }
    }

    /* ── Bubble ── */
    .ub-bubble {
      position: fixed;
      ${verticalProp}: 24px;
      ${horizontalProp}: 24px;
      z-index: 2147483647;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      background: var(--ub-accent);
      color: var(--ub-accent-text);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--ub-btn-shadow);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .ub-bubble:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 24px rgba(0,0,0,0.24);
    }
    .ub-bubble:active {
      transform: scale(0.95);
    }
    .ub-bubble.ub-hidden {
      display: none;
    }

    /* ── Panel ── */
    .ub-panel {
      position: fixed;
      ${panelVertical};
      ${panelHorizontal};
      z-index: 2147483647;
      width: 400px;
      max-width: calc(100vw - 48px);
      height: min(640px, calc(100vh - 120px));
      background: var(--ub-bg);
      border-radius: 16px;
      box-shadow: var(--ub-shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: ${slideFrom};
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }
    .ub-panel.ub-open {
      transform: translateX(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Header ── */
    .ub-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 20px 14px;
      flex-shrink: 0;
    }
    .ub-header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--ub-text);
      letter-spacing: -0.01em;
    }
    .ub-header-subtitle {
      font-size: 13px;
      color: var(--ub-text-muted);
      margin-top: 1px;
    }
    .ub-close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ub-text-muted);
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s, background 0.15s;
    }
    .ub-close-btn:hover {
      color: var(--ub-text);
      background: var(--ub-bg-secondary);
    }

    /* ── Content (scrollable) ── */
    .ub-content {
      flex: 1;
      overflow-y: auto;
      padding: 4px 20px 16px;
    }

    /* ── Tab bar ── */
    .ub-tab-bar {
      display: flex;
      border-top: 1px solid var(--ub-border-light);
      flex-shrink: 0;
      padding: 0 8px;
    }
    .ub-tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 10px 0 8px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--ub-text-muted);
      font-size: 10px;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.02em;
      transition: color 0.15s;
    }
    .ub-tab:hover {
      color: var(--ub-text-secondary);
    }
    .ub-tab-active {
      color: var(--ub-accent);
    }

    /* ── Footer ── */
    .ub-footer {
      padding: 8px 20px;
      text-align: center;
      font-size: 11px;
      color: var(--ub-text-muted);
      border-top: 1px solid var(--ub-border-light);
      flex-shrink: 0;
    }
    .ub-footer a {
      color: var(--ub-text-secondary);
      text-decoration: none;
      font-weight: 500;
    }
    .ub-footer a:hover {
      color: var(--ub-accent);
    }

    /* ── Feedback form ── */
    .ub-feedback-form {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .ub-input, .ub-textarea {
      width: 100%;
      padding: 10px 0;
      border: none;
      border-bottom: 1px solid var(--ub-input-border);
      border-radius: 0;
      background: transparent;
      color: var(--ub-text);
      font-size: 15px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .ub-input::placeholder, .ub-textarea::placeholder {
      color: var(--ub-text-muted);
    }
    .ub-input:focus, .ub-textarea:focus {
      border-color: var(--ub-accent);
    }
    .ub-input {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }
    .ub-textarea {
      resize: none;
      min-height: 120px;
      flex: 1;
      line-height: 1.6;
      border-bottom: none;
    }
    .ub-input:disabled, .ub-textarea:disabled {
      opacity: 0.5;
    }

    /* ── Form actions (select + submit) ── */
    .ub-form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 12px;
      flex-shrink: 0;
    }
    .ub-select {
      padding: 7px 28px 7px 10px;
      border: 1px solid var(--ub-input-border);
      border-radius: var(--ub-radius);
      background: var(--ub-bg);
      color: var(--ub-text-secondary);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      transition: border-color 0.15s;
    }
    .ub-select:hover {
      border-color: var(--ub-text-muted);
    }
    .ub-select:focus {
      border-color: var(--ub-accent);
    }
    .ub-select:disabled {
      opacity: 0.5;
    }
    .ub-btn-submit {
      padding: 7px 20px;
      border: none;
      border-radius: var(--ub-radius);
      background: var(--ub-accent);
      color: var(--ub-accent-text);
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .ub-btn-submit:hover {
      background: var(--ub-accent-hover);
    }
    .ub-btn-submit:disabled {
      opacity: 0.5;
      cursor: default;
    }

    /* ── Success state ── */
    .ub-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
    }
    .ub-success-icon {
      color: var(--ub-success);
      margin-bottom: 16px;
    }
    .ub-success-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--ub-text);
      margin-bottom: 6px;
    }
    .ub-success-text {
      font-size: 14px;
      color: var(--ub-text-muted);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .ub-success-link {
      color: var(--ub-accent);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .ub-success-link:hover {
      text-decoration: underline;
    }

    /* ── Error ── */
    .ub-error {
      padding: 10px 12px;
      border-radius: var(--ub-radius);
      background: rgba(239,68,68,0.08);
      color: var(--ub-destructive-fg);
      font-size: 13px;
      margin-bottom: 8px;
      border: 1px solid rgba(239,68,68,0.12);
    }

    /* ── Empty state ── */
    .ub-empty {
      text-align: center;
      padding: 48px 20px;
      color: var(--ub-text-muted);
      font-size: 14px;
    }

    /* ── Roadmap timeline ── */
    .ub-timeline {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .ub-timeline-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ub-timeline-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ub-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding-bottom: 4px;
    }
    .ub-timeline-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .ub-dot-planned { background: #f59e0b; }
    .ub-dot-in_progress { background: #3b82f6; }
    .ub-dot-completed { background: #22c55e; }

    /* ── Post card ── */
    .ub-post-card {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--ub-radius);
      background: var(--ub-bg-secondary);
      border: 1px solid var(--ub-border);
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      cursor: pointer;
      transition: background 0.15s;
    }
    .ub-post-card:hover {
      background: var(--ub-bg-tertiary);
    }
    .ub-post-content {
      flex: 1;
      min-width: 0;
    }
    .ub-post-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--ub-text);
      line-height: 1.35;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ub-post-meta {
      font-size: 11px;
      color: var(--ub-text-muted);
      margin-top: 1px;
      text-transform: capitalize;
    }


    /* ── Vote button ── */
    .ub-vote-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
      padding: 6px 8px;
      border: 1px solid var(--ub-input-border);
      border-radius: var(--ub-radius);
      background: var(--ub-bg);
      color: var(--ub-text-muted);
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
      font-family: inherit;
      flex-shrink: 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      transition: all 0.15s;
    }
    .ub-vote-btn:hover {
      border-color: var(--ub-accent);
      color: var(--ub-accent);
    }
    .ub-vote-btn.ub-voted {
      background: var(--ub-accent);
      color: var(--ub-accent-text);
      border-color: var(--ub-accent);
    }

    /* ── Badge ── */
    .ub-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
      background: var(--ub-bg-secondary);
      color: var(--ub-text-muted);
    }
    .ub-badge-planned { background: #fef3c7; color: #92400e; }
    .ub-badge-in_progress { background: #dbeafe; color: #1e40af; }
    .ub-badge-completed { background: #dcfce7; color: #166534; }
    .ub-badge-open { background: var(--ub-bg-secondary); color: var(--ub-text-muted); }
    .ub-badge-under_review { background: #f3e8ff; color: #6b21a8; }
    .ub-badge-closed { background: var(--ub-bg-secondary); color: var(--ub-text-muted); }

    /* ── Changelog entry cards ── */
    .ub-entry-card {
      padding: 14px 0;
      border-bottom: 1px solid var(--ub-border-light);
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .ub-entry-card:last-child {
      border-bottom: none;
    }
    .ub-entry-card:hover {
      opacity: 0.75;
    }
    .ub-entry-date {
      font-size: 12px;
      color: var(--ub-text-muted);
      margin-bottom: 4px;
    }
    .ub-entry-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--ub-text);
      margin-bottom: 4px;
    }
    .ub-entry-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 6px;
    }
    .ub-entry-desc {
      font-size: 13px;
      color: var(--ub-text-muted);
      line-height: 1.5;
    }

    /* ── Changelog detail ── */
    .ub-entry-detail {
      display: flex;
      flex-direction: column;
    }
    .ub-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--ub-text-muted);
      text-decoration: none;
      font-size: 13px;
      margin-bottom: 16px;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      font-family: inherit;
    }
    .ub-back-btn:hover {
      color: var(--ub-text);
    }
    .ub-entry-cover {
      width: 100%;
      border-radius: var(--ub-radius);
      margin-bottom: 16px;
      object-fit: cover;
      max-height: 200px;
    }
    .ub-entry-detail-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--ub-text);
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .ub-entry-body {
      font-size: 14px;
      color: var(--ub-text);
      line-height: 1.6;
    }
    .ub-entry-body p { margin: 0 0 12px; }
    .ub-entry-body ul, .ub-entry-body ol { margin: 0 0 12px; padding-left: 20px; }
    .ub-entry-body li { margin-bottom: 4px; }
    .ub-entry-body a { color: var(--ub-accent); }
    .ub-entry-body img { max-width: 100%; border-radius: 8px; }
    .ub-entry-body h1, .ub-entry-body h2, .ub-entry-body h3 {
      margin: 16px 0 8px;
      color: var(--ub-text);
    }

    /* ── Skeleton loading ── */
    .ub-skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .ub-skeleton-row {
      display: flex;
      flex-direction: column;
    }
    .ub-skeleton {
      background: var(--ub-bg-secondary);
      border-radius: 6px;
      animation: ub-pulse 1.5s ease-in-out infinite;
    }
    @keyframes ub-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      .ub-panel {
        width: 100vw;
        max-width: 100vw;
        height: calc(100vh - 100px);
        ${panelHorizontal.includes("right") ? "right: 0" : "left: 0"};
        border-radius: 16px 16px 0 0;
        ${isBottom ? "bottom: 0" : "top: 0"};
      }
    }
  `;
}
