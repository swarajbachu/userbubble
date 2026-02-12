/** biome-ignore-all lint/suspicious/noExplicitAny: CSS custom properties use any for dynamic style values */
"use client";

import Image from "next/image";
import type React from "react";
import { cn } from "@/lib/utils";
import { AuthButton } from "./auth-button";
import { Container } from "./container";
import { SectionHeading } from "./seciton-heading";

type LogoItem = {
  src: string;
  alt: string;
  className?: string;
};

export type CTAOrbitProps = {
  size?: number;
  className?: string;
  showRings?: boolean;
  ringDurationsSec?: number[];
  numRings?: number;
};

export const CTA = () => (
  <Container className="relative flex min-h-60 flex-col items-center justify-center overflow-hidden border-divide border-x px-4 py-4 md:min-h-120">
    <CTAOrbit className="-top-120 mask-b-from-30% absolute inset-x-0" />
    <SectionHeading className="relative z-10 text-center lg:text-6xl">
      Start collecting feedback
      <br /> from mobile users
    </SectionHeading>
    <p className="relative z-10 mt-4 text-center text-gray-600 dark:text-neutral-300">
      Join mobile developers building better apps with real user feedback.
    </p>
    <div className="relative z-20">
      <AuthButton className="mt-4" />
    </div>
    <p className="relative z-10 mt-2 text-center text-gray-500 text-xs dark:text-neutral-400">
      Free forever • Open source • Self-hostable
    </p>
  </Container>
);

export const CTAOrbit: React.FC<CTAOrbitProps> = ({
  size = 800,
  className,
  showRings = true,
  ringDurationsSec,
  numRings = 3,
}) => {
  const logos: LogoItem[] = [
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
    { src: "/logos/frameworks/swift.svg", alt: "Swift", className: "" },
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
    { src: "/logos/frameworks/swift.svg", alt: "Swift", className: "" },
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
    { src: "/logos/frameworks/swift.svg", alt: "Swift", className: "" },
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
    { src: "/logos/frameworks/swift.svg", alt: "Swift", className: "" },
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
    { src: "/logos/frameworks/swift.svg", alt: "Swift", className: "" },
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
    { src: "/logos/frameworks/swift.svg", alt: "Swift", className: "" },
    { src: "/logos/frameworks/react.svg", alt: "React Native", className: "" },
  ];
  const total = logos.length;

  // Compute ring weights (fewer inner, more outer): proportional 1..numRings
  const weights = Array.from({ length: numRings }, (_, i) => i + 1); // [1,2,...]
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const countsBase = weights.map((w) => Math.floor((total * w) / weightSum));
  let remainder = total - countsBase.reduce((a, b) => a + b, 0);
  // Distribute remainder from outermost inward to favor outer rings
  for (let i = numRings - 1; i >= 0 && remainder > 0; i--) {
    countsBase[i] = (countsBase[i] ?? 0) + 1;
    remainder -= 1;
  }
  const counts: number[] = countsBase; // inner→outer

  let cursor = 0;
  const rings: LogoItem[][] = counts.map((count) => {
    const slice = logos.slice(cursor, cursor + count);
    cursor += count;
    return slice;
  });

  // Dynamic ring scales (inner→outer)
  const innerScale = 0.42;
  const outerScale = 0.94;
  const ringScaleFactors: number[] =
    numRings <= 1
      ? [(innerScale + outerScale) / 2]
      : Array.from(
          { length: numRings },
          (_, i) =>
            innerScale + ((outerScale - innerScale) * i) / (numRings - 1)
        );

  const renderRing = (ringIndex: number) => {
    const ringLogos = rings[ringIndex];
    const count = ringLogos?.length;
    if (count === 0) {
      return null;
    }

    if (typeof ringScaleFactors[ringIndex] === "undefined") {
      return null;
    }

    const diameter = Math.round(size * ringScaleFactors[ringIndex]);
    const radius = diameter / 2;
    const defaultBase = 18;
    const defaultStep = 8;
    const duration =
      ringDurationsSec?.[ringIndex] ?? defaultBase + defaultStep * ringIndex;
    const reverse = ringIndex % 2 === 1;

    return (
      <div
        className={cn(
          "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10 rounded-full",
          reverse ? "animate-counter-orbit" : "animate-orbit"
        )}
        key={`ring-${ringIndex}`}
        style={{
          width: diameter,
          height: diameter,
          ["--duration" as any]: `${duration}s`,
        }}
      >
        <div className="relative h-full w-full">
          {typeof count === "number" &&
            count > 0 &&
            ringLogos?.map((logo, idx) => {
              const angleDeg = (360 / count) * idx;
              const translate = radius;
              return (
                <div
                  className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"
                  key={`ring-${ringIndex}-logo-${idx}`}
                  style={{
                    transform: `rotate(${angleDeg}deg) translateX(${translate}px)`,
                  }}
                >
                  <div style={{ transform: `rotate(${-angleDeg}deg)` }}>
                    <div
                      className={cn(
                        "flex size-14 items-center justify-center rounded-md bg-white shadow-aceternity dark:bg-neutral-950",
                        reverse ? "animate-orbit" : "animate-counter-orbit"
                      )}
                      style={{
                        ["--duration" as any]: `${duration}s`,
                      }}
                    >
                      <Image
                        alt={logo.alt}
                        className={cn("size-8 shrink-0", logo.className)}
                        height={32}
                        src={logo.src}
                        unoptimized
                        width={32}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "relative mx-auto flex items-center justify-center",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showRings && (
        <div className="pointer-events-none absolute inset-0 z-0">
          {Array.from({ length: numRings }, (_, idx) => numRings - 1 - idx).map(
            (i) => {
              const scaleFactor = ringScaleFactors?.[i] ?? 1;
              const diameter = Math.round(size * scaleFactor);
              return (
                <div
                  className={cn(
                    "-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 rounded-full shadow-inner",
                    i === 0 && "bg-neutral-300 dark:bg-neutral-500",
                    i === 1 && "bg-neutral-200 dark:bg-neutral-600",
                    i === 2 && "bg-neutral-100 dark:bg-neutral-700",
                    i === 3 && "bg-neutral-50 dark:bg-neutral-800"
                  )}
                  key={`bg-ring-${i}`}
                  style={{
                    width: diameter,
                    height: diameter,
                  }}
                />
              );
            }
          )}
        </div>
      )}
      {Array.from({ length: numRings }, (_, idx) => numRings - 1 - idx).map(
        (ringIndex) => renderRing(ringIndex)
      )}
    </div>
  );
};
