"use client";

import { isReservedSlug, isValidSlug } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import { Input } from "@critichut/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Loading03Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authClient } from "~/auth/client";
import { useWizard } from "./wizard-context";

export function StepSubdomain() {
  const { slug, setSlug, nextStep, prevStep } = useWizard();
  const [debouncedSlug, setDebouncedSlug] = useState(slug);
  const [error, setError] = useState("");

  // Debounce slug for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  // Query slug availability using Better Auth
  const { data, isLoading } = useQuery({
    queryKey: ["checkSlug", debouncedSlug],
    queryFn: async () => {
      const result = await authClient.organization.checkSlug({
        slug: debouncedSlug,
      });
      return result.data;
    },
    enabled: Boolean(
      debouncedSlug &&
        debouncedSlug.length >= 3 &&
        isValidSlug(debouncedSlug) &&
        !isReservedSlug(debouncedSlug)
    ),
  });

  // Validate format
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setError("");
      return;
    }

    if (!isValidSlug(slug)) {
      setError("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    if (isReservedSlug(slug)) {
      setError("This slug is reserved and cannot be used");
      return;
    }

    if (data && !data.available) {
      setError("This subdomain is already taken");
      return;
    }

    setError("");
  }, [slug, data]);

  const handleNext = () => {
    if (!slug || slug.length < 3) {
      setError("Subdomain must be at least 3 characters");
      return;
    }
    if (!data?.available) {
      setError("Please choose an available subdomain");
      return;
    }
    nextStep();
  };

  const handleChange = (value: string) => {
    setSlug(value.toLowerCase());
    setError("");
  };

  const isAvailable = data?.available === true;
  const canProceed = isAvailable && !isLoading && !error;

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-2xl">Pick a subdomain</h1>
        <p className="text-muted-foreground">
          Choose a unique subdomain for your feedback board
        </p>
      </div>

      <div>
        <div className="relative">
          <Input
            className="peer pe-9"
            onChange={(e) => handleChange(e.target.value)}
            placeholder="acme-inc"
            type="text"
            value={slug}
          />
          <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-muted-foreground/80 peer-disabled:opacity-50">
            {isLoading && (
              <HugeiconsIcon
                className="animate-spin"
                icon={Loading03Icon}
                size={16}
              />
            )}
            {!isLoading && isAvailable && (
              <HugeiconsIcon
                className="text-green-600"
                icon={CheckmarkCircle01Icon}
                size={16}
              />
            )}
            {!isLoading && data && !isAvailable && (
              <HugeiconsIcon
                className="text-destructive"
                icon={Cancel01Icon}
                size={16}
              />
            )}
          </div>
        </div>
        {slug && (
          <p className="mt-1 text-muted-foreground text-sm">
            critichut.com/{slug}
          </p>
        )}
        {error && <p className="mt-1 text-destructive text-sm">{error}</p>}
      </div>

      <div className="flex items-center justify-between">
        <Button onClick={prevStep} variant="ghost">
          <HugeiconsIcon className="mr-2" icon={ArrowLeft01Icon} size={16} />
          Back
        </Button>
        <Button disabled={!canProceed} onClick={handleNext}>
          Next →
        </Button>
      </div>
    </div>
  );
}
