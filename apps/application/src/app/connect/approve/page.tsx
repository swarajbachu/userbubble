"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTRPC } from "~/trpc/react";

function Approval() {
  const params = useSearchParams();
  const trpc = useTRPC();
  const agentId = params.get("agent_id") ?? "";
  const code = params.get("code") ?? "";
  const request = useQuery(
    trpc.approval.get.queryOptions(
      { agentId, code },
      { enabled: Boolean(agentId && code) }
    )
  );
  const respond = useMutation(trpc.approval.respond.mutationOptions());
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-5">
      <section className="w-full rounded-xl border bg-card p-6">
        <p className="text-muted-foreground text-xs">
          UserBubble · Agent connection
        </p>
        <h1 className="mt-2 font-semibold text-xl">
          {respond.isSuccess ? "Request handled" : "Review agent access"}
        </h1>
        {respond.isSuccess ? (
          <p className="mt-3 text-muted-foreground text-sm">
            Return to your agent to continue. You can revoke access in Settings.
          </p>
        ) : (
          <>
            {request.isPending && (
              <p className="mt-4 text-sm" role="status">
                Loading request…
              </p>
            )}
            {(!(agentId && code) || request.isError) && (
              <p className="mt-4 text-sm" role="alert">
                This request is invalid or has expired. Start a new connection
                from your agent.
              </p>
            )}
            {request.data && (
              <>
                <p className="mt-3 text-sm">
                  <strong>{request.data.name}</strong> is requesting the
                  following permissions for 24 hours. Check that this is the
                  connection you started.
                </p>
                <code className="my-4 block rounded-md bg-muted px-3 py-2 text-center tracking-widest">
                  {code}
                </code>
                <ul className="max-h-72 space-y-2 overflow-auto rounded-lg border p-3">
                  {request.data.grants.map((grant) => (
                    <li className="text-sm" key={grant.capability}>
                      <span className="font-medium">{grant.capability}</span>
                      <span className="block break-all text-muted-foreground text-xs">
                        {grant.constraints}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    disabled={respond.isPending}
                    onClick={() =>
                      respond.mutate({ agentId, code, action: "deny" })
                    }
                    variant="outline"
                  >
                    Deny
                  </Button>
                  <Button
                    disabled={respond.isPending}
                    onClick={() =>
                      respond.mutate({ agentId, code, action: "approve" })
                    }
                  >
                    {respond.isPending ? "Saving…" : "Allow access"}
                  </Button>
                </div>
              </>
            )}
            {respond.isError && (
              <p className="mt-3 text-destructive text-sm" role="alert">
                Could not save your decision. Please try again.
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
export default function Page() {
  return (
    <Suspense>
      <Approval />
    </Suspense>
  );
}
