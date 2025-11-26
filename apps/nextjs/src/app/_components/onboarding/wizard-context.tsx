"use client";

import { toast } from "@critichut/ui/toast";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { authClient } from "~/auth/client";

type WizardState = {
  currentStep: number;
  website: string;
  organizationName: string;
  slug: string;
  isCreating: boolean;
  showChecklist: boolean;
};

type WizardActions = {
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setWebsite: (url: string) => void;
  setOrganizationName: (name: string) => void;
  setSlug: (slug: string) => void;
  createOrganization: () => Promise<void>;
  openChecklist: () => void;
  closeChecklist: () => void;
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
  const [showChecklist, setShowChecklist] = useState(false);

  const nextStep = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step);
    }
  }, []);

  const createOrganization = useCallback(async () => {
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
        toast.success("Organization created successfully!");
        setShowChecklist(true);

        // Redirect after a short delay to show the checklist
        setTimeout(() => {
          router.push(`/${data.slug}/feedback`);
        }, 2000);
      }
    } catch (_err) {
      toast.error("Failed to create organization");
    } finally {
      setIsCreating(false);
    }
  }, [organizationName, slug, website, router]);

  const openChecklist = useCallback(() => {
    setShowChecklist(true);
  }, []);

  const closeChecklist = useCallback(() => {
    setShowChecklist(false);
  }, []);

  const value: WizardContextType = {
    currentStep,
    website,
    organizationName,
    slug,
    isCreating,
    showChecklist,
    nextStep,
    prevStep,
    goToStep,
    setWebsite,
    setOrganizationName,
    setSlug,
    createOrganization,
    openChecklist,
    closeChecklist,
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
