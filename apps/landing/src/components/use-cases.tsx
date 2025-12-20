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
      title: "SaaS Startups",
      description:
        "Ship features your customers actually want. Collect feedback, prioritize with votes, and share your roadmap—all in one place.",
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
      title: "B2B Platforms",
      description:
        "Give enterprise customers visibility into your product roadmap. Collect feature requests and keep stakeholders informed.",
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
        "Built by developers for developers. Native SDKs for React, Swift, and Vue mean your users never leave your product. Integrate feedback seamlessly.",
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
      title: "Customer Success",
      description:
        "Empower your CS team to capture customer feedback directly. Show customers you're listening by sharing your roadmap.",
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
      title: "API Companies",
      description:
        "Collect feedback from technical users. Our lightweight, multi-platform SDK makes adoption seamless across web and mobile apps.",
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
