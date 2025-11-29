"use client";

import { Button } from "@critichut/ui/button";
import {
  DoubleCard,
  DoubleCardFooter,
  DoubleCardInner,
} from "@critichut/ui/double-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import type { ReactNode } from "react";
import { useWizard } from "./wizard-context";
import { WizardProgress } from "./wizard-progress";

type WizardLayoutProps = {
  children: ReactNode;
};

export function WizardLayout({ children }: WizardLayoutProps) {
  const {
    currentStep,
    nextStep,
    prevStep,
    isCreating,
    createOrganization,
    validationError,
  } = useWizard();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 4;

  const handleNext = async () => {
    if (isLastStep) {
      await createOrganization();
    } else {
      nextStep();
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_500px]">
      {/* Left side - Form content */}
      <div className="flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg space-y-8">
          {/* Progress indicator */}
          <div className="px-1">
            <WizardProgress currentStep={currentStep} totalSteps={4} />
          </div>

          {/* Main content wrapped in DoubleCard */}
          <DoubleCard>
            <DoubleCardInner className="min-h-[400px] p-8 md:p-10">
              <div className="flex h-full flex-col justify-center">
                {children}
              </div>
            </DoubleCardInner>
            {/* Footer with navigation buttons */}
            <DoubleCardFooter className="flex items-center justify-between pt-6">
              <Button
                className={isFirstStep ? "invisible" : ""}
                disabled={isFirstStep || isCreating}
                onClick={prevStep}
                variant="ghost"
              >
                <HugeiconsIcon
                  className="mr-2"
                  icon={ArrowLeft01Icon}
                  size={16}
                />
                Back
              </Button>
              <Button
                disabled={isCreating || !!validationError}
                onClick={handleNext}
                size="lg"
              >
                {isLastStep ? (
                  "Get Started"
                ) : (
                  <>
                    Next{" "}
                    <HugeiconsIcon className="ml-2" icon={ArrowRight01Icon} />
                  </>
                )}
              </Button>
            </DoubleCardFooter>
          </DoubleCard>
        </div>
      </div>

      {/* Right side - New Content */}
      <div className="hidden flex-col justify-center gap-6 border-l bg-muted/30 p-8 lg:flex xl:p-12">
        <div className="space-y-6">
          <h2 className="font-bold text-3xl tracking-tight">
            Turn User Feedback Into Product Success
          </h2>
          <p className="text-lg text-muted-foreground">
            Collect, prioritize, and manage user feedback to build products your
            customers love.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                1
              </div>
              <p className="font-medium">Collect feedback from anywhere</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                2
              </div>
              <p className="font-medium">Prioritize what matters most</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                3
              </div>
              <p className="font-medium">Keep users in the loop</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
