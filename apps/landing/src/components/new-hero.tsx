"use client";

import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { AuthButton } from "./auth-button";
import { Badge } from "./badge";
import { Container } from "./container";
import { Heading } from "./heading";
import { SubHeading } from "./subheading";

export const NewHero = () => (
  <Container className="flex flex-col items-center justify-center border-divide border-x px-4 pt-10 pb-10 md:pt-32 md:pb-20">
    <Badge text="Open Source" />
    <Heading className="mt-4">
      Your users already told you what&apos;s broken.{" "}
      <span className="text-brand">Now let AI fix it.</span>
    </Heading>

    <SubHeading className="mx-auto mt-6 max-w-lg">
      UserBubble turns user feedback into pull requests. No code. No tickets. No
      waiting. You just approve.
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
  </Container>
);
