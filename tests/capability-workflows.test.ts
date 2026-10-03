const MCP_VALIDATION = /validation|invalid|organizationId/i;

import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import Ajv2020 from "ajv/dist/2020";
import { Client as PostgresClient } from "pg";
import { describe, expect, it } from "vitest";
import { createMcpServer } from "../packages/cli/src/mcp";
import { credentialStorage } from "../packages/cli/src/storage";
import { UserBubbleClient } from "../packages/client/src/index";
import {
  account,
  base,
  fixtureFetch,
  local,
  oauthConnection,
  parseMcp,
  retryThrottled,
} from "./helpers/live";

// These are real transport executions against isolated workspaces, not catalog mocks.
const _MCP_VALIDATION = MCP_VALIDATION;
const databaseUrl = process.env.TEST_DATABASE_URL ?? "";
const localDatabase =
  /^postgres(?:ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(
    databaseUrl
  );
describe.skipIf(!(local && localDatabase))(
  "product capability workflows",
  () => {
    it.each(["http", "dashboard", "signed", "cli", "local-mcp", "remote-mcp"])(
      "%s executes the product lifecycle with the shared contracts",
      async (transport) => {
        const workspace = await account();
        const { organizationId, call, headers } = workspace;
        const directory = await mkdtemp(join(tmpdir(), "userbubble-parity-"));
        const client = new UserBubbleClient(base, {
          storage: credentialStorage(directory),
          onApprovalRequired: async (info) => {
            if (
              !(
                "verification_uri_complete" in info &&
                info.verification_uri_complete
              )
            ) {
              throw new Error("Expected interactive approval fixture");
            }
            const approval = new URL(info.verification_uri_complete);
            const response = await call("/api/auth/agent/approve-capability", {
              agent_id: approval.searchParams.get("agent_id"),
              user_code: approval.searchParams.get("code"),
              action: "approve",
              ttl: 300,
            });
            expect(response.status).toBe(200);
          },
        });
        const capabilities = await client.capabilities();
        const schemas = new Ajv2020();
        const inputs = new Map(
          capabilities.map((operation) => [
            operation.id,
            schemas.compile(operation.inputSchema),
          ])
        );
        const connection = await retryThrottled(() =>
          client.connect(
            organizationId,
            capabilities.map(({ id }) => id)
          )
        );
        const remote = await oauthConnection(workspace);
        const server = await createMcpServer(client);
        const mcpClient = new McpClient({ name: "parity", version: "1" });
        const [clientTransport, serverTransport] =
          InMemoryTransport.createLinkedPair();
        await server.connect(serverTransport);
        await mcpClient.connect(clientTransport);
        const sql = new PostgresClient({ connectionString: databaseUrl });
        await sql.connect();
        const fixtureId = `parity-member-${randomBytes(8).toString("hex")}`;
        await sql.query(
          'insert into "user" (id, name, email) values ($1, $2, $3)',
          [fixtureId, "Member fixture", `${fixtureId}@example.test`]
        );
        await sql.query(
          "insert into member (id, user_id, organization_id, role) values ($1, $2, $3, $4)",
          [fixtureId, fixtureId, organizationId, "member"]
        );
        const seen = new Set<string>();
        type Mode = "success" | "denied" | "invalid";
        async function invoke(
          id: string,
          input: Record<string, unknown>,
          mode: Mode
        ) {
          const scoped = { organizationId, ...input };
          if (mode === "success") {
            const validate = inputs.get(id);
            expect(validate, id).toBeDefined();
            const valid = validate?.(JSON.parse(JSON.stringify(scoped)));
            expect(valid, `${id}: ${JSON.stringify(validate?.errors)}`).toBe(
              true
            );
          }
          const delegated = !["http", "dashboard"].includes(transport);
          let bodyInput: number | Record<string, unknown> = scoped;
          if (mode === "invalid") {
            bodyInput = 42;
          } else if (mode === "denied" && delegated) {
            bodyInput = { ...scoped, organizationId: "ungranted-workspace" };
          }
          let result: ReturnType<typeof JSON.parse>;
          if (transport === "http") {
            const response =
              mode === "denied"
                ? await fixtureFetch(`${base}/api/v2/operations/${id}`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Origin: base,
                    },
                    body: JSON.stringify(bodyInput),
                  })
                : await call(`/api/v2/operations/${id}`, bodyInput);
            result = await response.json();
            expect(
              response.status,
              `${id}: ${JSON.stringify(result.error)}`
            ).toBe({ success: 200, invalid: 400, denied: 401 }[mode]);
          } else if (transport === "dashboard") {
            const read = capabilities.find((item) => item.id === id)?.readOnly;
            const payload = JSON.stringify({ 0: { json: bodyInput } });
            const response = await fixtureFetch(
              `${base}/api/trpc/${id}?batch=1${read ? `&input=${encodeURIComponent(payload)}` : ""}`,
              {
                headers:
                  mode === "denied"
                    ? { "Content-Type": "application/json", Origin: base }
                    : headers,
                method: read ? "GET" : "POST",
                ...(read ? {} : { body: payload }),
              }
            );
            const body = await response.json();
            if (mode === "success") {
              expect(body[0].error, id).toBeUndefined();
              result = { data: body[0].result.data.json };
            } else if (mode === "invalid") {
              expect(body[0].error?.json?.data?.code, id).toBe("BAD_REQUEST");
            } else if (["feedback.getAll", "changelog.getAll"].includes(id)) {
              // These public lists must filter private posts/drafts rather than deny public access.
              expect(body[0].result?.data?.json, id).toEqual([]);
            } else {
              expect(["UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND"], id).toContain(
                body[0].error?.json?.data?.code
              );
            }
          } else if (transport === "signed") {
            try {
              result = await Reflect.apply(client.execute, client, [
                connection.agentId,
                id,
                bodyInput,
              ]);
              expect(mode, id).toBe("success");
            } catch (error) {
              if (
                error &&
                typeof error === "object" &&
                "code" in error &&
                error.code === "rate_limited"
              ) {
                throw error;
              }
              expect(mode, id).not.toBe("success");
              expect(error, id).toMatchObject(
                mode === "denied"
                  ? { code: "constraint_violated" }
                  : { status: 400 }
              );
            }
          } else if (transport === "cli") {
            try {
              const processResult = await promisify(execFile)(
                process.execPath,
                [
                  "packages/cli/bin/userbubble.mjs",
                  "call",
                  id,
                  "--url",
                  base,
                  "--org",
                  mode === "denied" ? "ungranted-workspace" : organizationId,
                  "--agent",
                  connection.agentId,
                  "--input",
                  JSON.stringify(bodyInput),
                  "--json",
                ],
                {
                  env: { ...process.env, USERBUBBLE_CONFIG_DIR: directory },
                  timeout: 15_000,
                }
              );
              result = JSON.parse(processResult.stdout);
              expect(mode, id).toBe("success");
            } catch (error) {
              if (
                !(
                  error &&
                  typeof error === "object" &&
                  "stderr" in error &&
                  typeof error.stderr === "string" &&
                  "code" in error
                )
              ) {
                throw error;
              }
              const failure = JSON.parse(error.stderr).error;
              if (failure.code === "rate_limited") {
                throw failure;
              }
              expect(mode, id).not.toBe("success");
              expect(error.code, id).toBe(mode === "denied" ? 3 : 1);
              expect(failure.code, id).toBe(
                mode === "denied" ? "constraint_violated" : "CLI_ERROR"
              );
            }
          } else {
            const response =
              transport === "remote-mcp"
                ? parseMcp(
                    await (
                      await remote("tools/call", {
                        name: id,
                        arguments: bodyInput,
                      })
                    ).text()
                  )
                : {
                    result: await mcpClient.callTool({
                      name: id,
                      arguments: {
                        agentId: connection.agentId,
                        input: bodyInput,
                      },
                    }),
                  };
            const tool = response.result;
            if (tool?.isError && tool.content?.[0]?.text) {
              let failure: ReturnType<typeof JSON.parse>;
              try {
                failure = JSON.parse(tool.content[0].text);
              } catch {
                failure = null;
              }
              if (failure?.code === "rate_limited") {
                throw failure;
              }
            }
            if (mode === "success") {
              expect(response.error, id).toBeUndefined();
              expect(
                tool.isError,
                `${id}: ${JSON.stringify(tool.content)}`
              ).not.toBe(true);
              result = tool.structuredContent;
            } else if (transport === "remote-mcp") {
              if (response.error) {
                expect([-32_602, -32_600], id).toContain(response.error.code);
              } else {
                expect(tool.isError, id).toBe(true);
                expect(tool.content[0].text, id).toMatch(MCP_VALIDATION);
              }
            } else {
              expect(tool.isError, id).toBe(true);
              expect(JSON.parse(tool.content[0].text).code, id).toBe(
                mode === "denied" ? "constraint_violated" : "BAD_REQUEST"
              );
            }
          }
          seen.add(`${mode}:${id}`);
          return result?.data;
        }
        const run = async (id: string, input: Record<string, unknown> = {}) => {
          for (const mode of ["invalid", "denied"] as const) {
            await retryThrottled(() => invoke(id, input, mode));
          }
          return retryThrottled(() => invoke(id, input, "success"));
        };
        try {
          expect((await run("account.getProfile")).name).toBe(
            "Protocol Tester"
          );
          expect(
            (await run("account.updateProfile", { name: "Parity owner" })).name
          ).toBe("Parity owner");
          expect(
            (await run("organization.list")).some(
              (org: { id: string }) => org.id === organizationId
            )
          ).toBe(true);
          expect((await run("organization.get")).id).toBe(organizationId);
          const slug = `parity-${randomBytes(8).toString("hex")}`;
          expect(await run("organization.checkSlug", { slug })).toBe(true);
          const extra = await run("organization.create", {
            name: "Additional workspace",
            slug,
          });
          expect(extra.slug).toBe(slug);
          expect(
            (await run("organization.update", { name: "Lifecycle workspace" }))
              .name
          ).toBe("Lifecycle workspace");
          expect((await run("organization.initializeOnboarding")).success).toBe(
            true
          );
          expect(
            (
              await run("organization.updateOnboarding", {
                steps: { installWidget: true },
              })
            ).success
          ).toBe(true);
          expect(await run("settings.getMyRole")).toBe("owner");
          const settings = await run("settings.updateSettings", {
            settings: { branding: { primaryColor: "#112233" } },
          });
          expect(JSON.parse(settings.metadata).branding.primaryColor).toBe(
            "#112233"
          );
          expect((await run("settings.listMembers")).length).toBe(2);
          expect(
            (
              await run("settings.updateMemberRole", {
                memberId: fixtureId,
                role: "admin",
              })
            ).success
          ).toBe(true);
          expect(
            (await run("settings.listMembers")).find(
              (member: { id: string }) => member.id === fixtureId
            ).role
          ).toBe("admin");
          expect(
            (await run("settings.removeMember", { memberId: fixtureId }))
              .success
          ).toBe(true);
          expect((await run("settings.listMembers")).length).toBe(1);
          const invitation = await run("organization.invite", {
            email: "lifecycle@example.test",
            role: "member",
          });
          expect(
            (await run("organization.listInvitations")).some(
              (item: { id: string }) => item.id === invitation.id
            )
          ).toBe(true);
          expect(
            (
              await run("organization.cancelInvitation", {
                invitationId: invitation.id,
              })
            ).status
          ).toBe("cancelled");
          const key = await run("apiKey.create", { name: "Lifecycle SDK" });
          expect(key.rawKey).toBeTypeOf("string");
          expect((await run("apiKey.list"))[0].id).toBe(key.apiKey.id);
          expect(
            (
              await run("apiKey.update", {
                id: key.apiKey.id,
                name: "Renamed SDK",
              })
            ).name
          ).toBe("Renamed SDK");
          expect(
            (
              await run("apiKey.toggleActive", {
                id: key.apiKey.id,
                isActive: false,
              })
            ).isActive
          ).toBe(false);
          expect(
            (await run("apiKey.delete", { id: key.apiKey.id })).success
          ).toBe(true);
          const post = await run("feedback.create", {
            title: "Lifecycle feedback",
            description: "Enough context for external agents",
            isPublic: false,
            category: "bug",
          });
          expect((await run("feedback.getAll"))[0].post.id).toBe(post.id);
          expect((await run("feedback.getById", { id: post.id })).post.id).toBe(
            post.id
          );
          expect(
            (await run("feedback.search", { query: "Lifecycle", limit: 1 }))
              .items[0].post.id
          ).toBe(post.id);
          expect(
            (
              await run("feedback.update", {
                id: post.id,
                title: "Updated lifecycle",
                expectedRevision: post.revision,
              })
            ).title
          ).toBe("Updated lifecycle");
          expect(
            (
              await run("feedback.updateStatus", {
                postId: post.id,
                status: "planned",
              })
            ).status
          ).toBe("planned");
          expect(
            (await run("feedback.vote", { postId: post.id, value: 1 })).success
          ).toBe(true);
          const comment = await run("feedback.createComment", {
            postId: post.id,
            content: "Implemented externally",
          });
          expect(
            (await run("feedback.getComments", { postId: post.id }))[0].comment
              .id
          ).toBe(comment.comment.id);
          const reference = await run("reference.add", {
            postId: post.id,
            title: "Implementation",
            url: "https://example.test/pull/1",
          });
          expect((await run("reference.list", { postId: post.id }))[0].id).toBe(
            reference.id
          );
          expect(
            (await run("reference.delete", { id: reference.id })).success
          ).toBe(true);
          const release = await run("changelog.create", {
            title: "Lifecycle release",
            description: "Published changes",
          });
          expect((await run("changelog.getAll"))[0].id).toBe(release.id);
          expect((await run("changelog.getById", { id: release.id })).id).toBe(
            release.id
          );
          expect(
            (
              await run("changelog.update", {
                id: release.id,
                title: "Updated release",
                expectedRevision: release.revision,
              })
            ).title
          ).toBe("Updated release");
          await run("changelog.linkFeedback", {
            entryId: release.id,
            expectedRevision: (
              await run("changelog.getById", { id: release.id })
            ).revision,
            feedbackPostIds: [post.id],
          });
          await run("changelog.unlinkFeedback", {
            entryId: release.id,
            expectedRevision: (
              await run("changelog.getById", { id: release.id })
            ).revision,
            feedbackPostIds: [post.id],
          });
          const publishedRelease = await run("changelog.publish", {
            id: release.id,
            expectedRevision: (
              await run("changelog.getById", { id: release.id })
            ).revision,
          });
          expect(publishedRelease.isPublished).toBe(true);
          expect(
            (
              await run("changelog.delete", {
                id: release.id,
                expectedRevision: publishedRelease.revision,
              })
            ).success
          ).toBe(true);
          expect(
            (await run("feedback.deleteComment", { id: comment.comment.id }))
              .success
          ).toBe(true);
          expect((await run("feedback.delete", { id: post.id })).success).toBe(
            true
          );
          expect(Array.isArray(await run("activity.list"))).toBe(true);
          expect(
            (await run("connection.list")).some(
              (item: { id: string }) => item.id === connection.agentId
            )
          ).toBe(true);
          const initialConsents = await run("connection.listOAuth");
          expect(initialConsents.length).toBe(1);
          // Revoke disposable connections, preserving this transport's authority until deletion.
          const disposable = await retryThrottled(() =>
            client.connect(organizationId, ["account.getProfile"])
          );
          expect(
            (await run("connection.revoke", { agentId: disposable.agentId }))
              .success
          ).toBe(true);
          await oauthConnection(workspace);
          const consents = await (
            await call("/api/v2/operations/connection.listOAuth", {})
          ).json();
          expect(
            (
              await run("connection.revokeOAuth", {
                consentId: consents.data.find(
                  (item: { id: string }) => item.id !== initialConsents[0].id
                ).id,
              })
            ).success
          ).toBe(true);
          expect(
            (
              await run("settings.deleteOrganization", {
                confirmationName: "Lifecycle workspace",
              })
            ).success
          ).toBe(true);
          expect([...seen].sort()).toEqual(
            capabilities
              .flatMap(({ id }) =>
                ["success", "invalid", "denied"].map((mode) => `${mode}:${id}`)
              )
              .sort()
          );
          await mkdir(".context/capability-parity", { recursive: true });
          await writeFile(
            `.context/capability-parity/${transport}.json`,
            JSON.stringify(
              {
                transport,
                verifiedAt: new Date().toISOString(),
                operations: capabilities.map(({ id }) => ({
                  id,
                  success: seen.has(`success:${id}`),
                  invalidInput: seen.has(`invalid:${id}`),
                  authorization:
                    transport === "dashboard" &&
                    ["feedback.getAll", "changelog.getAll"].includes(id)
                      ? "public-list-filters-private-content"
                      : "unauthorized-or-ungranted-call-denied",
                })),
              },
              null,
              2
            )
          );
          await call("/api/v2/operations/settings.deleteOrganization", {
            organizationId: extra.id,
            confirmationName: extra.name,
          });
        } finally {
          await sql.query('delete from "user" where id = $1', [fixtureId]);
          await sql.end();
          await mcpClient.close();
          await server.close();
          client.agent.destroy();
          await rm(directory, { recursive: true, force: true });
        }
      },
      360_000
    );
  }
);
