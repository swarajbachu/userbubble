import { source } from "@/lib/source";

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();

  const lines = [
    "# Userbubble",
    "",
    "> Userbubble is an embeddable feedback widget and board for collecting user feedback. It provides Web and React Native SDKs.",
    "",
    "For the full documentation content, see [/llms-full.txt](https://docs.userbubble.com/llms-full.txt).",
    "",
    "## Docs",
    "",
    ...pages.map((page) => {
      const description = page.data.description
        ? `: ${page.data.description}`
        : "";
      return `- [${page.data.title}](https://docs.userbubble.com${page.url})${description}`;
    }),
  ];

  return new Response(lines.join("\n"));
}
