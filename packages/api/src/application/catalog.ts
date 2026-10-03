const DESTRUCTIVE_OPERATION = /delete|remove|revoke/i;

import { Schema } from "effect";
import { allowsIdempotency, IdempotencyKey } from "../contracts/agent-input";
import { ResourceId } from "../contracts/inputs";
import { accountOperations } from "./account";
import { apiKeyOperations } from "./api-key";
import { changelogOperations } from "./changelog";
import { connectionOperations } from "./connection";
import { feedbackOperations } from "./feedback";
import { organizationOperations } from "./organization";
import type { Operation } from "./procedure";
import { activityOperations, referenceOperations } from "./references";
import { settingsOperations } from "./settings";

const groups = {
  account: accountOperations,
  connection: connectionOperations,
  reference: referenceOperations,
  activity: activityOperations,
  feedback: feedbackOperations,
  changelog: changelogOperations,
  settings: settingsOperations,
  apiKey: apiKeyOperations,
  organization: organizationOperations,
};
export const operationCatalog = Object.fromEntries(
  Object.entries(groups).flatMap(([group, operations]) =>
    Object.entries(operations).map(([name, operation]) => [
      `${group}.${name}`,
      operation,
    ])
  )
) as Record<string, Operation<unknown, unknown>>;

const descriptions: Record<string, string> = {
  "account.getProfile":
    "Read your global profile name and image. Email and credentials are never returned.",
  "account.updateProfile":
    "Update your global profile name or image across workspaces; cannot modify another user or change email or credentials.",
  "activity.list":
    "Read organization activity, including delegated actor, operation, outcome and request ID. Requires current membership.",
  "apiKey.list":
    "List masked SDK installation keys for an organization. Requires membership; never returns raw keys or hashes.",
  "apiKey.create":
    "Create an SDK installation key as owner or admin. Returns the raw key once; ten active keys per organization. Idempotency keys are not accepted.",
  "apiKey.update":
    "Rename an SDK installation key or update its description as an owner or admin of its organization.",
  "apiKey.toggleActive":
    "Revoke or restore an SDK installation key as owner or admin. Restoration respects the ten-active-key quota.",
  "apiKey.delete":
    "Permanently delete an SDK installation key as owner or admin. Existing installations using it lose access.",
  "feedback.search":
    "Search organization feedback by text, status, category and updatedSince. Follow nextCursor until null; requires membership.",
  "feedback.getAll":
    "List visible feedback with vote state and optional status/category filters. Private posts are restricted to their author and organization members.",
  "feedback.getById":
    "Read a feedback post and its public author projection. Private posts require author access or organization membership.",
  "feedback.create":
    "Submit feedback in the selected organization. Anonymous access follows organization settings; identified customers remain installation-scoped.",
  "feedback.update":
    "Edit feedback as its author or an organization administrator. Send expectedRevision from the last read to reject stale changes.",
  "feedback.delete":
    "Permanently delete feedback as its author or an organization administrator, including associated comments, votes and references.",
  "feedback.updateStatus":
    "Change feedback status for roadmap management. Requires membership and a post in the selected organization.",
  "feedback.vote":
    "Set a visible feedback post's vote to 1 or -1, or remove it with 0. Anonymous voting follows organization settings.",
  "feedback.getComments":
    "Read replies for a feedback thread you can view. Returns attribution without exposing author email.",
  "feedback.createComment":
    "Reply to a visible feedback thread, optionally under a parent reply. Anonymous comments follow organization settings.",
  "feedback.deleteComment":
    "Delete a reply as its author or an administrator of the feedback's organization.",
  "changelog.getAll":
    "List releases with tag/date filters and pagination. Public readers see published releases; members can include drafts.",
  "changelog.getById":
    "Read a release and its visible linked feedback. Draft releases require organization membership.",
  "changelog.create":
    "Create a draft or published release as owner or admin, optionally linking feedback from the same organization.",
  "changelog.update":
    "Save release content and metadata as owner or admin. Publishing with the update saves the latest content atomically.",
  "changelog.publish":
    "Publish a draft release as owner or admin, making it available through public pages, RSS and widgets.",
  "changelog.delete":
    "Permanently delete a release as owner or admin, removing it from public pages and widgets.",
  "changelog.linkFeedback":
    "Attach feedback from the selected organization to a release as owner or admin.",
  "changelog.unlinkFeedback":
    "Remove feedback links from a release as owner or admin without deleting the feedback itself.",
  "organization.list":
    "List your organizations. Delegated callers see only their granted organization.",
  "organization.get":
    "Read organization details, branding metadata, onboarding and settingsRevision. Requires membership; installation secrets are excluded.",
  "organization.checkSlug":
    "Check whether a proposed organization slug is valid and available. Does not reserve it.",
  "organization.create":
    "Create an organization and make the authenticated user its owner. Grants for another organization do not automatically extend to the new one.",
  "organization.update":
    "Update the organization name, logo or website as owner or admin. Clear an optional logo or website with null.",
  "organization.initializeOnboarding":
    "Initialize the selected organization's onboarding checklist without resetting completed steps. Requires owner or admin.",
  "organization.updateOnboarding":
    "Update an onboarding checklist step for the selected organization. Requires owner or admin.",
  "organization.invite":
    "Create a pending member/admin invitation as owner or admin, returning an existing pending invitation when applicable.",
  "organization.listInvitations":
    "List pending and historical invitations for the selected organization as owner or admin.",
  "organization.cancelInvitation":
    "Cancel a pending invitation in the selected organization as owner or admin. Accepted invitations cannot be cancelled.",
  "settings.getMyRole":
    "Read your current role in the selected organization. Delegated execution rechecks this membership on every call.",
  "settings.updateSettings":
    "Patch branding, feedback, changelog or public-access settings as owner or admin. Omitted fields are preserved; expectedRevision compares organization.settingsRevision.",
  "settings.listMembers":
    "List organization members, optionally filtering by name or email. Requires membership.",
  "settings.updateMemberRole":
    "Change a member's role within the selected organization. Owners manage privileged roles; admins manage members. The final owner cannot be demoted.",
  "settings.removeMember":
    "Remove a member within the selected organization. Owner/admin restrictions apply; self-removal and removal of the final owner are rejected.",
  "settings.deleteOrganization":
    "Permanently delete the selected organization and its content. Requires its current owner and an exact confirmationName matching the organization's name.",
  "reference.list":
    "List implementation URLs attached to a feedback post in the selected organization. Requires membership.",
  "reference.add":
    "Attach an implementation URL, such as an externally created PR, to organization feedback. UserBubble does not execute repository work.",
  "reference.delete":
    "Remove an implementation reference in the selected organization without modifying the external URL's target.",
  "connection.list":
    "List your connected agents and grants. Delegated callers see only grants for their selected organization.",
  "connection.revoke":
    "Revoke one of your agent connections. Delegated callers may revoke only a connection whose grants are all confined to their organization.",
  "connection.listOAuth":
    "List your OAuth MCP connections. Delegated callers see only their selected organization's connections.",
  "connection.revokeOAuth":
    "Revoke one of your OAuth MCP consents immediately. Delegated callers may revoke only consent for their selected organization.",
};
const permissionOverrides: Record<string, string[]> = {
  "apiKey.list": ["organization:member"],
  "apiKey.create": ["organization:admin"],
  "apiKey.update": ["organization:admin"],
  "apiKey.toggleActive": ["organization:admin"],
  "apiKey.delete": ["organization:admin"],
  "feedback.update": ["feedback:author-or-admin"],
  "feedback.delete": ["feedback:author-or-admin"],
  "feedback.deleteComment": ["comment:author-or-admin"],
  "settings.deleteOrganization": [
    "organization:owner",
    "confirmation:exact-name",
  ],
};

