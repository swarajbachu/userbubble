"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Copy01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { Button } from "@userbubble/ui/button";
import { useState } from "react";
import { toast } from "sonner";

type CopyButtonProps = {
  value: string;
  label?: string;
  successMessage?: string;
};

export function CopyButton({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(successMessage);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      className="shrink-0"
      onClick={copyToClipboard}
      size="sm"
      variant="outline"
    >
      {copied ? (
        <>
          <HugeiconsIcon
            className="mr-1 h-4 w-4"
            icon={CheckmarkCircle01Icon}
            size={16}
          />
          Copied
        </>
      ) : (
        <>
          <HugeiconsIcon className="mr-1 h-4 w-4" icon={Copy01Icon} size={16} />
          {label}
        </>
      )}
    </Button>
  );
}
