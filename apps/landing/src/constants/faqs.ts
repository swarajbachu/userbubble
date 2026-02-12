export const faqs = [
  {
    question: "Which frameworks and platforms does UserBubble support?",
    answer:
      "We currently support React Native (both Expo and bare workflows) for iOS and Android. Native Swift and Kotlin SDKs are coming soon.",
  },
  {
    question: "How hard is it to integrate UserBubble into my app?",
    answer:
      "Most developers integrate UserBubble in under 5 minutes. Install our SDK via npm (for React Native), import the widget component, and pass your project ID. No backend setup, no API configuration, no complicated authentication flows. Just drop in the component and you're live.",
  },
  {
    question: "Will UserBubble slow down my app?",
    answer:
      "No. Our SDK is under 10KB and lazy-loads by default. It has zero impact on your app startup time. We've optimized for performance on both iOS and Android.",
  },
  {
    question: "Can I use UserBubble across multiple mobile apps?",
    answer:
      "Yes! Use our React Native SDK for cross-platform mobile apps, or use native Swift and Kotlin SDKs (coming soon) for platform-specific implementations. All feedback flows into one unified dashboard, so you can see votes and requests across all your apps.",
  },
  {
    question: "Do you have documentation for each SDK?",
    answer:
      "Yes. We provide clear, framework-specific guides for React Native and Swift (with Kotlin coming soon). Each guide includes quick-start examples, API references, and troubleshooting tips. Visit our docs to get started.",
  },
  {
    question: "Can I customize the look and feel of the feedback widget?",
    answer:
      "Yes! All our SDKs support custom theming. You can customize colors, fonts, and styles to match your brand. White-label options are included for free — no paid plans required.",
  },
  {
    question: "Is UserBubble really free?",
    answer:
      "Yes! UserBubble is completely free and open source under the MIT license. You can use our hosted version or self-host it on your own infrastructure. There are no paid tiers, usage limits, or hidden fees.",
  },
  {
    question: "Can I self-host UserBubble?",
    answer:
      "Absolutely. UserBubble is designed to be self-hostable. Clone the repository, configure your environment variables, and deploy wherever you like — Vercel, Docker, or any Node.js hosting provider. Full instructions are in the README.",
  },
];
