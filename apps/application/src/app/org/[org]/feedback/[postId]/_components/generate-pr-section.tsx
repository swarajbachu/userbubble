"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@userbubble/ui/dialog";
import { Textarea } from "@userbubble/ui/textarea";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { PrJobStatusView } from "./pr-job-status";

type GeneratePrSectionProps = {
  postId: string;
  postTitle: string;
  postDescription: string;
  organizationId: string;
  orgSlug: string;
  isAdmin: boolean;
};

export function GeneratePrSection({
  postId,
  postTitle,
  postDescription,
  organizationId,
  orgSlug,
  isAdmin,
}: GeneratePrSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [additionalContext, setAdditionalContext] = useState("");

  // Check if integrations are configured
  const { data: apiKeys } = useQuery(
    trpc.automation.getApiKeyStatus.queryOptions({ organizationId })
  );
  const { data: githubConfig } = useQuery(
    trpc.automation.getGithubConfig.queryOptions({ organizationId })
  );
  const { data: oauthStatus } = useQuery(
    trpc.automation.getOAuthConnectionStatus.queryOptions({
      organizationId,
      provider: "codex",
    })
  );

  // List existing jobs for this post
  const { data: jobs } = useQuery(
    trpc.automation.listJobsForPost.queryOptions({
      organizationId,
      feedbackPostId: postId,
    })
  );

  const triggerMutation = useMutation(
    trpc.automation.triggerPrGeneration.mutationOptions({
      onSuccess: () => {
        toast.success("PR generation started");
        setOpen(false);
        setAdditionalContext("");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const hasAnthropic = apiKeys?.some((k) => k.provider === "anthropic");
  const hasCodex = oauthStatus?.status === "active";
  const hasGithub = apiKeys?.some((k) => k.provider === "github");
  const hasAiProvider = hasAnthropic || hasCodex;
  const isConfigured = hasAiProvider && hasGithub && githubConfig;

  // Show the most recent job if exists
  const latestJob = jobs?.[0];

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-3">
      <span className="font-semibold text-sm">AI PR Generation</span>

      {isConfigured ? (
        <div className="space-y-3">
          <Dialog onOpenChange={setOpen} open={open}>
            <DialogTrigger asChild>
              <Button className="w-full" size="sm">
                Generate PR with AI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate PR with AI</DialogTitle>
                <DialogDescription>
                  An AI agent will clone the repo, implement the feature
                  described in this feedback post, and open a pull request.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <p className="font-medium text-sm">Feedback</p>
                  <p className="font-medium text-muted-foreground text-sm">
                    {postTitle}
                  </p>
                  <p className="line-clamp-3 text-muted-foreground text-xs">
                    {postDescription}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="font-medium text-sm">Repo</p>
                  <p className="font-mono text-muted-foreground text-xs">
                    {githubConfig.repoFullName} ({githubConfig.defaultBranch})
                  </p>
                </div>

                <div className="space-y-1">
                  <label
                    className="font-medium text-sm"
                    htmlFor="additional-context"
                  >
                    Additional context (optional)
                  </label>
                  <Textarea
                    id="additional-context"
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any additional instructions for the AI agent..."
                    rows={3}
                    value={additionalContext}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button
                  disabled={triggerMutation.isPending}
                  onClick={() =>
                    triggerMutation.mutate({
                      organizationId,
                      feedbackPostId: postId,
                      additionalContext: additionalContext || undefined,
                    })
                  }
                >
                  {triggerMutation.isPending ? "Starting..." : "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Show latest job status */}
          {latestJob && (
            <PrJobStatusView
              isAdmin={isAdmin}
              jobId={latestJob.id}
              organizationId={organizationId}
            />
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Configure integrations to enable AI-powered PR generation.
          </p>
          <div className="space-y-1 text-xs">
            {!hasAiProvider && (
              <p className="text-muted-foreground">
                - AI provider required (Anthropic key or OpenAI Codex)
              </p>
            )}
            {!hasGithub && (
              <p className="text-muted-foreground">- GitHub token required</p>
            )}
            {!githubConfig && (
              <p className="text-muted-foreground">
                - GitHub repository required
              </p>
            )}
          </div>
          <Link
            className="text-blue-500 text-xs hover:underline"
            href={`/org/${orgSlug}/settings`}
          >
            Set up in Settings
          </Link>
        </div>
      )}
    </div>
  );
}
