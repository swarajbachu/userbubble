"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Input } from "@userbubble/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { authClient } from "~/auth/client";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "admin"]),
});

type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
};

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
}: InviteMemberDialogProps) {
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: "member" | "admin" }) =>
      authClient.organization.inviteMember({
        organizationId,
        email: data.email,
        role: data.role,
      }),
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to send invitation");
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member" as "member" | "admin",
    },
    validators: {
      onSubmit: inviteSchema,
    },
    onSubmit: async ({ value }) => {
      await inviteMutation.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogPopup className="pt-4 sm:max-w-[500px]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite a new team member to your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <form.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="colleague@example.com"
                    type="email"
                    value={field.state.value}
                  />
                  <FieldDescription>
                    Enter the email address of the person you want to invite.
                  </FieldDescription>
                </Field>
              )}
            </form.Field>

            <form.Field name="role">
              {(field) => (
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      field.handleChange(value as typeof field.state.value)
                    }
                    value={field.state.value}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    Admins can manage settings and members.
                  </FieldDescription>
                </Field>
              )}
            </form.Field>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={inviteMutation.isPending} type="submit">
              {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
