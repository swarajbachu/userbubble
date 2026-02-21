"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  GlobalIcon,
  PaintBoardIcon,
  Share01Icon,
  SourceCodeIcon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import type { OnboardingState } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toggleOnboardingStep } from "~/lib/onboarding-actions";
import { StepAutoLogin } from "./steps/step-auto-login";
import { StepBranding } from "./steps/step-branding";
import { StepDomain } from "./steps/step-domain";
import { StepGuestSubmissions } from "./steps/step-guest-submissions";
import { StepInstallWidget } from "./steps/step-install-widget";
import { StepInviteTeam } from "./steps/step-invite-team";
import { StepShareBoard } from "./steps/step-share-board";

type GettingStartedViewProps = {
  onboarding: OnboardingState | null;
  orgId: string;
  orgSlug: string;
  orgName: string;
};

type StepDef = {
  key: keyof OnboardingState;
  label: string;
  icon: typeof GlobalIcon;
};

const STEPS: StepDef[] = [
  { key: "setupDomain", label: "Setup Domain", icon: GlobalIcon },
  { key: "installWidget", label: "Install the widget", icon: SourceCodeIcon },
  { key: "autoLogin", label: "Enable auto-login", icon: UserIcon },
  { key: "guestSubmissions", label: "Guest submissions", icon: UserIcon },
  { key: "inviteTeam", label: "Invite your team", icon: UserAdd01Icon },
  {
    key: "customizeBranding",
    label: "Customize branding",
    icon: PaintBoardIcon,
  },
  { key: "shareBoard", label: "Share your board", icon: Share01Icon },
];

export function GettingStartedView({
  onboarding,
  orgId,
  orgSlug,
  orgName,
}: GettingStartedViewProps) {
  const [activeStep, setActiveStep] = useState(0);
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

  const completedCount = STEPS.filter((s) => optimisticState[s.key]).length;
  const progress = (completedCount / STEPS.length) * 100;

  const markDone = (key: keyof OnboardingState) => {
    if (optimisticState[key]) {
      return;
    }
    startTransition(async () => {
      setOptimisticState({ ...optimisticState, [key]: true });
      await toggleOnboardingStep(orgId, orgSlug, key, true);
    });
    // Auto-advance to next incomplete step
    const nextIncomplete = STEPS.findIndex(
      (s, i) => i > activeStep && !optimisticState[s.key] && s.key !== key
    );
    if (nextIncomplete !== -1) {
      setActiveStep(nextIncomplete);
    }
  };

  const currentStep = STEPS[activeStep] as StepDef;

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 lg:-mx-8 flex h-[calc(100vh-2rem)]">
      {/* Left Panel - Step Navigation */}
      <div className="flex w-[340px] shrink-0 flex-col border-r p-6">
        <div className="mb-8">
          <h1 className="font-bold text-2xl">Get started</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Set up your Userbubble workspace to start collecting feedback.
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {STEPS.map((step, index) => {
            const isActive = index === activeStep;
            const isDone = optimisticState[step.key];

            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "border-indigo-500 border-l-2 bg-muted/80 font-medium"
                    : "hover:bg-muted/50",
                  isDone && !isActive && "text-muted-foreground"
                )}
                key={step.key}
                onClick={() => setActiveStep(index)}
                type="button"
              >
                <Icon
                  className={cn(
                    isDone && "text-muted-foreground",
                    isActive && "text-foreground"
                  )}
                  icon={step.icon}
                  size={20}
                />
                <span className="flex-1">{step.label}</span>
                {isDone && (
                  <HugeiconsIcon
                    className="text-green-500"
                    icon={CheckmarkBadge01Icon}
                    size={20}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Progress Footer */}
        <div className="mt-auto space-y-2 pt-6">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Step {activeStep + 1} of {STEPS.length}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h2 className="font-bold text-2xl">{currentStep.label}</h2>
            </div>
            <Button
              render={<Link href={`/org/${orgSlug}/feedback`} />}
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </Button>
          </div>

          {/* Step Content */}
          {activeStep === 0 && (
            <StepDomain
              onDone={() => markDone("setupDomain")}
              orgSlug={orgSlug}
            />
          )}
          {activeStep === 1 && (
            <StepInstallWidget onDone={() => markDone("installWidget")} />
          )}
          {activeStep === 2 && (
            <StepAutoLogin
              onDone={() => markDone("autoLogin")}
              orgSlug={orgSlug}
            />
          )}
          {activeStep === 3 && (
            <StepGuestSubmissions
              onDone={() => markDone("guestSubmissions")}
              orgSlug={orgSlug}
            />
          )}
          {activeStep === 4 && (
            <StepInviteTeam
              onDone={() => markDone("inviteTeam")}
              orgId={orgId}
            />
          )}
          {activeStep === 5 && (
            <StepBranding
              onDone={() => markDone("customizeBranding")}
              orgName={orgName}
              orgSlug={orgSlug}
            />
          )}
          {activeStep === 6 && (
            <StepShareBoard
              onDone={() => markDone("shareBoard")}
              orgSlug={orgSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}
