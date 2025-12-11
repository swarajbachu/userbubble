"use client";

import { cn } from "@critichut/ui";
import { Button } from "@critichut/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { memo } from "react";

type VoteButtonProps = {
  voteCount: number;
  hasVoted: boolean;
  onVote: () => void;
  className?: string;
};

// biome-ignore lint/nursery/noShadow: memo function pattern
export const VoteButton = memo(function VoteButton({
  voteCount,
  hasVoted,
  onVote,
  className,
}: VoteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onVote();
  };

  return (
    <Button
      className={cn("flex h-auto items-center gap-1.5 px-3 py-1", className)}
      onClick={handleClick}
      size="sm"
      variant={hasVoted ? "default" : "secondary"}
    >
      <HugeiconsIcon
        className={cn(hasVoted && "fill-current")}
        icon={ArrowUp01Icon}
        size={16}
        strokeWidth={2}
      />
      <span className="font-medium text-xs">{voteCount}</span>
    </Button>
  );
});
