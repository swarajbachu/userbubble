"use client";

import { Button } from "@critichut/ui/button";
import { Input } from "@critichut/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useState } from "react";
import { useWizard } from "./wizard-context";

export function StepWebsite() {
  const { website, setWebsite, nextStep } = useWizard();
  const [error, setError] = useState("");

  const validateUrl = (url: string): boolean => {
    if (!url) {
      return true; // Optional field
    }
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleNext = () => {
    if (website && !validateUrl(website)) {
      setError("Please enter a valid URL");
      return;
    }
    setError("");
    nextStep();
  };

  const handleChange = (value: string) => {
    setWebsite(value);
    if (error) {
      setError("");
    }
  };

  const isValid = website && validateUrl(website);
  const hasError = website && !validateUrl(website);

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-2xl">First things first.</h1>
        <p className="text-muted-foreground">
          Which website do you want to collect feedback for?
        </p>
      </div>

      <div>
        <div className="relative">
          <Input
            className="peer pe-9"
            onChange={(e) => handleChange(e.target.value)}
            placeholder="mywebsite.com"
            type="text"
            value={website}
          />
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
            {isValid && (
              <HugeiconsIcon
                className="text-green-600"
                icon={CheckmarkCircle01Icon}
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

      <div className="flex items-center justify-end">
        <Button onClick={handleNext}>{website ? "Next →" : "Skip →"}</Button>
      </div>
    </div>
  );
}
