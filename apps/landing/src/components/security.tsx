import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";
import { Container } from "./container";
import { DivideX } from "./divide";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

export const Security = () => (
  <>
    <Container className="border-divide border-x">
      <h2 className="pt-10 pb-5 text-center font-mono text-neutral-500 text-sm uppercase tracking-tight md:pt-20 md:pb-10 dark:text-neutral-400">
        FOR SECURITY FIRST TEAMS
      </h2>
    </Container>
    <DivideX />
    <Container className="grid grid-cols-1 border-divide border-x bg-gray-100 px-8 py-12 md:grid-cols-2 dark:bg-neutral-900">
      <div>
        <SectionHeading className="text-left">
          Scale securely with confidence
        </SectionHeading>
        <SubHeading as="p" className="mt-4 text-left">
          Our AI assistant is designed with enterprise-grade security practices
          and compliant with global data protection standards.
        </SubHeading>
        <Button
          as={Link}
          className="mt-4 mb-8 inline-block w-full md:w-auto"
          href="/pricing"
        >
          Start for free
        </Button>
      </div>
      <div className="flex items-center justify-center gap-10">
        <Image
          alt="CCPA"
          className="h-auto w-14"
          draggable={false}
          height={100}
          src="/logos/CCPA.png"
          width={100}
        />
        <Image
          alt="GDPR"
          className="h-auto w-14"
          draggable={false}
          height={100}
          src="/logos/GDPR.png"
          width={100}
        />
        <Image
          alt="ISO"
          className="h-auto w-14"
          draggable={false}
          height={100}
          src="/logos/ISO.png"
          width={100}
        />
      </div>
    </Container>
  </>
);
