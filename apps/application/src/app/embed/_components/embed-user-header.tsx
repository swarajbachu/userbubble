"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import { useTRPC } from "~/trpc/react";

export function EmbedUserHeader() {
  const trpc = useTRPC();
  const { data: session } = useQuery(trpc.auth.getSession.queryOptions());

  if (!session?.user) {
    return null;
  }

  const { user } = session;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (user.email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="flex shrink-0 items-center gap-2.5 border-b px-3.5 py-2">
      <Avatar className="size-6">
        {user.image ? (
          <AvatarImage alt={user.name ?? "User"} src={user.image} />
        ) : null}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span className="truncate font-medium text-foreground text-xs">
        {user.name || user.email}
      </span>
    </div>
  );
}
