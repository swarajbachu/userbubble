"use client";

import { ArrowLeft01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import { useRouter } from "next/navigation";

export function BackButton({ org }: { org: string }) {
  const router = useRouter();

  return (
    <Button
      className="group -ml-2 h-auto gap-1 px-2 py-1 text-muted-foreground hover:bg-transparent hover:text-foreground"
      onClick={() => router.push(`/org/${org}/feedback`)}
      size="sm"
      variant="ghost"
    >
      <Icon
        className="transition-transform group-hover:-translate-x-0.5"
        icon={ArrowLeft01Icon}
        size={16}
      />
      <span className="font-medium text-sm">Back to Requests</span>
    </Button>
  );
}
