"use client";

import { OnboardingChecklistModal } from "./onboarding-checklist-modal";
import { StepComplete } from "./step-complete";
import { StepName } from "./step-name";
import { StepSubdomain } from "./step-subdomain";
import { StepWebsite } from "./step-website";
import { useWizard, WizardProvider } from "./wizard-context";
import { WizardLayout } from "./wizard-layout";

function WizardSteps() {
  const { currentStep } = useWizard();

  return (
    <>
      <WizardLayout>
        {currentStep === 1 && <StepWebsite />}
        {currentStep === 2 && <StepName />}
        {currentStep === 3 && <StepSubdomain />}
        {currentStep === 4 && <StepComplete />}
      </WizardLayout>
      <OnboardingChecklistModal />
    </>
  );
}

export function OnboardingWizard() {
  return (
    <WizardProvider>
      <WizardSteps />
    </WizardProvider>
  );
}
