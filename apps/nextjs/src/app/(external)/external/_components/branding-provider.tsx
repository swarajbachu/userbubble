"use client";

import type { ReactNode } from "react";

type BrandingProviderProps = {
  organizationName: string;
  branding: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
  children: ReactNode;
};

export function BrandingProvider({
  organizationName,
  branding,
  children,
}: BrandingProviderProps) {
  return (
    <div
      data-organization={organizationName}
      style={
        {
          "--brand-primary": branding.primaryColor || "#000000",
          "--brand-accent": branding.accentColor || "#3b82f6",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
