import Link from "next/link";
import { Suspense } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
        {/* Logo / Branding */}
        <div className="mb-12 flex justify-center md:justify-start">
          <Link className="flex items-center gap-2 font-bold text-xl" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="font-bold text-sm">C</span>
            </div>
            Critichut
          </Link>
        </div>

        {/* Main content */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
