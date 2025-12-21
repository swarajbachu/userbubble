import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Container } from "@/components/container";
import { CTA } from "@/components/cta";
import { DivideX } from "@/components/divide";
import { ScalesContainer } from "@/components/scales-container";
import { SectionHeading } from "@/components/seciton-heading";
import { SubHeading } from "@/components/subheading";
import { type Career, careers } from "@/constants/careers";
import {
  BoltIcon,
  CloudCheckIcon,
  HeartHandsIcon,
  ShieldSplitIcon,
  SparklesIcon,
  TelescopeIcon,
} from "@/icons/card-icons";
import { getSEOTags } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = getSEOTags({
  title: "Careers - Aceternity",
  description:
    "We're Building the Future of Agent-Driven Development. Founded by engineers and AI researchers, Notus was born out of a simple frustration: building intelligent systems still required too much manual orchestration. We set out to change that by creating a tool that lets teams design, simulate, and launch autonomous agents visually and intuitively.",
});

export default function CareersPage() {
  const images = [
    {
      src: "/team/1.png",
      className: "lg:col-span-2 col-span-1",
    },
    {
      src: "/team/2.png",
      className: "lg:col-span-2 col-span-1",
    },
    {
      src: "/team/3.png",
      className: "lg:col-span-4 col-span-1",
    },
    {
      src: "/team/4.png",
      className: "lg:col-span-3 col-span-1",
    },
    {
      src: "/team/5.png",
      className: "lg:col-span-3 col-span-1",
    },
    {
      src: "/team/6.png",
      className: "lg:col-span-2 col-span-1",
    },
  ];

  const uniqueDepartments = [
    ...new Set(careers.map((career) => career.department)),
  ];

  const why = [
    {
      title: "Complete Ownership",
      description:
        "You will own your work and be able to see the impact of your work on the company.",
      icon: <CloudCheckIcon className="size-6 text-brand" />,
    },
    {
      title: "High-Paced Environment",
      description:
        "Move fast and ship quality. We operate at startup velocity with enterprise precision.",
      icon: <BoltIcon className="size-6 text-brand" />,
    },
    {
      title: "Absolute Integrity",
      description:
        "We do what we say. Transparency and honesty guide every decision and interaction.",
      icon: <ShieldSplitIcon className="size-6 text-brand" />,
    },
    {
      title: "People-First Culture",
      description:
        "Your growth, well-being, and success are fundamental to our mission.",
      icon: <HeartHandsIcon className="size-6 text-brand" />,
    },
    {
      title: "Meaningful Impact",
      description:
        "Build technology that transforms how millions of teams work. Your code matters.",
      icon: <SparklesIcon className="size-6 text-brand" />,
    },
    {
      title: "Vision Driven",
      description:
        "Join us in reimagining the future of work through autonomous AI systems.",
      icon: <TelescopeIcon className="size-4 text-brand" />,
    },
  ];
  return (
    <main>
      <DivideX />
      <Container className="flex flex-col items-center border-divide border-x pb-20">
        <div className="grid grid-cols-1 divide-divide border-divide border-b lg:grid-cols-2 lg:divide-x">
          <div className="flex flex-col items-start justify-start px-4 py-10 md:px-8 md:py-32">
            <Badge text="Careers" />
            <SectionHeading className="mt-4 text-left">
              Let's Change How Modern <br />
              Enterprise Teams Function
            </SectionHeading>
            <SubHeading className="mt-6 mr-auto max-w-md text-left">
              Building a generational company requires exceptional, hard-working
              people. We are tackling the complexities of commerce
              infrastructure that no one else has dared to.
            </SubHeading>
            <Button className="mt-4">View Roles</Button>

            <h2 className="mt-8 text-left font-mono text-neutral-500 text-sm uppercase tracking-tight">
              Our Investors
            </h2>
            <div className="mt-8 grid w-full grid-cols-3 items-start justify-start gap-10 md:grid-cols-3">
              <div className="relative h-10">
                <Image
                  alt="Investor 1"
                  className="absolute inset-0 h-6 w-full object-contain dark:invert dark:filter"
                  height={120}
                  src="/logos/y-combinator.png"
                  width={120}
                />
              </div>
              <div className="relative h-10">
                <Image
                  alt="Investor 2"
                  className="absolute inset-0 h-6 w-full object-contain dark:invert dark:filter"
                  height={70}
                  src="/logos/accel.png"
                  width={70}
                />
              </div>
              <div className="relative h-10">
                <Image
                  alt="Investor 3"
                  className="absolute inset-0 h-6 w-full object-contain dark:invert dark:filter"
                  height={140}
                  src="/logos/softbank.png"
                  width={140}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center divide-y divide-divide border-divide">
            {careers.slice(0, 3).map((career, _index) => (
              <Link
                className="block cursor-pointer px-4 py-4 hover:bg-gray-100 md:px-8 dark:hover:bg-neutral-800"
                href={career.href}
                key={career.id}
              >
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <h3 className="font-medium text-brand">{career.title}</h3>
                  <div className="hidden size-1 rounded-full bg-gray-400 sm:block dark:bg-neutral-600" />
                  <p className="text-gray-600 text-sm dark:text-neutral-400">
                    {career.location}
                  </p>
                  <div className="hidden size-1 rounded-full bg-gray-400 sm:block dark:bg-neutral-600" />
                  <span className="font-medium text-gray-600 text-xs dark:text-neutral-400">
                    {Math.floor(
                      (Date.now() - new Date(career.createdAt).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{" "}
                    days ago
                  </span>
                </div>
                <p className="mt-2 font-medium text-neutral-500 dark:text-neutral-200">
                  {career.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Container>
      <Container className="border-divide border-x border-b px-4 pb-20 md:px-8">
        <div className="flex w-full flex-col items-center py-10 md:py-20 lg:flex-row">
          <h2 className="mb-4 min-w-40 text-center font-mono text-neutral-500 text-sm uppercase tracking-tight lg:mb-0 lg:text-left dark:text-neutral-400">
            As featured in
          </h2>
          <div className="grid w-full grid-cols-2 items-center gap-4 md:grid-cols-4">
            <Image
              alt="Bloomberg"
              className="h-6 w-full object-contain dark:invert dark:filter"
              height={140}
              src="/logos/bloomberg.png"
              width={140}
            />
            <Image
              alt="Bloomberg"
              className="h-6 w-full object-contain dark:invert dark:filter"
              height={140}
              src="/logos/wired.png"
              width={140}
            />
            <Image
              alt="Bloomberg"
              className="h-6 w-full object-contain dark:invert dark:filter"
              height={140}
              src="/logos/forbes.png"
              width={140}
            />
            <Image
              alt="Bloomberg"
              className="h-6 w-full object-contain dark:invert dark:filter"
              height={140}
              src="/logos/the-guardian.png"
              width={140}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-8">
          {images.map((image) => (
            <ScalesContainer
              className={cn("h-80 w-full", image.className)}
              key={`${image.src}careers`}
            >
              <Image
                alt="Team"
                className={cn(
                  "h-80 w-full rounded-2xl object-cover object-top",
                  image.className
                )}
                height={400}
                src={image.src}
                width={400}
              />
            </ScalesContainer>
          ))}
        </div>
      </Container>
      <Container className="flex flex-col items-center border-divide border-x border-b py-16 pb-20">
        <Badge text="Open Roles" />
        <SectionHeading className="mt-4 px-4 text-center">
          Checkout Our Open Roles
        </SectionHeading>
        <div className="mt-12 w-full">
          {uniqueDepartments.map((department) => (
            <JobSection
              jobs={careers.filter(
                (career) => career.department === department
              )}
              key={department}
              title={department}
            />
          ))}
        </div>
      </Container>
      <Container className="flex flex-col items-center border-divide border-x border-b py-16 pb-20">
        <Badge text="Goals" />
        <SectionHeading className="mt-4 px-4 text-center">
          Why Work at Nodus?
        </SectionHeading>
        <div className="mt-12 grid grid-cols-1 gap-10 px-4 md:grid-cols-2 md:px-8 lg:grid-cols-3">
          {why.map((useCase, _index) => (
            <div
              className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 md:p-5 dark:bg-neutral-800"
              key={useCase.title}
            >
              <div className="flex items-center gap-2">{useCase.icon}</div>
              <h3 className="mt-4 mb-2 font-medium text-lg">{useCase.title}</h3>
              <p className="text-gray-600">{useCase.description}</p>
            </div>
          ))}
        </div>
      </Container>

      <CTA />
      <DivideX />
    </main>
  );
}

const Row = ({ job, index }: { job: Career; index: number }) => (
  <Link
    className="group flex flex-col px-4 py-4 hover:bg-gray-100 md:flex-row md:items-center md:justify-between md:px-8 dark:hover:bg-neutral-800"
    href={job.href}
  >
    <div className="flex items-center gap-6">
      <span className="font-mono text-gray-500 text-sm group-hover:text-brand dark:text-neutral-400">
        {String(index + 1).padStart(2, "0")}
      </span>

      <h3 className="font-medium text-charcoal-700 text-lg dark:text-neutral-100">
        {job.title}
      </h3>
    </div>
    <div className="flex items-center gap-2 pl-10 md:pl-0">
      <p className="text-gray-600 text-sm dark:text-neutral-400">
        {job.location}
      </p>
      <svg
        className="hidden h-5 w-5 text-gray-400 transition duration-200 group-hover:translate-x-1 group-hover:text-brand md:block"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          d="M9 5l7 7-7 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
    </div>
  </Link>
);

const JobSection = ({ title, jobs }: { title: string; jobs: Career[] }) => (
  <div className="mb-12 border-divide border-b">
    <h2 className="bg-gray-50 px-4 py-4 font-semibold text-charcoal-700 text-xl md:px-8 dark:bg-neutral-800 dark:text-neutral-100">
      {title}
    </h2>
    <div className="divide-y divide-divide">
      {jobs.map((job, index) => (
        <Row index={index} job={job} key={job.id} />
      ))}
    </div>
  </div>
);
