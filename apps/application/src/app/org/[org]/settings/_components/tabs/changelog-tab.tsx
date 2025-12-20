"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { parseOrganizationSettings } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@userbubble/ui/field";
import { Switch } from "@userbubble/ui/switch";
import { toast } from "@userbubble/ui/toast";
import { useTRPC } from "~/trpc/react";

export function ChangelogTab({ organization }: { organization: Organization }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const settings = parseOrganizationSettings(organization.metadata);

  const updateSettings = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Changelog settings saved");
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      enabled: settings.changelog?.enabled ?? false,
    },
    onSubmit: async ({ value }) => {
      await updateSettings.mutateAsync({
        organizationId: organization.id,
        settings: {
          changelog: {
            enabled: value.enabled,
            tags: settings.changelog?.tags ?? [],
          },
        },
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-4 font-semibold text-lg">Manage Changelog</h3>
          <p className="text-muted-foreground text-sm">
            Control the visibility and settings for your changelog.
          </p>
        </div>

        <FieldGroup className="space-y-6">
          <form.Field name="enabled">
            {(field) => (
              <Field orientation="horizontal">
                <div className="flex-1">
                  <FieldLabel>Enable Changelog</FieldLabel>
                  <FieldDescription>
                    Make your changelog publicly visible to users.
                  </FieldDescription>
                </div>
                <Switch
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </Field>
            )}
          </form.Field>

          {/* Save Button */}
          <div className="flex items-center gap-2 border-t pt-6">
            <Button disabled={updateSettings.isPending} type="submit">
              {updateSettings.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </FieldGroup>
      </div>
    </form>
  );
}
