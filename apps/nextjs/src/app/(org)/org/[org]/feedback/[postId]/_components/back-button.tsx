"use client";

import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useRouter } from "next/navigation";

export function BackButton({ org }: { org: string }) {
  const router = useRouter();

  return (
    <Button
      className="mb-6"
      onClick={() => router.push(`/org/${org}/feedback`)}
      size="sm"
      variant="ghost"
    >
      <Icon icon={ArrowLeft01Icon} size={16} />
      Back to Requests
    </Button>
  );
}
