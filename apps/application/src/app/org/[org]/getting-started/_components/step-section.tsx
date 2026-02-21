"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import type { GlobalIcon } from "@hugeicons-pro/core-bulk-rounded";
import {
  CheckmarkCircle01Icon,
  Copy01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import { Separator } from "@userbubble/ui/separator";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";

export function Section({
  icon,
  title,
  badge,
  description,
  action,
  children,
}: {
  icon: typeof GlobalIcon;
  title: string;
  badge?: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="text-muted-foreground" icon={icon} size={20} />
          <h3 className="font-semibold">{title}</h3>
          {badge && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      <p className="text-muted-foreground text-sm">{description}</p>
      {children}
    </div>
  );
}

export function CodeBlock({
  code,
  numbered = false,
}: {
  code: string;
  numbered?: boolean;
}) {
  const lines = code.split("\n");
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/50">
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
        {numbered ? (
          <code>
            {lines.map((line, i) => (
              <span className="flex" key={`line-${i}-${line.slice(0, 20)}`}>
                <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground">
                  {i + 1}
                </span>
                {line}
                {"\n"}
              </span>
            ))}
          </code>
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  );
}

export function CopyButton({
  value,
  onCopy,
}: {
  value: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button onClick={copyToClipboard} size="sm" variant="outline">
      <HugeiconsIcon
        className="mr-1"
        icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
        size={14}
      />
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function StepSeparator() {
  return <Separator className="my-6" />;
}
