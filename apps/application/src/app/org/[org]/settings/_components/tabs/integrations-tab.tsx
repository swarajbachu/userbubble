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
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");

  const { data: oauthStatus } = useQuery(
    trpc.automation.getOAuthConnectionStatus.queryOptions({
      organizationId,
      provider: "codex",
    })
  );

  const initiateMutation = useMutation(
    trpc.automation.initiateOAuthConnection.mutationOptions({
      onSuccess: (data) => {
        setAuthUrl(data.authUrl);
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const completeMutation = useMutation(
    trpc.automation.completeOAuthConnection.mutationOptions({
      onSuccess: () => {
        toast.success("OpenAI connected successfully");
        setAuthUrl(null);
        setCallbackUrl("");
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
        setAuthUrl(null);
        setCallbackUrl("");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const status = oauthStatus?.status;
  const showAuthFlow = authUrl && status !== "active";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm">Or connect with OpenAI (Codex)</h4>
        {status === "active" && <Badge variant="outline">Connected</Badge>}
        {showAuthFlow && <Badge variant="secondary">Pending</Badge>}
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

      {showAuthFlow && (
        <div className="space-y-3">
          <div className="space-y-2 rounded-md border bg-muted/50 p-4">
            <p className="font-medium text-sm">Step 1: Sign in at OpenAI</p>
            <a
              className="break-all text-blue-500 text-sm hover:underline"
              href={authUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open authorization page
            </a>
          </div>

          <div className="space-y-2 rounded-md border bg-muted/50 p-4">
            <p className="font-medium text-sm">
              Step 2: Paste the redirect URL
            </p>
            <p className="text-muted-foreground text-xs">
              After signing in, your browser will redirect to a localhost URL
              that won't load — that's expected. Copy the full URL from your
              browser's address bar and paste it here.
            </p>
            <div className="flex items-center gap-2">
              <Input
                className="flex-1 font-mono text-xs"
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="http://localhost:1455/auth/callback?code=..."
                value={callbackUrl}
              />
              <Button
                disabled={!callbackUrl || completeMutation.isPending}
                onClick={() =>
                  completeMutation.mutate({
                    organizationId,
                    provider: "codex",
                    callbackUrl,
                  })
                }
                size="sm"
              >
                {completeMutation.isPending ? "Connecting..." : "Complete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showAuthFlow && status !== "active" && (
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
