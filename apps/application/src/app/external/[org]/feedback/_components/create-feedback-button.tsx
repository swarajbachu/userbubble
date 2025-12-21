"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { Button } from "@userbubble/ui/button";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { CreateFeedbackDialog } from "./create-feedback-dialog";

type CreateFeedbackButtonProps = {
  organizationId: string;
  allowAnonymous: boolean;
  children?: React.ReactNode;
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
};

export function CreateFeedbackButton({
  organizationId,
  allowAnonymous,
  children,
  className,
  variant = "default",
}: CreateFeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const handleClick = () => {
    if (!(isAuthenticated || allowAnonymous)) {
      toast.error("Please sign in to submit feedback");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        className={className}
        onClick={handleClick}
        size="lg"
        variant={variant}
      >
        <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} />
        {children ?? "Submit Feedback"}
      </Button>

      <CreateFeedbackDialog
        allowAnonymous={allowAnonymous}
        onOpenChange={setOpen}
        open={open}
        organizationId={organizationId}
      />
    </>
  );
}
