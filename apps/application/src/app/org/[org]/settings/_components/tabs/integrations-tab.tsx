"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Organization, OrganizationSettings } from "@userbubble/db/schema";
import { Badge } from "@userbubble/ui/badge";
import { Button } from "@userbubble/ui/button";
import {
  Card,
  CardDescription,
  CardFrame,
  CardFrameFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@userbubble/ui/card";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Input } from "@userbubble/ui/input";
import { Separator } from "@userbubble/ui/separator";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type IntegrationsTabProps = {
  organization: Organization;
  settings: OrganizationSettings;
};

export function IntegrationsTab({ organization }: IntegrationsTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-lg">AI Integration</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Connect Claude Code Routines and GitHub to automate PR generation from
          feedback.
        </p>
      </div>

      {/* --- Claude Code Routine --- */}
      <RoutineConfigSection organizationId={organization.id} />

      <Separator />

      {/* --- GitHub Connection --- */}
      <section className="space-y-4">
        <div>
          <h4 className="font-medium text-sm">GitHub</h4>
          <p className="text-muted-foreground text-xs">
            Connect your repository so AI can create pull requests from
            feedback.
          </p>
        </div>

        <CardFrame>
          <Card className="border-none shadow-md">
            <CardPanel className="space-y-5">
              <GitHubConfigSection organizationId={organization.id} />
            </CardPanel>
          </Card>
          <CardFrameFooter>
            <p className="text-muted-foreground text-xs">
              The Routine connects to your GitHub repos directly via claude.ai.
              Configure the repository name and branch below.
            </p>
          </CardFrameFooter>
        </CardFrame>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Claude Code Routine Config
 * ───────────────────────────────────────────── */

function RoutineConfigSection({ organizationId }: { organizationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [urlInput, setUrlInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  const { data: apiKeys } = useQuery(
    trpc.automation.getApiKeyStatus.queryOptions({ organizationId })
  );

  const saveMutation = useMutation(
    trpc.automation.saveApiKey.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const deleteMutation = useMutation(
    trpc.automation.deleteApiKey.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const hasUrl = apiKeys?.some((k) => k.provider === "routine_url");
  const hasToken = apiKeys?.some((k) => k.provider === "routine_token");
  const isConnected = hasUrl && hasToken;

  const handleSave = async () => {
    if (urlInput) {
      await saveMutation.mutateAsync({
        organizationId,
        provider: "routine_url",
        key: urlInput,
      });
    }
    if (tokenInput) {
      await saveMutation.mutateAsync({
        organizationId,
        provider: "routine_token",
        key: tokenInput,
      });
    }
    setUrlInput("");
    setTokenInput("");
    toast.success("Routine credentials saved");
  };

  const handleDisconnect = async () => {
    await deleteMutation.mutateAsync({
      organizationId,
      provider: "routine_url",
    });
    await deleteMutation.mutateAsync({
      organizationId,
      provider: "routine_token",
    });
    toast.success("Routine disconnected");
  };

  return (
    <section className="space-y-4">
      <div>
        <h4 className="font-medium text-sm">Claude Code Routine</h4>
        <p className="text-muted-foreground text-xs">
          Connect your Claude Code Routine to automate PR generation. Create a
          Routine at{" "}
          <a
            className="text-primary hover:underline"
            href="https://claude.ai/code/routines"
            rel="noopener noreferrer"
            target="_blank"
          >
            claude.ai/code/routines
          </a>
          , add an API trigger, and paste the URL and token below.
        </p>
      </div>

      <CardFrame>
        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Routine API</CardTitle>
              {isConnected ? (
                <Badge variant="outline">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not connected</Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Your Routine runs on your own Claude account. We fire it with
              feedback context and it creates PRs.
            </CardDescription>
          </CardHeader>

          <CardPanel className="space-y-4">
            <Field>
              <FieldLabel>API URL</FieldLabel>
              <Input
                className="font-mono text-sm"
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={
                  hasUrl
                    ? "Enter new URL to replace..."
                    : "https://api.anthropic.com/v1/claude_code/routines/trig_.../fire"
                }
                value={urlInput}
              />
              <FieldDescription>
                The /fire endpoint URL from your Routine&apos;s API trigger.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel>API Token</FieldLabel>
              <Input
                className="font-mono text-sm"
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={
                  hasToken
                    ? "Enter new token to replace..."
                    : "sk-ant-oat01-..."
                }
                type="password"
                value={tokenInput}
              />
              <FieldDescription>
                The bearer token generated for your API trigger.
              </FieldDescription>
            </Field>

            <div className="flex items-center gap-2">
              <Button
                disabled={!(urlInput || tokenInput) || saveMutation.isPending}
                onClick={handleSave}
                size="sm"
              >
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
              {isConnected && (
                <Button
                  disabled={deleteMutation.isPending}
                  onClick={handleDisconnect}
                  size="sm"
                  variant="outline"
                >
                  {deleteMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              )}
            </div>
          </CardPanel>
        </Card>
        <CardFrameFooter>
          <p className="text-muted-foreground text-xs">
            Create a Routine with an API trigger, add your GitHub repo, and
            write a prompt that implements features and creates PRs.
          </p>
        </CardFrameFooter>
      </CardFrame>
    </section>
  );
}

/* ─────────────────────────────────────────────
 * GitHub Repository Config
 * ───────────────────────────────────────────── */

function GitHubConfigSection({ organizationId }: { organizationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [repoInput, setRepoInput] = useState("");
  const [branchInput, setBranchInput] = useState("main");

  const { data: config } = useQuery(
    trpc.automation.getGithubConfig.queryOptions({ organizationId })
  );

  const currentRepo = repoInput || config?.repoFullName || "";
  const currentBranch = branchInput || config?.defaultBranch || "main";

  const saveMutation = useMutation(
    trpc.automation.saveGithubConfig.mutationOptions({
      onSuccess: () => {
        toast.success("GitHub repository saved");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const validateMutation = useMutation(
    trpc.automation.validateGithubAccess.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Access verified for ${data.repoFullName}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  return (
    <div className="space-y-4">
      <span className="font-medium text-sm">Repository</span>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Owner / Repo</FieldLabel>
          <Input
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="acme/my-app"
            value={currentRepo}
          />
          <FieldDescription>e.g. acme/my-app</FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Default Branch</FieldLabel>
          <Input
            onChange={(e) => setBranchInput(e.target.value)}
            placeholder="main"
            value={currentBranch}
          />
          <FieldDescription>Branch PRs are created against.</FieldDescription>
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Button
          disabled={!currentRepo || saveMutation.isPending}
          onClick={() =>
            saveMutation.mutate({
              organizationId,
              repoFullName: currentRepo,
              defaultBranch: currentBranch,
            })
          }
          size="sm"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
        <Button
          disabled={validateMutation.isPending}
          onClick={() => validateMutation.mutate({ organizationId })}
          size="sm"
          variant="outline"
        >
          {validateMutation.isPending ? "Validating..." : "Validate Access"}
        </Button>
      </div>
    </div>
  );
}
