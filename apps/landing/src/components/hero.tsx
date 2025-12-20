"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { GartnerLogo, GartnerLogoText, Star } from "@/icons/general";
import { Badge } from "./badge";
import { Button } from "./button";
import { Container } from "./container";
import { Heading } from "./heading";
import { SubHeading } from "./subheading";

export const Hero = () => (
  <Container className="flex flex-col items-center justify-center border-divide border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20">
    <Badge text="For fast moving engineering teams." />
    <Heading className="mt-4">
      Manage and simulate <br /> agentic{" "}
      <span className="text-brand">workflows</span>
    </Heading>

    <SubHeading className="mx-auto mt-6 max-w-lg">
      We empower developers and technical teams to create, simulate, and manage
      AI-driven workflows visually
    </SubHeading>

    <div className="mt-6 flex items-center gap-4">
      <Button as={Link} href="/sign-up">
        Start building
      </Button>
      <Button as={Link} href="/pricing" variant="secondary">
        View pricing
      </Button>
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
        Innovative AI solution 2025 by
      </span>
      <GartnerLogoText className="size-12 sm:size-16" />
    </div>
  </Container>
);
