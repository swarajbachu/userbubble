"use client";

import { Button } from "@critichut/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Loading03Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useWizard } from "./wizard-context";

export function StepComplete() {
  const { createOrganization, isCreating, prevStep } = useWizard();

  return (
    <div className="w-full max-w-md space-y-6 text-center">
      <div>
        <h1 className="mb-2 font-bold text-3xl">You're all set!</h1>
        <p className="text-lg text-muted-foreground">
          Let's get collecting feedback.
        </p>
      </div>

      <div className="flex items-center justify-between pt-4">
        <Button disabled={isCreating} onClick={prevStep} variant="ghost">
          <HugeiconsIcon className="mr-2" icon={ArrowLeft01Icon} size={16} />
          Back
        </Button>
        <Button disabled={isCreating} onClick={createOrganization} size="lg">
          {isCreating ? (
            <>
              <HugeiconsIcon
                className="mr-2 animate-spin"
                icon={Loading03Icon}
                size={16}
              />
              Creating...
            </>
          ) : (
            "Get Started →"
          )}
        </Button>
      </div>
    </div>
  );
}
