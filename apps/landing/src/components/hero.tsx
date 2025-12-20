/** biome-ignore-all lint/style/useConsistentBuiltinInstantiation: Array constructor used for star rating animation */
"use client";
import { Button } from "@userbubble/ui/button";
import { motion } from "motion/react";
import Link from "next/link";
import { GartnerLogo, GartnerLogoText, Star } from "@/icons/general";
import { AuthButton } from "./auth-button";
import { Badge } from "./badge";
import { Container } from "./container";
import { Heading } from "./heading";
import { SubHeading } from "./subheading";

export const Hero = () => (
  <Container className="flex flex-col items-center justify-center border-divide border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20">
    <Badge text="Built for developers, loved by users" />
    <Heading className="mt-4">
      Feedback collection that works{" "}
      <span className="text-brand">everywhere</span>
    </Heading>

    <SubHeading className="mx-auto mt-6 max-w-lg">
      Native SDKs for React, React Native, Swift, Next.js, and Vue. Lightweight,
      fast, and framework-agnostic. Integrate once, deploy everywhere.
    </SubHeading>

    <div className="mt-6 flex items-center gap-4">
      <AuthButton className="px-4 py-4" />
      <Link href="/pricing">
        <Button className="px-4 py-4" size="lg" variant="secondary">
          View pricing
        </Button>
      </Link>
    </div>
    <div className="mt-6 flex items-center gap-2">
      <GartnerLogo />
      <div className="-gap-5 flex items-center">
        {[...Array(5)].map((_, index) => (
          <motion.div
            animate={{
              opacity: 1,
            }}
            initial={{
              opacity: 0,
            }}
            key={index}
            transition={{ duration: 1, delay: index * 0.05 }}
          >
            <Star key={index} />
          </motion.div>
        ))}
      </div>
      <span className="border-gray-500 border-l pl-4 text-[10px] text-gray-600 sm:text-sm">
        Loved by developers building cross-platform apps
      </span>
      <GartnerLogoText className="size-12 sm:size-16" />
    </div>
  </Container>
);
