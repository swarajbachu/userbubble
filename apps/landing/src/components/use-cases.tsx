"use client";
import { motion } from "motion/react";
import { useState } from "react";
import {
  DatabaseIcon,
  DevopsIcon,
  GraphIcon,
  PhoneIcon,
  TruckIcon,
  WalletIcon,
} from "@/icons/card-icons";
import { Badge } from "./badge";
import { Container } from "./container";
import { Scale } from "./scale";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

export const UseCases = () => {
  const useCases = [
    {
      title: "DevOps",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <DevopsIcon className="size-6 text-brand" />,
    },
    {
      title: "SalesOps",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <GraphIcon className="size-6 text-brand" />,
    },
    {
      title: "Supply Chain",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <TruckIcon className="size-6 text-brand" />,
    },
    {
      title: "Customer Support",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <PhoneIcon className="size-6 text-brand" />,
    },
    {
      title: "DataOps",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <DatabaseIcon className="size-6 text-brand" />,
    },
    {
      title: "FinOps",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <WalletIcon className="size-6 text-brand" />,
    },
  ];
  const [activeUseCase, setActiveUseCase] = useState<number | null>(null);
  return (
    <Container className="relative overflow-hidden border-divide border-x px-4 md:px-8">
      <div className="relative flex flex-col items-center py-20">
        <Badge text="Use Cases" />
        <SectionHeading className="mt-4">
          Across various Industries
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
          We empower developers and technical teams to create, simulate, and
          manage AI-driven workflows visually
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
