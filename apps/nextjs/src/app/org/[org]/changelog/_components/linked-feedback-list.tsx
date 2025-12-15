import { Icon } from "@critichut/ui/icon";
import {
  CheckmarkBadge01Icon,
  Link03Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import Link from "next/link";

type LinkedFeedbackListProps = {
  feedback: Array<{ id: string; title: string }>;
  org: string;
};

export function LinkedFeedbackList({ feedback, org }: LinkedFeedbackListProps) {
  if (!feedback || feedback.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon icon={CheckmarkBadge01Icon} size={16} />
        <span className="font-medium">Resolved feedback</span>
      </div>

      <div className="space-y-1.5">
        {feedback.map((post) => (
          <Link
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
            href={`/org/${org}/feedback/${post.id}`}
            key={post.id}
          >
            <Icon
              className="shrink-0 text-muted-foreground"
              icon={Link03Icon}
              size={14}
            />
            <span className="min-w-0 flex-1 truncate">{post.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
