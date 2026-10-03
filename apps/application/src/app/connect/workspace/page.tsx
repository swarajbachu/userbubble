"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

function Workspace() {
  const params = useSearchParams();
  const trpc = useTRPC();
  const organizations = useQuery(trpc.organization.list.queryOptions({}));
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function select(organizationId: string) {
    setPending(organizationId);
    setError("");
    try {
      const active = await authClient.organization.setActive({
        organizationId,
      });
      if (active.error) {
        throw new Error(active.error.message);
      }
      const response = await fetch("/api/auth/oauth2/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postLogin: true,
          oauth_query: params.toString(),
        }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        throw new Error(
          "Could not continue this connection. Start again from your agent."
        );
      }
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Connection failed");
      setPending(null);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5">
      <section className="w-full rounded-xl border bg-card p-6">
        <p className="text-muted-foreground text-xs">
          UserBubble · Connect an agent
        </p>
        <h1 className="mt-2 font-semibold text-xl">Choose a workspace</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          This connection will only have access to the workspace you select.
        </p>
        {organizations.isPending && (
          <p className="mt-5 text-sm" role="status">
            Loading workspaces…
          </p>
        )}
        {(organizations.isError || error) && (
          <p className="mt-5 text-destructive text-sm" role="alert">
            {error || "Could not load workspaces. Please try again."}
          </p>
        )}
        <div className="mt-5 grid gap-2">
          {organizations.data?.map((org) => (
            <Button
              className="justify-between"
              disabled={pending !== null}
              key={org.id}
              onClick={() => select(org.id)}
              variant="outline"
            >
              <span>{org.name}</span>
              <span className="text-muted-foreground text-xs">
                {pending === org.id ? "Connecting…" : org.role}
              </span>
            </Button>
          ))}
        </div>
        {organizations.data?.length === 0 && (
          <p className="mt-5 text-sm">
            Create a workspace in UserBubble before connecting an agent.
          </p>
        )}
      </section>
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Workspace />
    </Suspense>
  );
}
