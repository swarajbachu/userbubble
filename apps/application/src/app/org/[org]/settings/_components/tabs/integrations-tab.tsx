"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Organization, OrganizationSettings } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

export function IntegrationsTab({
  organization,
}: {
  organization: Omit<Organization, "secretKey">;
  settings: OrganizationSettings;
}) {
  const trpc = useTRPC();
  const client = useQueryClient();
  const agents = useQuery(trpc.connection.list.queryOptions({}));
  const oauth = useQuery(trpc.connection.listOAuth.queryOptions({}));
  const invalidate = () => {
    client.invalidateQueries({ queryKey: trpc.connection.pathKey() });
    toast.success("Connection revoked");
  };
  const revoke = useMutation(
    trpc.connection.revoke.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Could not revoke access"),
    })
  );
  const revokeOAuth = useMutation(
    trpc.connection.revokeOAuth.mutationOptions({
      onSuccess: invalidate,
      onError: () => toast.error("Could not revoke access"),
    })
  );
  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="font-semibold text-base">Connected agents</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Use your own agent to read feedback, reply to users, and manage your
          workspace.
        </p>
      </div>
      <div className="rounded-lg border p-4 text-sm">
        <p className="font-medium">Connect to UserBubble</p>
        <p className="mt-1 text-muted-foreground">
          Add your UserBubble address with the path <code>/api/mcp</code> to
          your agent, or connect with the UserBubble CLI. Select this workspace
          when approving access.
        </p>
        <code className="mt-3 block overflow-x-auto rounded-md bg-muted p-2 text-xs">
          {organization.id}
        </code>
        <a
          className="mt-3 inline-block underline underline-offset-4"
          href="/api/v2/capabilities"
          rel="noreferrer"
          target="_blank"
        >
          Browse available operations
        </a>
      </div>
      <p className="text-muted-foreground text-xs">
        Connections belong to your account. Agent Auth connections may have
        grants for multiple workspaces; revoking one removes all its grants.
      </p>
      {(agents.isPending || oauth.isPending) && (
        <p className="text-muted-foreground text-sm" role="status">
          Loading connections…
        </p>
      )}
      {(agents.isError || oauth.isError) && (
        <div className="flex items-center gap-3 text-sm" role="alert">
          <p>Connections could not be loaded.</p>
          <Button
            onClick={() => {
              agents.refetch();
              oauth.refetch();
            }}
            size="sm"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      )}
      {agents.data?.length === 0 && oauth.data?.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
          No agents connected yet. Your first connection will appear here.
        </div>
      )}
      <div className="divide-y rounded-lg border empty:hidden">
        {agents.data?.map((agent) => (
          <div
            className="flex items-start justify-between gap-4 p-3"
            key={agent.id}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{agent.name}</p>
              <p className="text-muted-foreground text-xs">
                Agent Auth · {agent.status}
              </p>
              <p className="mt-2 break-words text-muted-foreground text-xs">
                {agent.grants
                  .filter((grant) => grant.status === "active")
                  .map((grant) => grant.capability)
                  .join(", ") || "No active grants"}
              </p>
            </div>
            <Button
              disabled={agent.status !== "active" || revoke.isPending}
              onClick={() => revoke.mutate({ agentId: agent.id })}
              size="sm"
              variant="outline"
            >
              Revoke
            </Button>
          </div>
        ))}
        {oauth.data?.map((connection) => (
          <div
            className="flex items-start justify-between gap-4 p-3"
            key={connection.id}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">
                {connection.name || "MCP connection"}
              </p>
              <p className="text-muted-foreground text-xs">
                OAuth ·{" "}
                {connection.organizationId === organization.id
                  ? organization.name
                  : connection.organizationId}
              </p>
              <p className="mt-2 break-all text-muted-foreground text-xs">
                {connection.clientId}
              </p>
            </div>
            <Button
              disabled={revokeOAuth.isPending}
              onClick={() => revokeOAuth.mutate({ consentId: connection.id })}
              size="sm"
              variant="outline"
            >
              Revoke
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
