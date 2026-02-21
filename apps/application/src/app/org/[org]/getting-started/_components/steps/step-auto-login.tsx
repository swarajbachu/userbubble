"use client";

import {
  Link01Icon,
  Settings01Icon,
  UserIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { CodeBlock, Section, StepSeparator } from "../step-section";

type StepAutoLoginProps = {
  orgSlug: string;
  onDone: () => void;
};

export function StepAutoLogin({ orgSlug, onDone }: StepAutoLoginProps) {
  const feedbackLink = `<a href="https://${orgSlug}.userbubble.com/">
  Share Feedback
</a>`;

  const roadmapLink = `<a href="https://${orgSlug}.userbubble.com/roadmap">
  View Roadmap
</a>`;

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Let users access your feedback board without logging in again
      </p>

      <Section
        description="When auto-login is enabled, users who click links to your feedback board from your app will be automatically logged in with their identity"
        icon={Link01Icon}
        title="How It Works"
      >
        <div className="space-y-3">
          <CodeBlock code={feedbackLink} numbered />
          <CodeBlock code={roadmapLink} numbered />
        </div>
      </Section>

      <StepSeparator />

      <Section
        description={`Make sure you've set up the widget and implemented the Userbubble SDK identify function in your application first.`}
        icon={Settings01Icon}
        title="Prerequisites"
      />

      <StepSeparator />

      <Section
        description="Turn on auto-login to let authenticated users seamlessly access your feedback board"
        icon={UserIcon}
        title="Enable Automatic Login"
      >
        <Button
          className="mt-2"
          onClick={onDone}
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Configure in settings
        </Button>
      </Section>
    </div>
  );
}