function outputJsonSchema(output: Schema.Codec<unknown, unknown>, id: string) {
  const document = Schema.toJsonSchemaDocument(output, {
    onExcessProperty: "error",
  });
  return {
    $id: `urn:userbubble:v2:output:${id}`,
    ...document.schema,
    $defs: document.definitions,
  };
}

function inputJsonSchema(
  operation: Operation<unknown, unknown>,
  id: string
): {
  [key: string]: unknown;
  properties?: Record<string, unknown>;
  required?: readonly string[];
} {
  return {
    ...outputJsonSchema(Schema.toEncoded(operation.inputContract), id),
    $id: `urn:userbubble:v2:input:${id}`,
  };
}

function agentInputJsonSchema(
  operation: Operation<unknown, unknown>,
  id: string
) {
  const input = inputJsonSchema(operation, id);
  return {
    ...input,
    $id: `urn:userbubble:v2:agent-input:${id}`,
    type: "object",
    additionalProperties: false,
    properties: {
      ...input.properties,
      organizationId: Schema.toJsonSchemaDocument(ResourceId).schema,
      ...(allowsIdempotency(id, operation.kind)
        ? { idempotencyKey: Schema.toJsonSchemaDocument(IdempotencyKey).schema }
        : {}),
    },
    required: [...new Set([...(input.required ?? []), "organizationId"])],
  };
}

