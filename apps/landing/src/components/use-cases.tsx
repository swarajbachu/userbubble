/** biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: hover effect for visual feedback only */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: decorative hover animation */
"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics02Icon,
  Database01Icon,
  HeadphonesIcon,
  PackageDeliveredIcon,
  SourceCodeSquareIcon,
  Wallet02Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "./badge";
import { Container } from "./container";
import { Scale } from "./scale";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

export const UseCases = () => {
  const useCases = [
    {
      title: "Startups",
      description:
        "Building the next big thing? Collect feedback directly from users, prioritize with votes, and ship features your users actually want.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={SourceCodeSquareIcon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Cross-Platform Apps",
      description:
        "Building for web, mobile, and desktop? Collect feedback from all your users in one unified dashboard, no matter the platform.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Analytics02Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Developer Tools",
      description:
        "Building dev tools? Our SDKs let your users submit feedback without leaving your app. Native experience, zero friction.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Database01Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Product Teams",
      description:
        "Stop managing feedback in Slack, email, and spreadsheets. Centralize everything in one place with automatic organization.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={PackageDeliveredIcon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "SaaS Products",
      description:
        "Empower your team to collect feedback from users, track feature requests, and share your product roadmap publicly.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={HeadphonesIcon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Consumer Apps",
      description:
        "Building a consumer app? Lightweight SDK that won't impact your app's performance. Users can vote on features and see your roadmap.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Wallet02Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
  ];
  const [activeUseCase, setActiveUseCase] = useState<number | null>(null);
  return (
    <Container className="relative overflow-hidden border-divide border-x px-4 md:px-8">
      <div className="relative flex flex-col items-center py-20">
        <Badge text="Use Cases" />
        <SectionHeading className="mt-4">
          Built for product teams everywhere
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
          From early-stage startups to enterprise platforms, UserBubble helps
          teams collect feedback and ship features faster.
        </SubHeading>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase, index) => (
            <div
              className="relative"
              key={useCase.title}
              onMouseEnter={() => setActiveUseCase(index)}
            >
              {activeUseCase === index && (
                <motion.div
                  animate={{ opacity: 0.5 }}
                  className="absolute inset-0 z-0"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  layoutId="scale"
                >
                  <Scale />
                </motion.div>
              )}
              <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
                <div className="flex items-center gap-2">{useCase.icon}</div>
                <h3 className="mt-4 mb-2 font-medium text-lg">
                  {useCase.title}
                </h3>
                <p className="text-gray-600">{useCase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};
