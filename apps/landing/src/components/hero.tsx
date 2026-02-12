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
    <Badge text="Free & Open Source" />
    <Heading className="mt-4">
      Feedback collection for <span className="text-brand">any app</span>
    </Heading>

    <SubHeading className="mx-auto mt-6 max-w-lg">
      Lightweight SDKs for web, mobile, and desktop. Collect feedback, feature
      requests, and votes directly from your users.
    </SubHeading>

    <div className="mt-6 flex items-center gap-4">
      <AuthButton className="px-4 py-4" />
      <Link
        href="https://github.com/swarajbachu/userbubble"
        rel="noopener"
        target="_blank"
      >
        <Button className="px-4 py-4" size="lg" variant="secondary">
          View on GitHub
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
        Loved by developers everywhere
      </span>
      <GartnerLogoText className="size-12 sm:size-16" />
    </div>
  </Container>
);
