import { motion } from "motion/react";

export const VerticalLine = (
  props: React.SVGProps<SVGSVGElement> & { stopColor?: string }
) => (
  <svg
    className="shrink-0"
    fill="none"
    height="81"
    viewBox="0 0 1 81"
    width="1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      stroke="var(--color-line)"
      transform="matrix(0 -1 -1 0 0 80.5)"
      x2="80"
      y1="-0.5"
      y2="-0.5"
    />
    <line
      stroke="url(#vertical-line-gradient-second)"
      transform="matrix(0 -1 -1 0 0 80.5)"
      x2="80"
      y1="-0.5"
      y2="-0.5"
    />
    <defs>
      <motion.linearGradient
        animate={{
          x1: 0,
          x2: 2,
          y1: "80%",
          y2: "100%",
        }}
        gradientUnits="userSpaceOnUse"
        id="vertical-line-gradient-second"
        initial={{
          x1: 0,
          x2: 2,
          y1: "0%",
          y2: "0%",
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="var(--color-line)" />
        <stop offset="0.5" stopColor="#F17463" />
        <stop offset="1" stopColor="var(--color-line)" />
      </motion.linearGradient>
    </defs>
  </svg>
);
