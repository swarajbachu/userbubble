"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import { Input } from "@userbubble/ui/input";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

const HTTP_URL = /^https?:\/\//;

export function ImplementationLinks({
  organizationId,
  postId,
}: {
  organizationId: string;
  postId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const options = trpc.reference.list.queryOptions({ organizationId, postId });
  const references = useQuery(options);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: options.queryKey });
  const add = useMutation(
    trpc.reference.add.mutationOptions({
      onSuccess: async () => {
        await refresh();
        setEditing(false);
        setTitle("");
        setUrl("");
      },
    })
  );
  const remove = useMutation(
    trpc.reference.delete.mutationOptions({ onSuccess: refresh })
  );

  return (
    <section aria-label="Implementation links" className="space-y-3 px-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-sm">Implementation links</h2>
        <Button
          onClick={() => {
            setEditing(!editing);
            add.reset();
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          {editing ? "Cancel" : "Add link"}
        </Button>
      </div>
      {references.isPending && (
        <p className="text-muted-foreground text-xs">Loading links…</p>
      )}
      {references.isError && (
        <div className="text-sm" role="alert">
          <p>Could not load implementation links.</p>
          <Button
            onClick={() => references.refetch()}
            size="sm"
            variant="ghost"
          >
            Try again
          </Button>
        </div>
      )}
      {references.data?.length === 0 && (
        <p className="text-muted-foreground text-xs">
          Attach a pull request or implementation notes.
        </p>
      )}
      {references.data?.map((reference) => (
        <div className="flex min-w-0 items-center gap-2" key={reference.id}>
          {HTTP_URL.test(reference.url) ? (
            <a
              className="min-w-0 flex-1 truncate rounded-sm text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              href={reference.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {reference.title}
            </a>
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm">
              {reference.title}
            </span>
          )}
          <Button
            aria-label={`Remove ${reference.title}`}
            disabled={remove.isPending}
            onClick={() => remove.mutate({ organizationId, id: reference.id })}
            size="sm"
            variant="ghost"
          >
            Remove
          </Button>
        </div>
      ))}
      {remove.isError && (
        <p className="text-destructive text-xs" role="alert">
          {remove.error.message}
        </p>
      )}
      {editing && (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            add.mutate({ organizationId, postId, title: title.trim(), url });
          }}
        >
          <Input
            aria-label="Link title"
            disabled={add.isPending}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Pull request title"
            required
            value={title}
          />
          <Input
            aria-label="Implementation URL"
            disabled={add.isPending}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            required
            type="url"
            value={url}
          />
          {add.isError && (
            <p className="text-destructive text-xs" role="alert">
              {add.error.message}
            </p>
          )}
          <Button
            disabled={add.isPending || !title.trim() || !url}
            size="sm"
            type="submit"
          >
            {add.isPending ? "Saving…" : "Save link"}
          </Button>
        </form>
      )}
    </section>
  );
}
