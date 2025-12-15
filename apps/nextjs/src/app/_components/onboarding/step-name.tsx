"use client";

import {
  AlertCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { createSlug } from "@userbubble/db/schema";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useWizard } from "./wizard-context";

const nameSchema = z.string().min(3).max(100);

export function StepName() {
  const { organizationName, setOrganizationName, setSlug } = useWizard();
  const [error, setError] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (organizationName) {
      setSlug(createSlug(organizationName));
    }
  }, [organizationName, setSlug]);

  const validateName = (name: string) => {
    const result = nameSchema.safeParse(name);
    if (!result.success) {
      if (name.length < 3) {
        return { success: false, error: "Name must be at least 3 characters" };
      }
      if (name.length > 100) {
        return {
          success: false,
          error: "Name must be less than 100 characters",
        };
      }
      return { success: false, error: "Invalid name" };
    }
    return { success: true };
  };

  const handleChange = (value: string) => {
    setOrganizationName(value);
    setError("");
    setIsTyping(true);
  };

  const handleBlur = () => {
    setIsTyping(false);
    if (organizationName) {
      const validation = validateName(organizationName);
      if (!validation.success) {
        setError(validation.error ?? "Invalid name");
      }
    }
  };

  const isValid =
    organizationName.length >= 3 && organizationName.length <= 100;

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">Pick a name.</h1>
        <p className="text-lg text-muted-foreground">
          What should we call this workspace? Usually, this is your product
          name.
        </p>
      </div>

      <div className="relative">
        <div className="relative">
          <Input
            className={`h-12 pr-12 text-lg ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
            onBlur={handleBlur}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="My Workspace"
            value={organizationName}
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground/80">
            {!error && isValid && !isTyping && (
              <Icon
                className="text-green-600"
                icon={CheckmarkCircle01Icon}
                size={20}
              />
            )}
            {error && (
              <Icon
                className="text-destructive"
                icon={AlertCircleIcon}
                size={20}
              />
            )}
          </div>
        </div>
        {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
}
