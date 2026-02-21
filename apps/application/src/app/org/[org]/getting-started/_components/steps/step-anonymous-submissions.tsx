"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { parseOrganizationSettings } from "@userbubble/db/schema";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Switch } from "@userbubble/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type StepAnonymousSubmissionsProps = {
  organization: Organization;
  onDone: () => void;
};

export function StepAnonymousSubmissions({
  organization,
  onDone,
}: StepAnonymousSubmissionsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const settings = parseOrganizationSettings(organization.metadata);

  const [values, setValues] = useState({
    allowAnonymousSubmissions:
      settings.publicAccess?.allowAnonymousSubmissions ?? false,
    allowAnonymousVoting: settings.publicAccess?.allowAnonymousVoting ?? true,
    allowAnonymousComments:
      settings.publicAccess?.allowAnonymousComments ?? false,
  });

  const updateSettings = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Settings saved");
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    })
  );

  const handleToggle = (key: keyof typeof values, checked: boolean) => {
    const newValues = { ...values, [key]: checked };
    setValues(newValues);
    onDone();

    updateSettings.mutate({
      organizationId: organization.id,
      settings: {
        publicAccess: {
          ...settings.publicAccess,
          allowAnonymousSubmissions: newValues.allowAnonymousSubmissions,
          allowAnonymousVoting: newValues.allowAnonymousVoting,
          allowAnonymousComments: newValues.allowAnonymousComments,
        },
      },
    });
  };

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Allow people to submit feedback without signing up. This reduces
        friction and increases engagement.
      </p>

      <div className="space-y-4">
        <Field className="flex flex-row items-start justify-between gap-2">
          <div className="flex-1">
            <FieldLabel>Allow Anonymous Submissions</FieldLabel>
            <FieldDescription>
              Let guests submit feedback without signing in.
            </FieldDescription>
          </div>
          <Switch
            checked={values.allowAnonymousSubmissions}
            disabled={updateSettings.isPending}
            onCheckedChange={(checked) =>
              handleToggle("allowAnonymousSubmissions", checked)
            }
          />
        </Field>

        <Field className="flex flex-row items-start justify-between gap-2">
          <div className="flex-1">
            <FieldLabel>Allow Anonymous Voting</FieldLabel>
            <FieldDescription>
              Let guests vote on feedback without signing in.
            </FieldDescription>
          </div>
          <Switch
            checked={values.allowAnonymousVoting}
            disabled={updateSettings.isPending}
            onCheckedChange={(checked) =>
              handleToggle("allowAnonymousVoting", checked)
            }
          />
        </Field>

        <Field className="flex flex-row items-start justify-between gap-2">
          <div className="flex-1">
            <FieldLabel>Allow Anonymous Comments</FieldLabel>
            <FieldDescription>
              Let guests comment without signing in.
            </FieldDescription>
          </div>
          <Switch
            checked={values.allowAnonymousComments}
            disabled={updateSettings.isPending}
            onCheckedChange={(checked) =>
              handleToggle("allowAnonymousComments", checked)
            }
          />
        </Field>
      </div>
    </div>
  );
}
