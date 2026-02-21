"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  GlobalIcon,
  PaintBoardIcon,
  Share01Icon,
  SourceCodeIcon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import {
  CheckmarkCircle01Icon,
  Copy01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import type { OnboardingState } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleOnboardingStep } from "~/lib/onboarding-actions";

type GettingStartedChecklistProps = {
  onboarding: OnboardingState | null;
  orgId: string;
  orgSlug: string;
};

const SCRIPT_TAG_SNIPPET = `<script
  src="https://widget.userbubble.com/widget.js"
  data-slug="YOUR_API_KEY"
  defer
></script>`;

const NPM_INSTALL_SNIPPET = "npm install @userbubble/js";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      className="shrink-0"
      onClick={copyToClipboard}
      size="sm"
      variant="outline"
    >
      <HugeiconsIcon
        className="mr-1"
        icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
        size={14}
      />
      {copied ? "Copied" : label}
    </Button>
  );
}

function StepCard({
  icon,
  title,
  description,
  done,
  onMarkDone,
  children,
}: {
  icon: typeof GlobalIcon;
  title: string;
  description: string;
  done: boolean;
  onMarkDone: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-colors",
        done &&
          "border-green-200 bg-green-50/30 dark:border-green-900/40 dark:bg-green-950/10"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              done
                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {done ? (
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={20} />
            ) : (
              <HugeiconsIcon icon={icon} size={20} />
            )}
          </div>
          <div>
            <h3
              className={cn("font-semibold", done && "text-muted-foreground")}
            >
              {title}
            </h3>
            <p className="mt-0.5 text-muted-foreground text-sm">
              {description}
            </p>
          </div>
        </div>
        <Button
          className={cn(
            "shrink-0",
            done &&
              "border-green-300 text-green-600 dark:border-green-800 dark:text-green-400"
          )}
          onClick={onMarkDone}
          size="sm"
          variant="outline"
        >
          {done ? "Done" : "Mark done"}
        </Button>
      </div>
      {!done && children && <div className="mt-4 pl-14">{children}</div>}
    </div>
  );
}

export function GettingStartedChecklist({
  onboarding,
  orgId,
  orgSlug,
}: GettingStartedChecklistProps) {
  const [, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    onboarding ?? {
      setupDomain: false,
      installWidget: false,
      autoLogin: false,
      guestSubmissions: false,
      inviteTeam: false,
      customizeBranding: false,
      shareBoard: false,
    }
  );

  const keys = Object.keys(optimisticState) as (keyof OnboardingState)[];
  const completedCount = keys.filter((k) => optimisticState[k]).length;
  const totalCount = keys.length;

  const toggle = (key: keyof OnboardingState) => {
    const newValue = !optimisticState[key];
    startTransition(async () => {
      setOptimisticState({ ...optimisticState, [key]: newValue });
      await toggleOnboardingStep(orgId, orgSlug, key, newValue);
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-muted-foreground text-sm">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Setup Domain */}
      <StepCard
        description="Point a custom domain to your public feedback portal so it lives on your brand."
        done={optimisticState.setupDomain}
        icon={GlobalIcon}
        onMarkDone={() => toggle("setupDomain")}
        title="Setup your domain"
      >
        <Button
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Open domain settings
        </Button>
      </StepCard>

      {/* Install Widget */}
      <StepCard
        description="Embed the feedback widget directly in your app so users can submit requests without leaving."
        done={optimisticState.installWidget}
        icon={SourceCodeIcon}
        onMarkDone={() => toggle("installWidget")}
        title="Install the widget"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="font-medium text-xs">Script tag</p>
            <div className="flex items-start gap-2">
              <pre className="flex-1 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                {SCRIPT_TAG_SNIPPET}
              </pre>
              <CopyButton label="Copy" value={SCRIPT_TAG_SNIPPET} />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium text-xs">Or install via npm</p>
            <div className="flex items-center gap-2">
              <pre className="flex-1 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                {NPM_INSTALL_SNIPPET}
              </pre>
              <CopyButton label="Copy" value={NPM_INSTALL_SNIPPET} />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Replace{" "}
            <code className="rounded bg-muted px-1 text-foreground">
              YOUR_API_KEY
            </code>{" "}
            with your API key from{" "}
            <Link
              className="text-primary underline"
              href={`/org/${orgSlug}/settings`}
            >
              Settings
            </Link>
            .
          </p>
        </div>
      </StepCard>

      {/* Auto-login */}
      <StepCard
        description="Identify logged-in users automatically so their feedback is always attributed to the right person."
        done={optimisticState.autoLogin}
        icon={UserIcon}
        onMarkDone={() => toggle("autoLogin")}
        title="Enable auto-login"
      >
        <Button
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Configure authentication
        </Button>
      </StepCard>

      {/* Guest submissions */}
      <StepCard
        description="Let visitors submit feedback without creating an account — lower friction, more feedback."
        done={optimisticState.guestSubmissions}
        icon={UserIcon}
        onMarkDone={() => toggle("guestSubmissions")}
        title="Allow guest submissions"
      >
        <Button
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Open feedback settings
        </Button>
      </StepCard>

      {/* Invite team */}
      <StepCard
        description="Add your team so they can triage requests, update statuses, and respond to users."
        done={optimisticState.inviteTeam}
        icon={UserAdd01Icon}
        onMarkDone={() => toggle("inviteTeam")}
        title="Invite your team"
      >
        <Button
          render={<Link href={`/org/${orgSlug}/members`} />}
          size="sm"
          variant="outline"
        >
          Go to members
        </Button>
      </StepCard>

      {/* Customize branding */}
      <StepCard
        description="Upload your logo, set brand colors, and make the portal feel like part of your product."
        done={optimisticState.customizeBranding}
        icon={PaintBoardIcon}
        onMarkDone={() => toggle("customizeBranding")}
        title="Customize branding"
      >
        <Button
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Open branding settings
        </Button>
      </StepCard>

      {/* Share board */}
      <StepCard
        description="Share your public feedback board with customers so they can vote and contribute ideas."
        done={optimisticState.shareBoard}
        icon={Share01Icon}
        onMarkDone={() => toggle("shareBoard")}
        title="Share your board"
      >
        <div className="flex items-center gap-2">
          <pre className="flex-1 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
            {`https://${orgSlug}.userbubble.com`}
          </pre>
          <CopyButton
            label="Copy"
            value={`https://${orgSlug}.userbubble.com`}
          />
        </div>
      </StepCard>
    </div>
  );
}
