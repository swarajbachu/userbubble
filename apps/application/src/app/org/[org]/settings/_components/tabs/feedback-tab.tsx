"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { parseOrganizationSettings } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Switch } from "@userbubble/ui/switch";
import { toast } from "sonner";

import { useTRPC } from "~/trpc/react";

export function FeedbackTab({ organization }: { organization: Organization }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const settings = parseOrganizationSettings(organization.metadata);

  const updateSettings = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Feedback settings saved");
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("Failed to save settings");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      allowAnonymousSubmissions:
        settings.publicAccess?.allowAnonymousSubmissions ?? false,
      allowAnonymousVoting: settings.publicAccess?.allowAnonymousVoting ?? true,
      allowAnonymousComments:
        settings.publicAccess?.allowAnonymousComments ?? false,
      enableRoadmap: settings.feedback?.enableRoadmap ?? true,
      // enableDigestEmails: settings.feedback?.enableDigestEmails ?? false,
    },
    onSubmit: async ({ value }) => {
      await updateSettings.mutateAsync({
        organizationId: organization.id,
        settings: {
          publicAccess: {
            allowAnonymousSubmissions: value.allowAnonymousSubmissions,
            allowAnonymousVoting: value.allowAnonymousVoting,
            allowAnonymousComments: value.allowAnonymousComments,
            requireApproval: settings.publicAccess?.requireApproval ?? false,
          },
          feedback: {
            enableRoadmap: value.enableRoadmap,
            // enableDigestEmails: value.enableDigestEmails,
            boards: settings.feedback?.boards ?? [],
            tags: settings.feedback?.tags ?? [],
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
      <div className="w-full space-y-6">
        <div>
          <h3 className="mb-4 font-semibold text-lg">Manage Feedback</h3>
          <p className="text-muted-foreground text-sm">
            Manage your feedback board.
          </p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Allow Guest Submissions</h4>

            <form.Field name="allowAnonymousSubmissions">
              {(field) => (
                <Field className="flex flex-row items-start justify-between gap-2">
                  <div className="flex-1">
                    <FieldLabel>Allow Guest Feedback</FieldLabel>
                    <FieldDescription>
                      Let guests submit feedback without signing in.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="allowAnonymousVoting">
              {(field) => (
                <Field className="flex flex-row items-start justify-between gap-2">
                  <div className="flex-1">
                    <FieldLabel>Allow Guest Voting</FieldLabel>
                    <FieldDescription>
                      Let guests vote on feedback without signing in.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="allowAnonymousComments">
              {(field) => (
                <Field className="flex flex-row items-start justify-between gap-2">
                  <div className="flex-1">
                    <FieldLabel>Allow Guest Comments</FieldLabel>
                    <FieldDescription>
                      Let guests comment without signing in.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <div className="space-y-4 border-t pt-6">
            <h4 className="font-medium text-sm">Features</h4>

            <form.Field name="enableRoadmap">
              {(field) => (
                <Field className="flex flex-row items-start justify-between gap-2">
                  <div className="flex-1">
                    <FieldLabel>Enable Roadmap</FieldLabel>
                    <FieldDescription>
                      Show public roadmap with planned and in-progress items.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>

            {/* <form.Field name="enableDigestEmails">
              {(field) => (
                <Field orientation="horizontal">
                  <div className="flex-1">
                    <FieldLabel>Weekly Digest Emails</FieldLabel>
                    <FieldDescription>
                      Send weekly summary emails to team members.
                    </FieldDescription>
                  </div>
                  <Switch
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field> */}
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-2 border-t pt-6">
            <Button disabled={updateSettings.isPending} type="submit">
              {updateSettings.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
