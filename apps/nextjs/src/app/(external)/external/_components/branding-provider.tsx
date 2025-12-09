"use client";

import type { OrganizationSettings } from "@critichut/db/org/organization-settings";

type BrandingProviderProps = {
  children: React.ReactNode;
  branding: OrganizationSettings["branding"];
};

export function BrandingProvider({
  children,
  branding,
}: BrandingProviderProps) {
  return (
    <div
      style={{
        // @ts-expect-error CSS custom properties
        "--brand-primary": branding.primaryColor ?? "#000000",
        "--brand-accent": branding.accentColor ?? "#3b82f6",
      }}
    >
      {children}
    </div>
  );
}
