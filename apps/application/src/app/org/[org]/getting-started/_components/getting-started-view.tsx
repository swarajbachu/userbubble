"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Key01Icon,
  PaintBoardIcon,
  Share01Icon,
  SourceCodeIcon,
  UserIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import type { OnboardingState, Organization } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { toggleOnboardingStep } from "~/lib/onboarding-actions";
import { StepAnonymousSubmissions } from "./steps/step-anonymous-submissions";
import { StepApiKey } from "./steps/step-api-key";
import { StepBranding } from "./steps/step-branding";
import { StepInstallWidget } from "./steps/step-install-widget";
import { StepShareBoard } from "./steps/step-share-board";

type GettingStartedViewProps = {
  onboarding: OnboardingState | null;
  organization: Organization;
  orgSlug: string;
};

type StepDef = {
  key: keyof OnboardingState;
  label: string;
  icon: typeof Key01Icon;
};

const STEPS: StepDef[] = [
  { key: "createApiKey", label: "Get Your API Key", icon: Key01Icon },
  { key: "installWidget", label: "Install Widget", icon: SourceCodeIcon },
  {
    key: "anonymousSubmissions",
    label: "Anonymous Submissions",
    icon: UserIcon,
  },
  {
    key: "customizeBranding",
    label: "Customize Branding",
    icon: PaintBoardIcon,
  },
  { key: "shareBoard", label: "Share Your Board", icon: Share01Icon },
];

const DEFAULT_STATE: OnboardingState = {
  createApiKey: false,
  installWidget: false,
  anonymousSubmissions: false,
  customizeBranding: false,
  shareBoard: false,
};

export function GettingStartedView({
  onboarding,
  organization,
  orgSlug,
}: GettingStartedViewProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const [optimisticState, setOptimisticState] = useOptimistic(
    onboarding ?? DEFAULT_STATE
  );

  const completedCount = STEPS.filter((s) => optimisticState[s.key]).length;
  const progress = (completedCount / STEPS.length) * 100;
  const allComplete = completedCount === STEPS.length;

  const scrollToTop = () => {
    rightPanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markDone = (key: keyof OnboardingState) => {
    if (optimisticState[key]) {
      return;
    }
    startTransition(async () => {
      setOptimisticState({ ...optimisticState, [key]: true });
      await toggleOnboardingStep(organization.id, orgSlug, key, true);
    });
  };

  const goToStep = (index: number) => {
    setActiveStep(index);
    scrollToTop();
  };

  const currentStep = STEPS[activeStep] as StepDef;

  return (
    <div className="-mx-4 -my-4 sm:-mx-6 lg:-mx-8 flex h-[calc(100vh-2rem)]">
      {/* Left Panel - Step Navigation */}
      <div className="flex w-[340px] shrink-0 flex-col border-r">
        <div className="p-6 pb-4">
          <h1 className="font-bold text-2xl">Get started</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Set up your Userbubble workspace to start collecting feedback.
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-4 pt-2">
          {STEPS.map((step, index) => {
            const isActive = index === activeStep;
            const isDone = optimisticState[step.key];

            return (
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  isActive
                    ? "bg-indigo-500/10 font-medium text-indigo-700 dark:text-indigo-300"
                    : "hover:bg-muted/50",
                  isDone && !isActive && "text-muted-foreground"
                )}
                key={step.key}
                onClick={() => goToStep(index)}
                type="button"
              >
                <Icon
                  className={cn(
                    isDone && !isActive && "text-muted-foreground",
                    isActive && "text-indigo-600 dark:text-indigo-400"
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
        <div className="mt-auto space-y-2 px-6 pt-4 pb-6">
          <div className="flex items-center justify-between">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Progress
            </p>
            <p className="font-semibold text-indigo-600 text-xs dark:text-indigo-400">
              {completedCount}/{STEPS.length}
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Step Content */}
      <div className="flex-1 overflow-y-auto" ref={rightPanelRef}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="mb-1 font-medium text-indigo-600 text-xs uppercase tracking-wider dark:text-indigo-400">
                Step {activeStep + 1} of {STEPS.length}
              </p>
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
            <StepApiKey
              onApiKeyCreated={setApiKey}
              onDone={() => markDone("createApiKey")}
              organization={organization}
              orgSlug={orgSlug}
            />
          )}
          {activeStep === 1 && (
            <StepInstallWidget
              apiKey={apiKey}
              onDone={() => markDone("installWidget")}
            />
          )}
          {activeStep === 2 && (
            <StepAnonymousSubmissions
              onDone={() => markDone("anonymousSubmissions")}
              organization={organization}
            />
          )}
          {activeStep === 3 && (
            <StepBranding
              onDone={() => markDone("customizeBranding")}
              organization={organization}
            />
          )}
          {activeStep === 4 && (
            <StepShareBoard
              allComplete={allComplete}
              onDone={() => markDone("shareBoard")}
              orgSlug={orgSlug}
            />
          )}

          {/* Bottom Navigation */}
          <div className="mt-10 flex items-center justify-between border-t pt-6">
            <div>
              {activeStep > 0 && (
                <Button
                  onClick={() => goToStep(activeStep - 1)}
                  size="sm"
                  variant="ghost"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!optimisticState[currentStep.key] && (
                <button
                  className="text-muted-foreground text-xs hover:text-foreground"
                  onClick={() => markDone(currentStep.key)}
                  type="button"
                >
                  Skip this step
                </button>
              )}
              {activeStep < STEPS.length - 1 && (
                <Button
                  onClick={() => {
                    markDone(currentStep.key);
                    goToStep(activeStep + 1);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Next step
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
