"use client";

import { Input } from "@critichut/ui/input";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons-pro/core-duotone-rounded";
import { useState } from "react";
import { z } from "zod";
import { useWizard } from "./wizard-context";

const urlSchema = z.string().url().or(z.string().min(1));

export function StepWebsite() {
  const { website, setWebsite } = useWizard();
  const [error, setError] = useState("");

  const validateUrl = (url: string) => {
    if (!url) {
      return { success: true };
    }
    const urlToValidate = url.startsWith("http") ? url : `https://${url}`;
    const result = urlSchema.safeParse(urlToValidate);
    return result;
  };

  const handleChange = (value: string) => {
    setWebsite(value);
    setError("");
  };

  const handleBlur = () => {
    if (website) {
      const validation = validateUrl(website);
      if (!validation.success) {
        setError("Please enter a valid URL");
      }
    }
  };

  const getDomain = (url: string) => {
    try {
      if (!url) {
        return "";
      }
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname;
    } catch {
      return "";
    }
  };

  const domain = getDomain(website);

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">
          First things first.
        </h1>
        <p className="text-lg text-muted-foreground">
          Which website do you want to collect feedback for?
        </p>
      </div>

      <div className="relative">
        <div className="relative">
          <Input
            className={`h-12 pr-12 text-lg ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
            onBlur={handleBlur}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="mywebsite.com"
            value={website}
          />
          <div className="absolute inset-y-0 right-3 flex items-center">
            {domain && !error && (
              // biome-ignore lint/performance/noImgElement: <explanation>
              <img
                alt="Favicon"
                className="h-6 w-6 rounded-sm"
                height={24}
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
                width={24}
              />
            )}
            {error && (
              <HugeiconsIcon
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
