"use client";

import type { ReactNode } from "react";
import { ColoredTile } from "./colored-tile";
import { useWizard } from "./wizard-context";
import { WizardProgress } from "./wizard-progress";

type WizardLayoutProps = {
  children: ReactNode;
};

export function WizardLayout({ children }: WizardLayoutProps) {
  const { currentStep } = useWizard();

  return (
    <div className="grid min-h-screen lg:grid-cols-[3fr_2fr]">
      {/* Left side - Form content */}
      <div className="flex flex-col p-8">
        {/* Progress indicator at top */}
        <div className="mb-8">
          <WizardProgress currentStep={currentStep} totalSteps={4} />
        </div>

        {/* Main content - centered */}
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
      </div>

      {/* Right side - Colored tiles (hidden on mobile) */}
      <div className="hidden bg-muted lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:gap-4 lg:p-8">
        <ColoredTile color="salmon" label="Collect" />
        <ColoredTile color="purple" label="Discuss" />
        <ColoredTile color="green" label="Plan" />
        <ColoredTile color="blue" label="Publish" />
      </div>
    </div>
  );
}
