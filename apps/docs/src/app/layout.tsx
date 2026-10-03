import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { docsOrigin } from "@/lib/urls";
import "./global.css";

export const metadata: Metadata = {
  metadataBase: docsOrigin,
  title: {
    default: "UserBubble Documentation",
    template: "%s | UserBubble Docs",
  },
  description:
    "Integrate UserBubble SDKs and widgets, and connect your agents through the API, CLI, and MCP.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html className="font-sans" lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
