"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, ChevronUp, Copy, ExternalLink, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CopyPageButtonProps = {
  markdown: string;
  slug: string;
};

function buildChatGPTUrl(pageUrl: string): string {
  const prompt = encodeURIComponent(
    `Read this documentation page and help me understand it: ${pageUrl}`
  );
  return `https://chat.openai.com/?q=${prompt}`;
}

function buildClaudeUrl(pageUrl: string): string {
  const prompt = encodeURIComponent(
    `Read this documentation page and help me understand it: ${pageUrl}`
  );
  return `https://claude.ai/new?q=${prompt}`;
}

export function CopyPageButton({ markdown, slug }: CopyPageButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [checked, onCopy] = useCopyButton(() => {
    navigator.clipboard.writeText(markdown);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pageUrl = `https://docs.userbubble.com/docs/${slug}`;
  const markdownUrl = `/docs/markdown/${slug}`;

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center">
        <button
          className="inline-flex items-center gap-2 rounded-l-full border border-fd-border bg-fd-background px-4 py-1.5 text-fd-foreground text-sm transition-colors hover:bg-fd-accent"
          onClick={onCopy}
          type="button"
        >
          {checked ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {checked ? "Copied!" : "Copy page"}
        </button>
        <button
          aria-expanded={open}
          aria-label="More copy options"
          className="inline-flex items-center rounded-r-full border border-fd-border border-l-0 bg-fd-background px-2 py-1.5 text-fd-foreground transition-colors hover:bg-fd-accent"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <ChevronUp
            className="size-3.5 transition-transform duration-200"
            style={{ transform: open ? undefined : "rotate(180deg)" }}
          />
        </button>
      </div>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-fd-border bg-fd-popover shadow-lg">
          <div className="p-1.5">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fd-accent"
              onClick={(e) => {
                onCopy(e);
                setOpen(false);
              }}
              type="button"
            >
              <Copy className="size-5 shrink-0 text-fd-muted-foreground" />
              <div>
                <div className="font-medium text-sm">Copy page</div>
                <div className="text-fd-muted-foreground text-xs">
                  Copy page as Markdown for LLMs
                </div>
              </div>
            </button>

            <a
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fd-accent"
              href={markdownUrl}
              rel="noopener"
              target="_blank"
            >
              <FileText className="size-5 shrink-0 text-fd-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-1 font-medium text-sm">
                  View as Markdown
                  <ExternalLink className="size-3" />
                </div>
                <div className="text-fd-muted-foreground text-xs">
                  View this page as plain text
                </div>
              </div>
            </a>

            <a
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fd-accent"
              href={buildChatGPTUrl(pageUrl)}
              rel="noopener"
              target="_blank"
            >
              <ChatGPTIcon />
              <div className="flex-1">
                <div className="flex items-center gap-1 font-medium text-sm">
                  Open in ChatGPT
                  <ExternalLink className="size-3" />
                </div>
                <div className="text-fd-muted-foreground text-xs">
                  Ask questions about this page
                </div>
              </div>
            </a>

            <a
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fd-accent"
              href={buildClaudeUrl(pageUrl)}
              rel="noopener"
              target="_blank"
            >
              <ClaudeIcon />
              <div className="flex-1">
                <div className="flex items-center gap-1 font-medium text-sm">
                  Open in Claude
                  <ExternalLink className="size-3" />
                </div>
                <div className="text-fd-muted-foreground text-xs">
                  Ask questions about this page
                </div>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatGPTIcon() {
  return (
    <svg
      className="size-5 shrink-0 text-fd-muted-foreground"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

function ClaudeIcon() {
  return (
    <svg
      className="size-5 shrink-0 text-fd-muted-foreground"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.709 15.955l4.397-2.398a.4.4 0 0 0 .2-.347V6.682a.4.4 0 0 1 .6-.347l8.795 4.797a.4.4 0 0 1 .2.347v1.948a.4.4 0 0 1-.6.347L9.506 9.377a.4.4 0 0 0-.6.347v4.925a.4.4 0 0 1-.2.347l-3.597 1.962a.4.4 0 0 1-.6-.347v-.309a.4.4 0 0 1 .2-.347z" />
    </svg>
  );
}
