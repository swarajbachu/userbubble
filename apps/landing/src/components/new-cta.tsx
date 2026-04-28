import { AuthButton } from "./auth-button";
import { Container } from "./container";
import { CTAOrbit } from "./cta";
import { SectionHeading } from "./seciton-heading";

export const NewCTA = () => (
  <Container className="relative flex min-h-60 flex-col items-center justify-center overflow-hidden border-divide border-x px-4 py-4 md:min-h-120">
    <CTAOrbit className="-top-120 mask-b-from-30% absolute inset-x-0" />
    <SectionHeading className="relative z-10 text-center lg:text-6xl">
      Stop being the bottleneck
      <br /> between your users and your code.
    </SectionHeading>
    <p className="relative z-10 mt-4 text-center text-gray-600 dark:text-neutral-300">
      Your users are already telling you what&apos;s wrong. Let UserBubble turn
      their words into fixes.
    </p>
    <div className="relative z-20">
      <AuthButton className="mt-4" />
    </div>
    <p className="relative z-10 mt-2 text-center text-gray-500 text-xs dark:text-neutral-400">
      Free forever &middot; Open source &middot; No credit card required
    </p>
  </Container>
);
