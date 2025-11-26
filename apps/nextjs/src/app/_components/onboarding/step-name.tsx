"use client";

import { createSlug } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import { Input } from "@critichut/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  Tick01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useEffect, useState } from "react";
import { useWizard } from "./wizard-context";

export function StepName() {
  const { organizationName, setOrganizationName, setSlug, nextStep, prevStep } =
    useWizard();
  const [error, setError] = useState("");

  // Auto-generate slug when name changes
  useEffect(() => {
    if (organizationName) {
      setSlug(createSlug(organizationName));
    }
  }, [organizationName, setSlug]);

  const handleNext = () => {
    if (!organizationName || organizationName.length < 3) {
      setError("Organization name must be at least 3 characters");
      return;
    }
    if (organizationName.length > 100) {
      setError("Organization name must be less than 100 characters");
      return;
    }
    setError("");
    nextStep();
  };

  const handleChange = (value: string) => {
    setOrganizationName(value);
    if (error) {
      setError("");
    }
  };

  const isValid =
    organizationName.length >= 3 && organizationName.length <= 100;
  const hasError = organizationName && !isValid;

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-2xl">Pick a name</h1>
        <p className="text-muted-foreground">
          What would you like to call your organization?
        </p>
      </div>

      <div>
        <div className="relative">
          <Input
            className="peer pe-9"
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Acme Inc"
            type="text"
            value={organizationName}
          />
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
            {isValid && (
              <HugeiconsIcon
                className="text-green-600"
                icon={Tick01Icon}
                size={16}
              />
            )}
            {hasError && (
              <HugeiconsIcon
                className="text-destructive"
                icon={Cancel01Icon}
                size={16}
              />
            )}
          </div>
        </div>
        {error && <p className="mt-1 text-destructive text-sm">{error}</p>}
      </div>

      <div className="flex items-center justify-between">
        <Button onClick={prevStep} variant="ghost">
          <HugeiconsIcon className="mr-2" icon={ArrowLeft01Icon} size={16} />
          Back
        </Button>
        <Button disabled={!isValid} onClick={handleNext}>
          Next →
        </Button>
      </div>
    </div>
  );
}
