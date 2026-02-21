"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { parseOrganizationSettings } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Input } from "@userbubble/ui/input";
import Image from "next/image";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

type StepBrandingProps = {
  organization: Organization;
  onDone: () => void;
};

export function StepBranding({ organization, onDone }: StepBrandingProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const settings = parseOrganizationSettings(organization.metadata);

  const updateOrgMutation = useMutation({
    mutationFn: async (data: { name?: string; logo?: string }) =>
      authClient.organization.update({
        organizationId: organization.id,
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: () => {
      toast.error("Failed to update organization");
    },
  });

  const updateSettingsMutation = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      name: organization.name,
      logo: organization.logo ?? "",
      primaryColor: settings.branding?.primaryColor ?? "#3b82f6",
    },
    onSubmit: async ({ value }) => {
      if (
        value.name !== organization.name ||
        value.logo !== (organization.logo ?? "")
      ) {
        await updateOrgMutation.mutateAsync({
          name: value.name,
          logo: value.logo || undefined,
        });
      }

      await updateSettingsMutation.mutateAsync({
        organizationId: organization.id,
        settings: {
          branding: {
            primaryColor: value.primaryColor,
            logoUrl: value.logo,
          },
        },
      });

      toast.success("Branding updated");
      onDone();
    },
  });

  const isLoading =
    updateOrgMutation.isPending || updateSettingsMutation.isPending;

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Make your feedback board match your brand with custom logo, colors, and
        name.
      </p>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* Logo */}
        <form.Field name="logo">
          {(field) => (
            <Field>
              <FieldLabel>Logo URL</FieldLabel>
              <div className="flex items-center gap-4">
                {field.state.value ? (
                  <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                    <Image
                      alt="Logo preview"
                      className="size-10 rounded object-contain"
                      height={48}
                      src={field.state.value}
                      width={48}
                    />
                  </div>
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-lg border bg-muted">
                    <span className="font-bold text-lg text-muted-foreground">
                      {organization.name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <Input
                  className="flex-1"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  value={field.state.value}
                />
              </div>
              <FieldDescription>
                Enter a URL for your organization logo.
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Name */}
        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel>Organization Name</FieldLabel>
              <Input
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                value={field.state.value}
              />
              <FieldDescription>
                This is your organization's visible name on the feedback board.
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Primary Color */}
        <form.Field name="primaryColor">
          {(field) => (
            <Field>
              <FieldLabel>Primary Color</FieldLabel>
              <FieldDescription>
                Choose your brand's primary color.
              </FieldDescription>
              <div className="flex items-center gap-2">
                <Input
                  className="h-10 w-20 cursor-pointer"
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="color"
                  value={field.state.value}
                />
                <Input
                  className="w-28"
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="#000000"
                  type="text"
                  value={field.state.value}
                />
              </div>
            </Field>
          )}
        </form.Field>

        <Button disabled={isLoading} type="submit">
          {isLoading ? "Saving..." : "Save Branding"}
        </Button>
      </form>
    </div>
  );
}
