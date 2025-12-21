"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons-pro/core-bulk-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type Member = {
  id: string;
  role: "owner" | "admin" | "member";
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type MemberActionsProps = {
  member: Member;
  organizationId: string;
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member";
};

export function MemberActions({
  member,
  organizationId,
  currentUserId,
}: MemberActionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "member">(
    member.role === "owner" ? "admin" : member.role
  );

  const isCurrentUser = member.userId === currentUserId;
  const isOwner = member.role === "owner";

  const updateRoleMutation = useMutation(
    trpc.settings.updateMemberRole.mutationOptions({
      onSuccess: () => {
        toast.success("Member role updated successfully");
        queryClient.invalidateQueries();
        setChangeRoleDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to update member role");
      },
    })
  );

  const removeMemberMutation = useMutation(
    trpc.settings.removeMember.mutationOptions({
      onSuccess: () => {
        toast.success("Member removed successfully");
        queryClient.invalidateQueries();
        setRemoveDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to remove member");
      },
    })
  );

  const handleChangeRole = async () => {
    await updateRoleMutation.mutateAsync({
      memberId: member.id,
      organizationId,
      role: selectedRole,
    });
  };

  const handleRemove = async () => {
    await removeMemberMutation.mutateAsync({
      memberId: member.id,
      organizationId,
    });
  };

  // Don't show actions for current user or if user is owner
  if (isCurrentUser || isOwner) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          onClick={() => setChangeRoleDialogOpen(true)}
          size="sm"
          variant="ghost"
        >
          Change Role
        </Button>
        <Button
          onClick={() => setRemoveDialogOpen(true)}
          size="sm"
          variant="ghost"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
        </Button>
      </div>

      {/* Change Role Dialog */}
      <Dialog
        onOpenChange={setChangeRoleDialogOpen}
        open={changeRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Change the role for {member.user.name || member.user.email}.
            </DialogDescription>
          </DialogHeader>

          <DialogPanel>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  checked={selectedRole === "member"}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as "member" | "admin")
                  }
                  type="radio"
                  value="member"
                />
                <div>
                  <div className="font-medium">Member</div>
                  <div className="text-muted-foreground text-sm">
                    Can view and interact with workspace content.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2">
                <input
                  checked={selectedRole === "admin"}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as "member" | "admin")
                  }
                  type="radio"
                  value="admin"
                />
                <div>
                  <div className="font-medium">Admin</div>
                  <div className="text-muted-foreground text-sm">
                    Can manage settings and members.
                  </div>
                </div>
              </label>
            </div>
          </DialogPanel>

          <DialogFooter>
            <Button
              onClick={() => setChangeRoleDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={updateRoleMutation.isPending}
              onClick={handleChangeRole}
            >
              {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog onOpenChange={setRemoveDialogOpen} open={removeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              {member.user.name || member.user.email} from this workspace? They
              will lose access to all workspace content.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              onClick={() => setRemoveDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={removeMemberMutation.isPending}
              onClick={handleRemove}
              variant="destructive"
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
