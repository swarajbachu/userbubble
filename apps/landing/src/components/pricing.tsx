"use client";
import { motion } from "motion/react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { tiers } from "@/constants/pricing";
import { CheckIcon } from "@/icons/card-icons";
import { Badge } from "./badge";
import { Button } from "./button";
import { Container } from "./container";
import { DivideX } from "./divide";
import { Scale } from "./scale";
import { SectionHeading } from "./seciton-heading";
import { SlidingNumber } from "./sliding-number";

export const Pricing = () => {
  const tabs = [
    {
      title: "Monthly",
      value: "monthly",
      badge: "",
    },
    {
      title: "Yearly",
      value: "yearly",
      badge: "Save 20%",
    },
  ];
  const [activeTier, setActiveTier] = useState<"monthly" | "yearly">("monthly");
  return (
    <section className="">
      <Container className="flex flex-col items-center justify-center border-divide border-x pt-10 pb-10">
        <Badge text="Pricing" />
        <SectionHeading className="mt-4">
          Simple and Feasible Pricing
        </SectionHeading>
        <div className="relative mt-8 flex items-center gap-4 rounded-xl bg-gray-50 p-2 dark:bg-neutral-800">
          <Scale className="opacity-50" />
          {tabs.map((tab) => (
            <button
              className="relative z-20 flex w-32 justify-center py-1 text-center sm:w-40"
              key={tab.value}
              onClick={() => setActiveTier(tab.value as "monthly" | "yearly")}
              type="button"
            >
              {activeTier === tab.value && (
                <motion.div
                  className="absolute inset-0 h-full w-full rounded-md bg-white shadow-aceternity dark:bg-neutral-950"
                  layoutId="active-span"
                />
              )}
              <span className="relative z-20 flex items-center gap-2 text-sm sm:text-base">
                {tab.title}{" "}
                {tab.badge && (
                  <span className="rounded-full bg-brand/10 px-2 py-1 font-medium text-brand text-xs">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </Container>
      <DivideX />
      <Container className="border-divide border-x">
        <div className="grid grid-cols-1 divide-y divide-divide md:grid-cols-3 md:divide-x md:divide-y-0">
          {tiers.map((tier, tierIdx) => (
            <div className="p-4 md:p-8" key={`${tier.title}tier-meta`}>
              <h3 className="font-medium text-charcoal-700 text-xl dark:text-neutral-100">
                {tier.title}
              </h3>
              <p className="text-base text-gray-600 dark:text-neutral-400">
                {tier.subtitle}
              </p>
              <span className="items-baseline-last mt-6 flex font-medium text-2xl dark:text-white">
                $
                <Price
                  value={activeTier === "monthly" ? tier.monthly : tier.yearly}
                />
                <span className="ml-2 font-normal text-sm">/seat</span>
              </span>

              <div
                className="flex flex-col gap-4 px-0 py-4 md:hidden md:p-8"
                key={`${tier.title}tier-list-of-items`}
              >
                {tier.features.map((tierFeature, idx) => (
                  <Step key={tierFeature + tierIdx + idx}>{tierFeature}</Step>
                ))}
              </div>
              <Button
                as={Link}
                className="mt-6 w-full"
                href={tier.ctaLink}
                variant={tier.featured ? "brand" : "secondary"}
              >
                {tier.ctaText}
              </Button>
            </div>
          ))}
        </div>
      </Container>
      <DivideX />
      <Container className="hidden border-divide border-x md:block">
        <div className="grid grid-cols-1 divide-divide md:grid-cols-3 md:divide-x">
          {tiers.map((tier, index) => (
            <div
              className="flex flex-col gap-4 p-4 md:p-8"
              key={`${tier.title}tier-list-of-items`}
            >
              {tier.features.map((tierFeature, idx) => (
                <Step key={tierFeature + index + idx}>{tierFeature}</Step>
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

const Step = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-charcoal-700 dark:text-neutral-100">
    <CheckIcon className="h-4 w-4 shrink-0" />
    {children}
  </div>
);

const Price = ({ value }: { value: number }) => <SlidingNumber value={value} />;
