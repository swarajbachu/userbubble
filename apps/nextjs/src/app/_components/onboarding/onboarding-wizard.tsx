"use client";

import { StepName } from "./step-name";
import { StepSubdomain } from "./step-subdomain";
import { StepWebsite } from "./step-website";
import { useWizard, WizardProvider } from "./wizard-context";
import { WizardLayout } from "./wizard-layout";

function WizardSteps() {
  const { currentStep } = useWizard();
  return (
    <WizardLayout>
      {currentStep === 1 && <StepWebsite />}
      {currentStep === 2 && <StepName />}
      {currentStep === 3 && <StepSubdomain />}
      {currentStep === 4 && (
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h1 className="mb-2 font-bold text-3xl">You're all set!</h1>
            <p className="text-lg text-muted-foreground">
              Let's get collecting feedback.
            </p>
          </div>
        </div>
      )}
    </WizardLayout>
  );
}

export function OnboardingWizard() {
  return (
    <WizardProvider>
      <WizardSteps />
    </WizardProvider>
  );
}
