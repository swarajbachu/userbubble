"use client";

import { useMutation } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@userbubble/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@userbubble/ui/field";
import { Input } from "@userbubble/ui/input";
import { toast } from "@userbubble/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

export function DataTab({
  organization,
  userRole,
}: {
  organization: Organization;
  userRole: "owner" | "admin" | "member";
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState("");

  const deleteOrg = useMutation(
    trpc.settings.deleteOrganization.mutationOptions({
      onSuccess: () => {
        toast.success("Organization deleted successfully");
        router.push("/");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete organization");
      },
    })
  );

  const handleDelete = async () => {
    await deleteOrg.mutateAsync({
      organizationId: organization.id,
      confirmationName,
    });
  };

  const isOwner = userRole === "owner";

  return (
    <div className="space-y-6">
      {/* <div>
        <h3 className="mb-4 font-semibold text-lg">Data Import</h3>
        <p className="text-muted-foreground text-sm">
          Import data from your existing tools.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="mb-2 font-medium">Import from CSV</div>
          <p className="mb-4 text-muted-foreground text-sm">
            Import your feature requests, boards, and users from a CSV file.
          </p>
          <Button disabled size="sm" variant="outline">
            Import
          </Button>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-2 font-medium">Import from Canny</div>
          <p className="mb-4 text-muted-foreground text-sm">
            Import your feedback, feature requests, and comments directly from
            Canny.
          </p>
          <Button disabled size="sm" variant="outline">
            Import
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="mb-4 font-semibold text-lg">Data Export</h3>
        <p className="text-muted-foreground text-sm">
          Export data from your workspace.
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 font-medium">Export to CSV</div>
        <p className="mb-4 text-muted-foreground text-sm">
          Export all your feedback submissions and their details to a
          downloadable CSV file.
        </p>
        <Button disabled size="sm" variant="outline">
          Export
        </Button>
      </div> */}

      <div className="border-t pt-6">
        <h3 className="mb-4 font-semibold text-destructive text-lg">
          Danger Zone
        </h3>
        <p className="text-muted-foreground text-sm">
          Delete this workspace permanently. This action cannot be undone.
        </p>
      </div>

      <div className="rounded-lg border border-destructive bg-destructive/5 p-4">
        <div className="mb-2 font-medium text-destructive">
          Delete Workspace
        </div>
        <p className="mb-4 text-muted-foreground text-sm">
          Once you delete your workspace, there is no going back. Please be
          certain.
        </p>
        <Button
          disabled={!isOwner}
          onClick={() => setDeleteDialogOpen(true)}
          size="sm"
          variant="destructive"
        >
          Delete Workspace
        </Button>
        {!isOwner && (
          <p className="mt-2 text-muted-foreground text-xs">
            Only the workspace owner can delete the organization.
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              workspace and all associated data.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel>
                  Type <strong>{organization.name}</strong> to confirm
                </FieldLabel>
                <Input
                  onChange={(e) => setConfirmationName(e.target.value)}
                  placeholder={organization.name}
                  value={confirmationName}
                />
                <FieldDescription>
                  This action is irreversible. All data will be lost.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </DialogBody>

          <DialogFooter>
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                setConfirmationName("");
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={
                confirmationName !== organization.name || deleteOrg.isPending
              }
              onClick={handleDelete}
              variant="destructive"
            >
              {deleteOrg.isPending ? "Deleting..." : "Delete Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
