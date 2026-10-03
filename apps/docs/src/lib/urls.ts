export const docsOrigin = new URL(
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.userbubble.com"
);

export const docsUrl = (path: string) => new URL(path, docsOrigin).href;
