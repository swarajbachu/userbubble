"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";
import { initializeOnboarding } from "~/lib/onboarding-actions";

type WizardState = {
  currentStep: number;
  website: string;
  organizationName: string;
  slug: string;
  isCreating: boolean;
  validationError: string | null;
};

type WizardActions = {
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setWebsite: (url: string) => void;
  setOrganizationName: (name: string) => void;
  setSlug: (slug: string) => void;
  createOrganization: () => Promise<void>;
  setValidationError: (error: string | null) => void;
  handleStepNext: () => Promise<boolean>;
};

type WizardContextType = WizardState & WizardActions;

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [website, setWebsite] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [slug, setSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const nextStep = useCallback(() => {
    if (validationError) {
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      setValidationError(null);
    }
  }, [currentStep, validationError]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setValidationError(null);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
      setValidationError(null);
    }
  }, []);

  const handleStepNext = useCallback(async () => {
    setValidationError(null);
    return true;
  }, []);

  const createOrganization = useCallback(async () => {
    if (validationError) {
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await authClient.organization.create({
        name: organizationName,
        slug,
        website,
      });

      if (error) {
        toast.error(error.message || "Failed to create organization");
        return;
      }

      if (data) {
        await initializeOnboarding(data.id);
        toast.success("Organization created successfully!");
        router.push(`/org/${data.slug}/getting-started`);
      }
    } catch (_err) {
      toast.error("Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  }, [organizationName, slug, website, router, validationError]);

  const value: WizardContextType = {
    currentStep,
    website,
    organizationName,
    slug,
    isCreating,
    validationError,
    nextStep,
    prevStep,
    goToStep,
    setWebsite,
    setOrganizationName,
    setSlug,
    createOrganization,
    setValidationError,
    handleStepNext,
  };

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
