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

    /* Light theme (default) */
    .ub-root {
      --ub-accent: ${accent};
      --ub-accent-text: #fff;
      --ub-bg: #ffffff;
      --ub-bg-secondary: #f4f4f5;
      --ub-text: #18181b;
      --ub-text-muted: #71717a;
      --ub-border: #e4e4e7;
      --ub-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      --ub-btn-shadow: 0 4px 16px rgba(0,0,0,0.16);
    }

    /* Dark theme */
    .ub-root.ub-dark {
      --ub-bg: #18181b;
      --ub-bg-secondary: #27272a;
      --ub-text: #fafafa;
      --ub-text-muted: #a1a1aa;
      --ub-border: #3f3f46;
      --ub-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
      --ub-btn-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }

    /* Auto theme via prefers-color-scheme */
    @media (prefers-color-scheme: dark) {
      .ub-root.ub-auto {
        --ub-bg: #18181b;
        --ub-bg-secondary: #27272a;
        --ub-text: #fafafa;
        --ub-text-muted: #a1a1aa;
        --ub-border: #3f3f46;
        --ub-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
        --ub-btn-shadow: 0 4px 16px rgba(0,0,0,0.4);
      }
    }

    .ub-bubble {
      position: fixed;
      ${verticalProp}: 24px;
      ${horizontalProp}: 24px;
      z-index: 2147483647;
      width: 56px;
      height: 56px;
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
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(0,0,0,0.24);
    }
    .ub-bubble:active {
      transform: scale(0.95);
    }
    .ub-bubble.ub-hidden {
      display: none;
    }

    .ub-panel {
      position: fixed;
      ${panelVertical};
      ${panelHorizontal};
      z-index: 2147483647;
      width: 420px;
      max-width: calc(100vw - 48px);
      height: min(680px, calc(100vh - 120px));
      background: var(--ub-bg);
      border-radius: 16px;
      border: 1px solid var(--ub-border);
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

    .ub-iframe {
      flex: 1;
      width: 100%;
      border: none;
      border-radius: 16px;
      background: var(--ub-bg);
    }

    @media (max-width: 480px) {
      .ub-panel {
        width: 100vw;
        max-width: 100vw;
        height: calc(100vh - 100px);
        ${panelHorizontal.includes("right") ? "right: 0" : "left: 0"};
        border-radius: 16px 16px 0 0;
        ${isBottom ? "bottom: 0" : "top: 0"};
      }
      .ub-iframe {
        border-radius: 16px 16px 0 0;
      }
    }
  `;
}