export function describeOperations() {
  return Object.entries(operationCatalog).map(([id, operation]) => ({
    id,
    description: descriptions[id] ?? "",
    requiredPermissions: permissionOverrides[id] ?? [operation.access],
    access: operation.access,
    readOnly: operation.kind === "query",
    supportsIdempotency: allowsIdempotency(id, operation.kind),
    destructive: DESTRUCTIVE_OPERATION.test(id) || id === "apiKey.toggleActive",
    inputSchema: inputJsonSchema(operation, id),
    agentInputSchema: agentInputJsonSchema(operation, id),
    responseSchema: operation.output
      ? responseJsonSchema(outputJsonSchema(operation.output, id), id)
      : null,
    outputSchema: operation.output
      ? outputJsonSchema(operation.output, id)
      : null,
  }));
}

export function responseJsonSchema(
  output: ReturnType<typeof outputJsonSchema>,
  id: string
) {
  const { $id: _outputId, $defs, ...data } = output;
  return {
    $id: `urn:userbubble:v2:response:${id}`,
    $defs,
    type: "object",
    required: ["data"],
    properties: { data, requestId: { type: "string" } },
  };
}

export function openApiDocument(origin: string) {
  return {
    openapi: "3.1.0",
    info: { title: "UserBubble Management API", version: "2.0.0" },
    servers: [{ url: origin }],
    paths: Object.fromEntries(
      describeOperations().map((operation) => [
        `/api/v2/operations/${operation.id}`,
        {
          post: {
            operationId: operation.id,
            summary: operation.description,
            security: [{ agent: [] }],
            requestBody: {
              required: true,
              content: {
                "application/json": { schema: operation.agentInputSchema },
              },
            },
            responses: {
              "200": {
                description: "Operation result",
                ...(operation.outputSchema
                  ? {
                      content: {
                        "application/json": {
                          schema: responseJsonSchema(
                            operation.outputSchema,
                            operation.id
                          ),
                        },
                      },
                    }
                  : {}),
              },
              "400": { description: "Invalid input" },
              "401": { description: "Authentication required" },
              "403": { description: "Permission denied" },
              "409": { description: "Conflicting update" },
              "429": { description: "Rate limited" },
              "503": { description: "Temporarily unavailable" },
              "504": { description: "Database deadline exceeded" },
              "500": {
                description: "Internal failure or invalid operation result",
              },
            },
          },
        },
      ])
    ),
    components: {
      securitySchemes: {
        agent: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Agent Auth JWT",
        },
      },
    },
  };
}
