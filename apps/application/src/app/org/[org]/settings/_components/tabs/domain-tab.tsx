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
import { Input } from "@userbubble/ui/input";
import { toast } from "@userbubble/ui/toast";
import { useTRPC } from "~/trpc/react";

export function DomainTab({ organization }: { organization: Organization }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const settings = parseOrganizationSettings(organization.metadata);

  const updateSettings = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Domain settings saved");
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      customDomain: settings.domain?.customDomain ?? "",
    },
    onSubmit: async ({ value }) => {
      await updateSettings.mutateAsync({
        organizationId: organization.id,
        settings: {
          domain: {
            customDomain: value.customDomain,
            domainVerified: false, // Reset verification when domain changes
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
          <h3 className="mb-4 font-semibold text-lg">Manage Domain</h3>
          <p className="text-muted-foreground text-sm">
            Create a custom domain for your workspace.
          </p>
        </div>

        <FieldGroup className="space-y-6">
          <form.Field name="customDomain">
            {(field) => (
              <Field>
                <FieldLabel>Custom Domain</FieldLabel>
                <Input
                  disabled
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="feedback.yourcompany.com"
                  value={field.state.value}
                />
                <FieldDescription>
                  Custom domains are coming soon.
                </FieldDescription>
              </Field>
            )}
          </form.Field>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-blue-900 text-sm dark:text-blue-100">
              Upgrade your plan to add your custom domain.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-2">
            <Button disabled type="submit">
              Upgrade
            </Button>
          </div>
        </FieldGroup>
      </div>
    </form>
  );
}
