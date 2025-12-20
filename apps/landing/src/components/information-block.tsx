"use client";
import { motion } from "motion/react";
import { useState } from "react";
import {
  BoltIcon,
  CloudCheckIcon,
  ShieldSplitIcon,
  SparklesIcon,
} from "@/icons/card-icons";
import { Scale } from "./scale";

export const InformationBlock = () => {
  const useCases = [
    {
      title: "Complete Ownership",
      description:
        "Take full control of your AI agents and workflows with comprehensive ownership and customization options",
      icon: <CloudCheckIcon className="size-6 text-brand" />,
    },
    {
      title: "High-Paced",
      description:
        "Build and deploy autonomous agents rapidly with our streamlined development environment",
      icon: <BoltIcon className="size-6 text-brand" />,
    },
    {
      title: "Absolute Integrity",
      description:
        "Ensure reliable and secure agent operations with built-in safety measures and transparent processes",
      icon: <ShieldSplitIcon className="size-6 text-brand" />,
    },
    {
      title: "Meaningful Impact",
      description:
        "Create AI solutions that drive real business value and transform how your team works",
      icon: <SparklesIcon className="size-6 text-brand" />,
    },
  ];
  const [activeUseCase, setActiveUseCase] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {useCases.map((useCase, index) => (
        <div
          className="relative h-full"
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
          <div className="relative z-10 h-full rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
            <div className="flex items-center gap-2">{useCase.icon}</div>
            <h3 className="mt-4 mb-2 font-medium text-base">{useCase.title}</h3>
            <p className="text-gray-600 text-sm dark:text-neutral-400">
              {useCase.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
