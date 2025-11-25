"use client";

import { Button } from "@critichut/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { NewPostModal } from "./new-post-modal";

type NewPostButtonProps = {
  org: string;
};

export function NewPostButton({ org }: NewPostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        New Feedback
      </Button>

      <NewPostModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        org={org}
      />
    </>
  );
}
