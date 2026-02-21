"use client";

import {
  MarketingIcon,
  Message01Icon,
  Route01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { CodeBlock, CopyButton, Section, StepSeparator } from "../step-section";

type StepShareBoardProps = {
  orgSlug: string;
  onDone: () => void;
  allComplete: boolean;
};

export function StepShareBoard({
  orgSlug,
  onDone,
  allComplete,
}: StepShareBoardProps) {
  const baseUrl = `https://${orgSlug}.userbubble.com`;

  const handleAction = () => {
    onDone();
  };

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Share these links with your users to start collecting feedback
      </p>

      <Section
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => {
                handleAction();
                window.open(`${baseUrl}/`, "_blank");
              }}
              size="sm"
              variant="outline"
            >
              Visit
            </Button>
            <CopyButton onCopy={handleAction} value={`${baseUrl}/`} />
          </div>
        }
        description="This link includes feedback, roadmap, and changelog all in one place"
        icon={Message01Icon}
        title="Feedback Board"
      >
        <CodeBlock code={`${baseUrl}/`} numbered />
      </Section>

      <StepSeparator />

      <Section
        action={
          <CopyButton onCopy={handleAction} value={`${baseUrl}/roadmap`} />
        }
        badge="Optional"
        description="Direct link to your roadmap if you want to link to it separately"
        icon={Route01Icon}
        title="Roadmap"
      >
        <CodeBlock code={`${baseUrl}/roadmap`} numbered />
      </Section>

      <StepSeparator />

      <Section
        action={
          <CopyButton onCopy={handleAction} value={`${baseUrl}/updates`} />
        }
        badge="Optional"
        description="Direct link to your changelog if you want to link to it separately"
        icon={MarketingIcon}
        title="Updates"
      >
        <CodeBlock code={`${baseUrl}/updates`} numbered />
      </Section>

      {allComplete && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-900 dark:bg-green-950/50">
          <p className="font-semibold text-green-800 text-lg dark:text-green-200">
            You're all set!
          </p>
          <p className="mt-1 text-green-600 text-sm dark:text-green-400">
            Your feedback board is ready to go. Start sharing it with your
            users.
          </p>
        </div>
      )}
    </div>
  );
}
