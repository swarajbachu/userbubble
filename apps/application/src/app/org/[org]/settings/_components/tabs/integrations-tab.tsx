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
import { Switch } from "@userbubble/ui/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type IntegrationsTabProps = {
  organization: Organization;
  settings: OrganizationSettings;
};

export function IntegrationsTab({
  organization,
  settings,
}: IntegrationsTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold text-lg">AI Integration</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Connect AI providers and configure automated workflows for your
          feedback pipeline.
        </p>
      </div>

      {/* --- AI Providers --- */}
      <section className="space-y-4">
        <div>
          <h4 className="font-medium text-sm">AI Providers</h4>
          <p className="text-muted-foreground text-xs">
            Connect at least one AI provider to power code generation and
            triage.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ApiKeyCard
            description="Powers AI triage and code generation."
            label="Anthropic"
            organizationId={organization.id}
            placeholder="sk-ant-..."
            provider="anthropic"
          />

          <CodexOAuthCard organizationId={organization.id} />
        </div>
      </section>

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
              <ApiKeyInline
                description="Fine-grained PAT with Contents and Pull Requests permissions."
                label="Personal Access Token"
                organizationId={organization.id}
                placeholder="ghp_..."
                provider="github"
              />

              <Separator />

              <GitHubConfigSection organizationId={organization.id} />
            </CardPanel>
          </Card>
          <CardFrameFooter>
            <p className="text-muted-foreground text-xs">
              Create a fine-grained PAT in GitHub Settings &rarr; Developer
              settings &rarr; Personal access tokens.
            </p>
          </CardFrameFooter>
        </CardFrame>
      </section>

      <Separator />

      {/* --- Repo Analysis --- */}
      <RepoAnalysisSection organizationId={organization.id} />

      <Separator />

      {/* --- Automation --- */}
      <AutomationTogglesSection
        organizationId={organization.id}
        settings={settings}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
 * API Key Card  (used for Anthropic provider)
 * ───────────────────────────────────────────── */

function ApiKeyCard({
  label,
  description,
  organizationId,
  provider,
  placeholder,
}: {
  label: string;
  description: string;
  organizationId: string;
  provider: string;
  placeholder: string;
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
        toast.success(`${label} key saved`);
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
        toast.success(`${label} key removed`);
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const configured = apiKeys?.find((k) => k.provider === provider);

  return (
    <CardFrame>
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">{label}</CardTitle>
            {configured ? (
              <Badge variant="outline">
                Connected &middot; ...{configured.keyHint}
              </Badge>
            ) : (
              <Badge variant="secondary">Not connected</Badge>
            )}
          </div>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardPanel className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              className="flex-1 font-mono text-sm"
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={
                configured ? "Enter new key to replace..." : placeholder
              }
              type="password"
              value={keyInput}
            />
            <Button
              disabled={!keyInput || saveMutation.isPending}
              onClick={() =>
                saveMutation.mutate({ organizationId, provider, key: keyInput })
              }
              size="sm"
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardPanel>
      </Card>
      {configured && (
        <CardFrameFooter>
          <Button
            className="w-full"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ organizationId, provider })}
            size="sm"
            variant="outline"
          >
            {deleteMutation.isPending ? "Removing..." : "Remove Key"}
          </Button>
        </CardFrameFooter>
      )}
    </CardFrame>
  );
}

/* ─────────────────────────────────────────────
 * Codex / OpenAI OAuth Card
 * ───────────────────────────────────────────── */

