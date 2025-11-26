"use client";

import { Button } from "@critichut/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { useTRPC } from "~/trpc/react";
import { NewPostModal } from "./new-post-modal";

type NewPostButtonProps = {
  org: string;
};

export function NewPostButton({ org }: NewPostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();

  const { data: orgData } = useSuspenseQuery(
    trpc.organization.getBySlug.queryOptions({
      slug: org,
    })
  );

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        New Feedback
      </Button>

      <NewPostModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        organizationId={orgData.id}
      />
    </>
  );
}
