import { motion } from "motion/react";

export const HorizontalLine = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="2"
    viewBox="0 0 314 2"
    width="314"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      stroke="var(--color-gray-400)"
      strokeLinecap="round"
      x1="0.5"
      x2="313.5"
      y1="1"
      y2="1"
    />
    <line
      stroke="url(#horizontal-line-gradient)"
      strokeLinecap="round"
      x1="0.5"
      x2="313.5"
      y1="1"
      y2="1"
    />
    <defs>
      <motion.linearGradient
        animate={{
          y1: 0,
          y2: 1,
          x1: "110%",
          x2: "120%",
        }}
        gradientUnits="userSpaceOnUse"
        id="horizontal-line-gradient"
        initial={{
          y1: 0,
          y2: 1,
          x1: "-10%",
          x2: "0%",
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="#EAEDF1" />
        <stop offset="0.5" stopColor="var(--color-blue-500)" />
        <stop offset="1" stopColor="#EAEDF1" />
      </motion.linearGradient>
    </defs>
  </svg>
);