function CodexOAuthCard({ organizationId }: { organizationId: string }) {
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
    <CardFrame>
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">OpenAI (Codex)</CardTitle>
            {status === "active" && <Badge variant="outline">Connected</Badge>}
            {showAuthFlow && <Badge variant="secondary">Pending</Badge>}
            {!(status || showAuthFlow) && (
              <Badge variant="secondary">Not connected</Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Use your ChatGPT Pro/Plus subscription instead of an API key.
          </CardDescription>
        </CardHeader>

        <CardPanel className="space-y-3">
          {/* Connected state */}
          {status === "active" && (
            <div className="flex items-center justify-between gap-2">
              {"accountId" in (oauthStatus ?? {}) && oauthStatus?.accountId && (
                <span className="truncate font-mono text-muted-foreground text-xs">
                  {oauthStatus.accountId.slice(0, 12)}...
                </span>
              )}
              <Button
                className="ml-auto"
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
                {disconnectMutation.isPending
                  ? "Disconnecting..."
                  : "Disconnect"}
              </Button>
            </div>
          )}

          {/* Auth flow in progress */}
          {showAuthFlow && (
            <div className="space-y-3">
              <div className="space-y-1.5 rounded-lg border bg-muted/50 p-3">
                <p className="font-medium text-xs">Step 1 &mdash; Sign in</p>
                <a
                  className="text-primary text-xs hover:underline"
                  href={authUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open authorization page
                </a>
              </div>

              <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                <p className="font-medium text-xs">
                  Step 2 &mdash; Paste redirect URL
                </p>
                <p className="text-[11px] text-muted-foreground">
                  After signing in, copy the localhost URL from your browser and
                  paste it here.
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
                    {completeMutation.isPending ? "..." : "Complete"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Initial state */}
          {!showAuthFlow && status !== "active" && (
            <Button
              className="w-full"
              disabled={initiateMutation.isPending}
              onClick={() =>
                initiateMutation.mutate({ organizationId, provider: "codex" })
              }
              size="sm"
              variant="outline"
            >
              {initiateMutation.isPending ? "Connecting..." : "Connect OpenAI"}
            </Button>
          )}
        </CardPanel>
      </Card>
      <CardFrameFooter>
        <p className="text-muted-foreground text-xs">
          Requires a ChatGPT Pro or Plus subscription.
        </p>
      </CardFrameFooter>
    </CardFrame>
  );
}

/* ─────────────────────────────────────────────
 * Inline API Key  (used inside the GitHub card)
 * ───────────────────────────────────────────── */

function ApiKeyInline({
  label,
  description,
  organizationId,
  provider,
  placeholder,
}: {
  label: string;
  description: string;
  organizationId: string;
  provider: string;
  placeholder: string;
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
        <span className="font-medium text-sm">{label}</span>
        {configured ? (
          <Badge variant="outline">...{configured.keyHint}</Badge>
        ) : (
          <Badge variant="secondary">Not set</Badge>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{description}</p>

      <div className="flex items-center gap-2">
        <Input
          className="flex-1 font-mono text-sm"
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={
            configured ? "Enter new token to replace..." : placeholder
          }
          type="password"
          value={keyInput}
        />
        <Button
          disabled={!keyInput || saveMutation.isPending}
          onClick={() =>
            saveMutation.mutate({ organizationId, provider, key: keyInput })
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

/* ─────────────────────────────────────────────
 * Repo Analysis
 * ───────────────────────────────────────────── */

function RepoAnalysisSection({ organizationId }: { organizationId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: analysis } = useQuery({
    ...trpc.automation.getRepoAnalysisStatus.queryOptions({ organizationId }),
    refetchInterval: (query) => {
      const status = query.state.data?.analysisStatus;
      return status === "pending" || status === "analyzing" ? 3000 : false;
    },
  });

  const analyzeMutation = useMutation(
    trpc.automation.analyzeRepo.mutationOptions({
      onSuccess: () => {
        toast.success("Repo analysis started");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const isAnalyzing =
    analysis?.analysisStatus === "pending" ||
    analysis?.analysisStatus === "analyzing";

  return (
    <section className="space-y-4">
      <div>
        <h4 className="font-medium text-sm">Repo Analysis</h4>
        <p className="text-muted-foreground text-xs">
          AI analyzes your repository to understand the project structure and
          tech stack. This helps AI make better decisions when triaging feedback
          and generating PRs.
        </p>
      </div>

      <CardFrame>
        <Card className="border-none shadow-md">
          <CardPanel className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                disabled={isAnalyzing || analyzeMutation.isPending}
                onClick={() => analyzeMutation.mutate({ organizationId })}
                size="sm"
              >
                {isAnalyzing && "Analyzing..."}
                {!isAnalyzing && analysis?.projectContext && "Re-analyze"}
                {!(isAnalyzing || analysis?.projectContext) && "Analyze Repo"}
              </Button>
              {analysis?.analysisStatus && (
                <Badge
                  variant={(() => {
                    if (analysis.analysisStatus === "completed") {
                      return "outline";
                    }
                    if (analysis.analysisStatus === "failed") {
                      return "destructive";
                    }
                    return "secondary";
                  })()}
                >
                  {analysis.analysisStatus}
                </Badge>
              )}
            </div>

            {analysis?.analysisError && (
              <p className="text-destructive text-xs">
                {analysis.analysisError}
              </p>
            )}

            {analysis?.projectContext && (
              <div className="max-h-64 overflow-y-auto rounded-lg border bg-muted/50 p-4">
                <pre className="whitespace-pre-wrap text-xs">
                  {analysis.projectContext}
                </pre>
              </div>
            )}
          </CardPanel>
        </Card>
        {analysis?.projectContextUpdatedAt && (
          <CardFrameFooter>
            <p className="text-muted-foreground text-xs">
              Last analyzed:{" "}
              {new Date(analysis.projectContextUpdatedAt).toLocaleDateString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }
              )}
            </p>
          </CardFrameFooter>
        )}
      </CardFrame>
    </section>
  );
}

/* ─────────────────────────────────────────────
 * Automation Toggles  (Switch instead of checkbox)
 * ───────────────────────────────────────────── */

function AutomationTogglesSection({
  organizationId,
  settings,
}: {
  organizationId: string;
  settings: OrganizationSettings;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [autoTriage, setAutoTriage] = useState(
    settings.automation?.enableAutoTriage ?? false
  );
  const [autoImplement, setAutoImplement] = useState(
    settings.automation?.enableAutoImplement ?? false
  );

  useEffect(() => {
    setAutoTriage(settings.automation?.enableAutoTriage ?? false);
    setAutoImplement(settings.automation?.enableAutoImplement ?? false);
  }, [
    settings.automation?.enableAutoTriage,
    settings.automation?.enableAutoImplement,
  ]);

  const updateMutation = useMutation(
    trpc.settings.updateSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Automation settings saved");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const saveAutomation = (triage: boolean, implement: boolean) => {
    updateMutation.mutate({
      organizationId,
      settings: {
        automation: {
          enableAutoTriage: triage,
          enableAutoImplement: implement,
        },
      },
    });
  };

  return (
    <section className="space-y-4">
      <div>
        <h4 className="font-medium text-sm">Automation</h4>
        <p className="text-muted-foreground text-xs">
          Control how AI automatically handles incoming feedback.
        </p>
      </div>

      <CardFrame>
        <Card className="border-none shadow-md">
          <CardPanel className="space-y-1">
            <Field className="flex flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <FieldLabel>Auto-triage new feedback</FieldLabel>
                <FieldDescription>
                  AI will analyze new feedback posts and ask clarifying
                  questions or decide to implement.
                </FieldDescription>
              </div>
              <Switch
                checked={autoTriage}
                onCheckedChange={(value) => {
                  setAutoTriage(value);
                  saveAutomation(value, autoImplement);
                }}
              />
            </Field>

            <Separator />

            <Field className="flex flex-row items-start justify-between gap-4">
              <div className="flex-1">
                <FieldLabel>Auto-implementation</FieldLabel>
                <FieldDescription>
                  When AI decides feedback is actionable, automatically trigger
                  PR generation without a human gate.
                </FieldDescription>
              </div>
              <Switch
                checked={autoImplement}
                onCheckedChange={(value) => {
                  setAutoImplement(value);
                  saveAutomation(autoTriage, value);
                }}
              />
            </Field>
          </CardPanel>
        </Card>
        <CardFrameFooter>
          <p className="text-muted-foreground text-xs">
            Changes are saved automatically when toggled.
          </p>
        </CardFrameFooter>
      </CardFrame>
    </section>
  );
}
