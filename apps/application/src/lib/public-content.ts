import "server-only";
import {
  changelogOperations,
  executeOperation,
} from "@userbubble/api/management";
import { cache } from "react";
import sanitizeHtml from "sanitize-html";
import { auth } from "~/auth/server";

// Public pages always use anonymous reads, even when their visitor is an owner.
const context = () => ({
  authApi: auth.api,
  session: null,
  identifiedOrgId: null,
  isIdentified: false,
});
export const publicReleases = cache((organizationId: string, page = 1) =>
  executeOperation(changelogOperations.getAll, context(), {
    organizationId,
    published: true,
    limit: 21,
    offset: (page - 1) * 20,
  })
);
export const publicRelease = cache((id: string) =>
  executeOperation(changelogOperations.getById, context(), { id })
);
export function publicUrl(slug: string, path = "") {
  const app = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  const origin =
    base && !["localhost", "127.0.0.1"].includes(app.hostname)
      ? `https://${slug}.${base}`
      : `${app.origin}/external/${encodeURIComponent(slug)}`;
  return `${origin}${path}`;
}
export { releaseHtml } from "@userbubble/api/management";
export const contentText = (html: string) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
export const jsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
