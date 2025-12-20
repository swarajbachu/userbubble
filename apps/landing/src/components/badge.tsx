import { ShimmerText } from "./shimmer-text";

export const Badge = ({ text }: { text: string }) => (
  <ShimmerText
    className="font-normal text-sm [--base-color:var(--color-brand)] [--base-gradient-color:var(--color-white)] dark:[--base-color:var(--color-brand)] dark:[--base-gradient-color:var(--color-white)]"
    duration={1.2}
  >
    {text}
  </ShimmerText>
);
