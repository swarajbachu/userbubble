"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@userbubble/db/schema";
import { Badge } from "@userbubble/ui/badge";
import { Button } from "@userbubble/ui/button";
import { Field, FieldDescription, FieldLabel } from "@userbubble/ui/field";
import { Input } from "@userbubble/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type IntegrationsTabProps = {
  organization: Organization;
};

export function IntegrationsTab({ organization }: IntegrationsTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 font-semibold text-lg">Integrations</h3>
        <p className="text-muted-foreground text-sm">
          Configure API keys and repository access for AI-powered PR generation.
        </p>
      </div>

      <ApiKeySection
        description="Required for AI-powered code generation. Get your key from the Anthropic Console."
        label="Anthropic API Key"
        organizationId={organization.id}
        provider="anthropic"
      />

      <div className="border-t pt-6">
        <CodexOAuthSection organizationId={organization.id} />
      </div>

      <div className="border-t pt-6">
        <ApiKeySection
          description="Fine-grained PAT with Contents and Pull Requests permissions. Create one in GitHub Settings > Developer settings."
          label="GitHub Personal Access Token"
          organizationId={organization.id}
          provider="github"
        />
      </div>

      <div className="border-t pt-6">
        <GitHubConfigSection organizationId={organization.id} />
      </div>
    </div>
  );
}

function CodexOAuthSection({ organizationId }: { organizationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: oauthStatus } = useQuery({
    ...trpc.automation.getOAuthConnectionStatus.queryOptions({
      organizationId,
      provider: "codex",
    }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 5s while pending
      if (status === "pending") {
        return 5000;
      }
      return false;
    },
  });

  const initiateMutation = useMutation(
    trpc.automation.initiateOAuthConnection.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const disconnectMutation = useMutation(
    trpc.automation.disconnectOAuth.mutationOptions({
      onSuccess: () => {
        toast.success("OpenAI disconnected");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const status = oauthStatus?.status;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm">Or connect with OpenAI (Codex)</h4>
        {status === "active" && <Badge variant="outline">Connected</Badge>}
        {status === "pending" && <Badge variant="secondary">Pending</Badge>}
      </div>
      <p className="text-muted-foreground text-xs">
        Use your ChatGPT Pro/Plus subscription instead of an Anthropic API key.
      </p>

      {status === "active" && (
        <div className="flex items-center gap-2">
          {"accountId" in (oauthStatus ?? {}) && oauthStatus?.accountId && (
            <span className="font-mono text-muted-foreground text-xs">
              Account: {oauthStatus.accountId.slice(0, 12)}...
            </span>
          )}
          <Button
            disabled={disconnectMutation.isPending}
            onClick={() =>
              disconnectMutation.mutate({
                organizationId,
                provider: "codex",
              })
            }
            size="sm"
            variant="outline"
          >
            {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      )}

      {status === "pending" && oauthStatus && (
        <div className="space-y-2">
          {"userCode" in oauthStatus && oauthStatus.userCode && (
            <div className="rounded-md border bg-muted/50 p-4">
              <p className="mb-1 text-muted-foreground text-xs">
                Enter this code at the link below:
              </p>
              <p className="font-mono text-2xl tracking-widest">
                {oauthStatus.userCode}
              </p>
            </div>
          )}
          {"verificationUri" in oauthStatus && oauthStatus.verificationUri && (
            <a
              className="text-blue-500 text-sm hover:underline"
              href={oauthStatus.verificationUri}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open authorization page
            </a>
          )}
          <p className="animate-pulse text-muted-foreground text-xs">
            Waiting for authorization...
          </p>
        </div>
      )}

      {(status === "not_connected" ||
        status === "expired" ||
        status === "denied" ||
        !status) && (
        <div className="space-y-2">
          {(status === "expired" || status === "denied") && (
            <p className="text-destructive text-xs">
              {status === "expired"
                ? "Authorization expired. Please try again."
                : "Authorization was denied. Please try again."}
            </p>
          )}
          <Button
            disabled={initiateMutation.isPending}
            onClick={() =>
              initiateMutation.mutate({
                organizationId,
                provider: "codex",
              })
            }
            size="sm"
            variant="outline"
          >
            {initiateMutation.isPending ? "Connecting..." : "Connect OpenAI"}
          </Button>
        </div>
      )}
    </div>
  );
}

function ApiKeySection({
  label,
  description,
  organizationId,
  provider,
}: {
  label: string;
  description: string;
  organizationId: string;
  provider: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [keyInput, setKeyInput] = useState("");

  const { data: apiKeys } = useQuery(
    trpc.automation.getApiKeyStatus.queryOptions({ organizationId })
  );

  const saveMutation = useMutation(
    trpc.automation.saveApiKey.mutationOptions({
      onSuccess: () => {
        toast.success(`${label} saved`);
        setKeyInput("");
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
        toast.success(`${label} removed`);
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const configured = apiKeys?.find((k) => k.provider === provider);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm">{label}</h4>
        {configured ? (
          <Badge variant="outline">Configured (...{configured.keyHint})</Badge>
        ) : (
          <Badge variant="secondary">Not configured</Badge>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{description}</p>

      <div className="flex items-center gap-2">
        <Input
          className="flex-1 font-mono text-sm"
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={
            configured ? "Enter new key to replace..." : "Enter API key..."
          }
          type="password"
          value={keyInput}
        />
        <Button
          disabled={!keyInput || saveMutation.isPending}
          onClick={() =>
            saveMutation.mutate({
              organizationId,
              provider,
              key: keyInput,
            })
          }
          size="sm"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
        {configured && (
          <Button
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ organizationId, provider })}
            size="sm"
            variant="outline"
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

function GitHubConfigSection({ organizationId }: { organizationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [repoInput, setRepoInput] = useState("");
  const [branchInput, setBranchInput] = useState("main");

  const { data: config } = useQuery(
    trpc.automation.getGithubConfig.queryOptions({ organizationId })
  );

  // Initialize inputs from existing config
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
      <div>
        <h4 className="font-medium text-sm">GitHub Repository</h4>
        <p className="text-muted-foreground text-xs">
          The repository where PRs will be created.
        </p>
      </div>

      <Field>
        <FieldLabel>Repository</FieldLabel>
        <Input
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="owner/repo"
          value={currentRepo}
        />
        <FieldDescription>
          Format: owner/repo (e.g., acme/my-app)
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Default Branch</FieldLabel>
        <Input
          onChange={(e) => setBranchInput(e.target.value)}
          placeholder="main"
          value={currentBranch}
        />
        <FieldDescription>
          The branch to create PRs against (usually main or master).
        </FieldDescription>
      </Field>

      <div className="flex items-center gap-2 pt-2">
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
