"use client";

import { Add01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import { useState } from "react";
import { authClient } from "~/auth/client";
import { CreateRequestDialog } from "./create-request-dialog";

export function CreateRequestButton() {
  const [open, setOpen] = useState(false);

  const { data: activeOrganization } = authClient.useActiveOrganization();
  if (!activeOrganization) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg">
        <Icon icon={Add01Icon} size={20} />
        Create Request
      </Button>

      <CreateRequestDialog
        onOpenChange={setOpen}
        open={open}
        organizationId={activeOrganization.id}
      />
    </>
  );
}
