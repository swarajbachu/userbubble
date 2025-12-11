"use client";

import { Button } from "@critichut/ui/button";
import { toast } from "@critichut/ui/toast";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { useState } from "react";
import { authClient } from "~/auth/client";
import { CreateFeedbackDialog } from "./create-feedback-dialog";

type CreateFeedbackButtonProps = {
  organizationId: string;
  allowAnonymous: boolean;
};

export function CreateFeedbackButton({
  organizationId,
  allowAnonymous,
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
      <Button onClick={handleClick} size="lg">
        <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} />
        Submit Feedback
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
