"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { useState } from "react";
import { InviteMemberDialog } from "./invite-member-dialog";

type InviteMemberButtonProps = {
  organizationId: string;
};

export function InviteMemberButton({
  organizationId,
}: InviteMemberButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <HugeiconsIcon icon={UserAdd01Icon} size={16} />
        Invite Member
      </Button>

      <InviteMemberDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        organizationId={organizationId}
      />
    </>
  );
}
