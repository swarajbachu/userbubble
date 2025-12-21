import { AgenticIntelligence } from "@/components/agentic-intelligence";
import { Benefits } from "@/components/benefits";
import { CTA } from "@/components/cta";
import { DivideX } from "@/components/divide";
import { FAQs } from "@/components/faqs";
import { Hero } from "@/components/hero";
import { HeroImage } from "@/components/hero-image";
import { HowItWorks } from "@/components/how-it-works";
// import { LogoCloud } from "@/components/logo-cloud"; // Commented out until we have customer logos
import { Pricing } from "@/components/pricing";
import { Security } from "@/components/security";
// import { Testimonials } from "@/components/testimonials"; // Commented out until we have real testimonials
import { UseCases } from "@/components/use-cases";

import { getSEOTags } from "@/lib/seo";

export const metadata = getSEOTags();

export default function Home() {
  return (
    <main>
      <DivideX />
      <Hero />
      <DivideX />
      <HeroImage />
      <DivideX />
      {/* Logo Cloud - commented out until we have customer logos */}
      {/* <LogoCloud /> */}
      {/* <DivideX /> */}
      <HowItWorks />
      <DivideX />
      <AgenticIntelligence />
      <DivideX />
      <UseCases />
      <DivideX />
      <Benefits />
      <DivideX />
      {/* Testimonials - commented out until we have real testimonials */}
      {/* <Testimonials /> */}
      {/* <DivideX /> */}
      <Pricing />
      <DivideX />
      <Security />
      <DivideX />
      <FAQs />
      <DivideX />
      <CTA />
      <DivideX />
    </main>
  );
}
