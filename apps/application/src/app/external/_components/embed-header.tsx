"use client";

type EmbedHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
};

export function EmbedHeader({ title, subtitle, onBack }: EmbedHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
      {onBack && (
        <button
          className="flex items-center justify-center rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={onBack}
          type="button"
        >
          <svg
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold text-sm">{title}</h1>
        {subtitle && (
          <p className="truncate text-muted-foreground text-xs">{subtitle}</p>
        )}
      </div>
      <button
        className="flex items-center justify-center rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        onClick={() => {
          if (window.self !== window.top) {
            window.parent.postMessage({ type: "userbubble:close" }, "*");
          }
        }}
        type="button"
      >
        <svg
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
