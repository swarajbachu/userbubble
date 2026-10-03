"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "~/auth/client";

function Consent() {
  const params = useSearchParams();
  const { data: workspace } = authClient.useActiveOrganization();
  const clientId = params.get("client_id") ?? "";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const client = useQuery({
    queryKey: ["oauth-client", clientId],
    queryFn: async () => {
      const response = await fetch(
        `/api/auth/oauth2/public-client?client_id=${encodeURIComponent(clientId)}`
      );
      if (!response.ok) {
        throw new Error("Invalid connection request");
      }
      return response.json() as Promise<{ client_name?: string }>;
    },
    enabled: Boolean(clientId),
  });
  async function respond(accept: boolean) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept, oauth_query: params.toString() }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(
          "Could not save your decision. Start a new connection from your agent."
        );
      }
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection failed");
      setPending(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5">
      <section className="w-full rounded-xl border bg-card p-6">
        <p className="text-muted-foreground text-xs">
          UserBubble · Review access
        </p>
        <h1 className="mt-2 font-semibold text-xl">
          Connect {client.data?.client_name || "your agent"}
        </h1>
        <p className="mt-3 text-sm">
          This agent can manage feedback, replies, roadmap, changelog,
          appearance, and workspace settings using your current permissions.
          Owner permissions include destructive actions. Access is limited to
          the workspace shown below.
        </p>
        <p className="mt-3 text-muted-foreground text-sm">
          Only approve a connection you started. You can revoke it at any time
          in Settings → Connected agents.
        </p>
        <div className="mt-4 flex items-center justify-between rounded-lg border p-3 text-sm">
          <span>{workspace?.name || "Loading workspace…"}</span>
          <Link
            className="underline underline-offset-4"
            href={`/connect/workspace?${params.toString()}`}
          >
            Change
          </Link>
        </div>
        <code className="mt-4 block break-all rounded-md bg-muted p-3 text-xs">
          {clientId}
        </code>
        {client.isFetching && (
          <p className="mt-3 text-sm" role="status">
            Checking request…
          </p>
        )}
        {(error || !clientId || client.isError) && (
          <p className="mt-3 text-destructive text-sm" role="alert">
            {error || "Invalid connection request"}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            disabled={pending || !client.data}
            onClick={() => respond(false)}
            variant="outline"
          >
            Deny
          </Button>
          <Button
            disabled={pending || !client.data}
            onClick={() => respond(true)}
          >
            {pending ? "Saving…" : "Allow access"}
          </Button>
        </div>
      </section>
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Consent />
    </Suspense>
  );
}
