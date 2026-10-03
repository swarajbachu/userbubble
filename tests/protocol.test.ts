import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createMcpServer } from "../packages/cli/src/mcp";
import { credentialStorage } from "../packages/cli/src/storage";
import { UserBubbleClient } from "../packages/client/src/index";
import { identify as identifyNative } from "../sdks/core/src/auth";
import { identify as identifyWeb } from "../sdks/web/src/core/auth";
import { WidgetApiClient } from "../sdks/web/src/widget/api-client";

import {
  account,
  base,
  fixtureFetch,
  local,
  oauthConnection,
  parseMcp,
  retryThrottled,
} from "./helpers/live";

describe.skipIf(!local)("live agent protocols", () => {
  it("approves signed grants, retries replies once, denies other organizations and revokes immediately", async () => {
    const { call, organizationId, headers: ownerHeaders } = await account();
    for (const origin of ["https://untrusted.example", null]) {
      const headers = new Headers(ownerHeaders);
      if (origin) {
        headers.set("Origin", origin);
      } else {
        headers.delete("Origin");
      }
      const denied = await fixtureFetch(
        `${base}/api/v2/operations/account.getProfile`,
        {
          method: "POST",
          headers,
          body: "{}",
        }
      );
      expect(denied.status).toBe(403);
      expect((await denied.json()).error.code).toBe("FORBIDDEN");
    }
    const configDirectory = await mkdtemp(
      join(tmpdir(), "userbubble-protocol-cli-")
    );
    const client = new UserBubbleClient(base, {
      storage: credentialStorage(configDirectory),
      onApprovalRequired: async (info) => {
        if (
          !(
            "verification_uri_complete" in info &&
            info.verification_uri_complete
          )
        ) {
          throw new Error("Expected device approval");
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
    const execute = (...args: Parameters<typeof client.execute>) =>
      retryThrottled(() => client.execute(...args));
    try {
      const capabilities = await client.capabilities();
      expect(
        capabilities.find(({ id }) => id === "account.getProfile")?.outputSchema
      ).toMatchObject({
        type: "object",
        properties: { id: { type: "string" }, name: { type: "string" } },
      });
      const connection = await client.connect(organizationId, [
        "feedback.create",
        "feedback.createComment",
        "feedback.getAll",
        "account.updateProfile",
        "account.getProfile",
        "organization.invite",
        "organization.listInvitations",
        "organization.cancelInvitation",
        "reference.add",
        "reference.list",
        "activity.list",
        "settings.updateSettings",
        "organization.get",
      ]);
      const runCli = (args: string[]) =>
        retryThrottled(() =>
          promisify(execFile)(
            process.execPath,
            [
              "packages/cli/bin/userbubble.mjs",
              ...args,
              "--url",
              base,
              "--agent",
              connection.agentId,
              "--json",
            ],
            {
              env: { ...process.env, USERBUBBLE_CONFIG_DIR: configDirectory },
              timeout: 15_000,
            }
          ).catch((error) => {
            if (error.code === 5 && typeof error.stderr === "string") {
              throw JSON.parse(error.stderr).error;
            }
            throw error;
          })
        );
      const profileResult = await runCli([
        "call",
        "account.getProfile",
        "--org",
        organizationId,
      ]);
      expect(JSON.parse(profileResult.stdout).data.name).toBe(
        "Protocol Tester"
      );
      const inputFile = join(configDirectory, "profile-input.json");
      await writeFile(inputFile, JSON.stringify({ name: "CLI Tester" }));
      const updatedProfile = await runCli([
        "call",
        "account.updateProfile",
        "--org",
        organizationId,
        "--input",
        `@${inputFile}`,
      ]);
      expect(JSON.parse(updatedProfile.stdout).data.name).toBe("CLI Tester");
      await expect(
        runCli(["call", "account.getProfile", "--org", "another-organization"])
      ).rejects.toMatchObject({ code: 3 });
      await call("/api/v2/operations/settings.updateSettings", {
        organizationId,
        settings: {
          branding: {
            accentColor: "#abcdef",
            logoUrl: "https://example.test/logo.png",
          },
        },
      });
      const appearance = await execute(
        connection.agentId,
        "settings.updateSettings",
        {
          organizationId,
          settings: { branding: { primaryColor: "#123456" } },
        }
      );
      expect(appearance.data).not.toHaveProperty("secretKey");
      const savedOrganization = await (
        await call("/api/v2/operations/organization.get", { organizationId })
      ).json();
      expect(
        JSON.parse(savedOrganization.data.metadata).branding.primaryColor
      ).toBe("#123456");
      expect(
        JSON.parse(savedOrganization.data.metadata).branding
      ).toMatchObject({
        primaryColor: "#123456",
        accentColor: "#abcdef",
        logoUrl: "https://example.test/logo.png",
      });
      expect(savedOrganization.data).toEqual(appearance.data);
      const invited = (await execute(
        connection.agentId,
        "organization.invite",
        {
          organizationId,
          email: "agent-invite@example.test",
          role: "member",
        }
      )) as { data: { id: string; email: string; status: string } };
      expect(invited.data.status).toBe("pending");
      const apiInvitations = await (
        await call("/api/v2/operations/organization.listInvitations", {
          organizationId,
        })
      ).json();
      expect(apiInvitations.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: invited.data.id, status: "pending" }),
        ])
      );
      const dashboardInvitations = await (
        await fixtureFetch(
          `${base}/api/trpc/organization.listInvitations?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: { organizationId } } }))}`,
          { headers: ownerHeaders }
        )
      ).json();
      expect(dashboardInvitations[0].result.data.json).toEqual(
        apiInvitations.data
      );
      await expect(
        execute(connection.agentId, "organization.invite", {
          organizationId,
          email: "invalid",
          role: "member",
        })
      ).rejects.toMatchObject({ code: "bad_request" });
      await expect(
        execute(connection.agentId, "organization.cancelInvitation", {
          organizationId: "another-org",
          invitationId: invited.data.id,
        })
      ).rejects.toMatchObject({ code: "constraint_violated" });
      await execute(connection.agentId, "organization.cancelInvitation", {
        organizationId,
        invitationId: invited.data.id,
      });
      const afterCancel = await execute(
        connection.agentId,
        "organization.listInvitations",
        { organizationId }
      );
      expect(afterCancel).toMatchObject({
        data: [{ id: invited.data.id, status: "cancelled" }],
      });
      const profile = await execute(
        connection.agentId,
        "account.updateProfile",
        { organizationId, name: "Updated through my agent", image: null }
      );
      expect(profile).toMatchObject({
        data: { name: "Updated through my agent", image: null },
      });
      const readProfile = await (
        await call("/api/v2/operations/account.getProfile", {})
      ).json();
      expect(readProfile).toMatchObject({
        data: { name: "Updated through my agent", image: null },
      });
      const dashboardProfile = await (
        await fixtureFetch(
          `${base}/api/trpc/account.getProfile?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: {} } }))}`,
          { headers: ownerHeaders }
        )
      ).json();
      expect(dashboardProfile[0].result.data.json).toEqual(readProfile.data);
      const created = await execute(connection.agentId, "feedback.create", {
        organizationId,
        title: "Protocol feedback",
        description: "Created through a signed agent request",
        category: "feature_request",
      });
      const postId = (created as { data: { id: string } }).data.id;
      const referenceInput = {
        organizationId,
        postId,
        title: "External implementation",
        url: "https://example.test/pull/42",
        idempotencyKey: "implementation-42",
      };
      const attached = await execute(
        connection.agentId,
        "reference.add",
        referenceInput
      );
      expect(
        await execute(connection.agentId, "reference.add", referenceInput)
      ).toEqual(attached);
      const references = await execute(connection.agentId, "reference.list", {
        organizationId,
        postId,
      });
      expect(references).toMatchObject({
        data: [
          {
            title: "External implementation",
            url: referenceInput.url,
            authorId: readProfile.data.id,
          },
        ],
      });
      const localServer = await createMcpServer(client);
      const localClient = new McpClient({
        name: "signed-local-client",
        version: "1.0.0",
      });
      const [localTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
      await localServer.connect(serverTransport);
      await localClient.connect(localTransport);
      try {
        const localTools = await localClient.listTools();
        expect(
          localTools.tools.find(({ name }) => name === "reference.list")
            ?.outputSchema
        ).toBeDefined();
        const localReferences = await localClient.callTool({
          name: "reference.list",
          arguments: {
            agentId: connection.agentId,
            input: { organizationId, postId },
          },
        });
        expect(localReferences.isError).not.toBe(true);
        expect(localReferences.structuredContent).toEqual({
          data: references.data,
        });
        const foreignReferences = await localClient.callTool({
          name: "reference.list",
          arguments: {
            agentId: connection.agentId,
            input: { organizationId: "another-org", postId },
          },
        });
        expect(foreignReferences.isError).toBe(true);
      } finally {
        await localClient.close();
        await localServer.close();
      }
      const dashboardReferences = await (
        await fixtureFetch(
          `${base}/api/trpc/reference.list?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: { organizationId, postId } } }))}`,
          { headers: ownerHeaders }
        )
      ).json();
      expect(dashboardReferences[0].result.data.json).toEqual(
        (references as { data: unknown }).data
      );
      const activity = (await execute(connection.agentId, "activity.list", {
        organizationId,
      })) as { data: { operation: string; agentId: string }[] };
      expect(activity.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            operation: "reference.add",
            agentId: connection.agentId,
          }),
        ])
      );
      const input = {
        organizationId,
        postId,
        content: "An external agent replied",
        idempotencyKey: "one-reply",
      };
      const first = await execute(
        connection.agentId,
        "feedback.createComment",
        input
      );
      expect(
        await execute(connection.agentId, "feedback.createComment", input)
      ).toEqual(first);
      await expect(
        execute(connection.agentId, "feedback.createComment", {
          ...input,
          content: "A conflicting retry",
        })
      ).rejects.toMatchObject({ code: "conflict" });
      await expect(
        execute(connection.agentId, "feedback.getAll", {
          organizationId: "another-org",
        })
      ).rejects.toMatchObject({ code: "constraint_violated" });
      const connectedAgents = await (
        await call("/api/v2/operations/connection.list", {})
      ).json();
      expect(connectedAgents.data).toHaveLength(1);
      expect(connectedAgents.data[0].id).toBe(connection.agentId);
      expect(connectedAgents.data[0].createdAt).toBeTypeOf("string");
      expect(connectedAgents.data[0]).not.toHaveProperty("publicKey");
      expect(connectedAgents.data[0].grants.length).toBeGreaterThan(0);
      expect(connectedAgents.data[0].grants[0]).not.toHaveProperty("grantedBy");
      expect(
        (
          await call("/api/v2/operations/connection.revoke", {
            agentId: connection.agentId,
          })
        ).status
      ).toBe(200);
      await expect(
        execute(connection.agentId, "feedback.getAll", {
          organizationId,
        })
      ).rejects.toThrow();
    } finally {
      client.agent.destroy();
      await rm(configDirectory, { recursive: true, force: true });
    }
  }, 180_000);

  it.each([1, 2])(
    "completes OAuth PKCE for workspace %s and serves MCP only while consent remains active",
    async () => {
      const { call, headers, organizationId } = await account();
      const mcp = await oauthConnection({ call, headers, organizationId });
      const tools = await mcp("tools/list");
      expect(tools.status).toBe(200);
      const toolList = parseMcp(await tools.text());
      expect(toolList.error).toBeUndefined();
      const discovered = toolList.result.tools;
      const profileTool = discovered.find(
        (tool: { name: string }) => tool.name === "account.getProfile"
      );
      expect(profileTool.outputSchema).toMatchObject({
        type: "object",
        required: ["data"],
      });
      const profileResult = parseMcp(
        await (
          await mcp("tools/call", { name: "account.getProfile", arguments: {} })
        ).text()
      ).result;
      expect(profileResult.isError).not.toBe(true);
      expect(profileResult.structuredContent.data.name).toBeTypeOf("string");
      expect(profileResult.structuredContent.data).not.toHaveProperty("email");
      expect(JSON.parse(profileResult.content[0].text)).toEqual(
        profileResult.structuredContent
      );
      const createdKeyResult = parseMcp(
        await (
          await mcp("tools/call", {
            name: "apiKey.create",
            arguments: {
              organizationId,
              name: "MCP installation",
              expiresAt: "2030-01-01T00:00:00.000Z",
            },
          })
        ).text()
      ).result;
      expect(
        createdKeyResult.isError,
        createdKeyResult.isError
          ? JSON.stringify(createdKeyResult.content)
          : undefined
      ).not.toBe(true);
      expect(createdKeyResult.structuredContent.data.apiKey.expiresAt).toBe(
        "2030-01-01T00:00:00.000Z"
      );
      expect(
        createdKeyResult.structuredContent.data.apiKey.createdAt
      ).toBeTypeOf("string");
      expect(createdKeyResult.structuredContent.data.apiKey).not.toHaveProperty(
        "keyHash"
      );
      const keysResult = parseMcp(
        await (
          await mcp("tools/call", {
            name: "apiKey.list",
            arguments: { organizationId },
          })
        ).text()
      ).result;
      expect(keysResult.isError).not.toBe(true);
      expect(keysResult.structuredContent.data).toHaveLength(1);
      expect(keysResult.structuredContent.data[0]).toEqual(
        createdKeyResult.structuredContent.data.apiKey
      );
      expect(keysResult.structuredContent.data[0]).not.toHaveProperty("rawKey");
      const result = await mcp("tools/call", {
        name: "organization.get",
        arguments: { organizationId },
      });
      const body = await result.text();
      expect(result.status).toBe(200);
      expect(body).toContain(organizationId);
      expect(body).not.toContain('"isError":true');
      const connections = await (
        await call("/api/v2/operations/connection.listOAuth", {})
      ).json();
      expect(connections.data).toHaveLength(1);
      expect(connections.data[0].createdAt).toBeTypeOf("string");
      expect(connections.data[0]).not.toHaveProperty("clientSecret");
      await call("/api/v2/operations/connection.revokeOAuth", {
        consentId: connections.data[0].id,
      });
      expect((await mcp("tools/list")).status).toBe(401);
    },
    180_000
  );
  it("keeps SDK identify and feedback working without granting management authority", async () => {
    const { call, organizationId, headers: ownerHeaders } = await account();
    const key = await (
      await call("/api/v2/operations/apiKey.create", {
        organizationId,
        name: "Protocol installation",
      })
    ).json();
    expect(key.data.rawKey).toBeTypeOf("string");
    expect(key.data.apiKey).not.toHaveProperty("keyHash");
    expect(key.data.apiKey).not.toHaveProperty("secretKey");
    const keyList = await (
      await call("/api/v2/operations/apiKey.list", { organizationId })
    ).json();
    expect(keyList.data).toHaveLength(1);
    expect(keyList.data[0]).not.toHaveProperty("keyHash");
    expect(keyList.data[0]).not.toHaveProperty("rawKey");
    const published = await (
      await call("/api/v2/operations/changelog.create", {
        organizationId,
        title: "Published SDK release",
        tags: ["filter-match"],
        description: "<p>Release content</p><script>alert(1)</script>",
        isPublished: true,
      })
    ).json();
    const filteredReleases = await (
      await call("/api/v2/operations/changelog.getAll", {
        organizationId,
        published: true,
        tags: ["filter-match"],
        dateFrom: "2020-01-01T00:00:00Z",
        dateTo: "2100-01-01T00:00:00Z",
        limit: 1,
      })
    ).json();
    expect(
      filteredReleases.data.map((entry: { id: string }) => entry.id)
    ).toEqual([published.data.id]);
    expect(
      (
        await call("/api/v2/operations/changelog.getAll", {
          organizationId,
          dateFrom: "2100-01-01T00:00:00Z",
          dateTo: "2020-01-01T00:00:00Z",
        })
      ).status
    ).toBe(400);
    const draft = await (
      await call("/api/v2/operations/changelog.create", {
        organizationId,
        title: "Private draft",
        description: "Not announced",
        isPublished: false,
      })
    ).json();
    const other = await account();
    const foreign = await (
      await other.call("/api/v2/operations/changelog.create", {
        organizationId: other.organizationId,
        title: "Other tenant",
        description: "Other tenant release",
        isPublished: true,
      })
    ).json();
    const installationHeaders = { "X-API-Key": key.data.rawKey };
    const visibleRelease = await fixtureFetch(
      `${base}/api/v1/changelog/${published.data.id}`,
      { headers: installationHeaders }
    );
    expect(visibleRelease.status).toBe(200);
    const releaseBody = await visibleRelease.json();
    expect(releaseBody.data.description).toBe("<p>Release content</p>");
    expect(releaseBody.data.author).not.toHaveProperty("email");
    for (const releaseId of [draft.data.id, foreign.data.id]) {
      expect(
        (
          await fixtureFetch(`${base}/api/v1/changelog/${releaseId}`, {
            headers: installationHeaders,
          })
        ).status
      ).toBe(404);
    }
    const customer = {
      id: "customer-1",
      email: `${organizationId}@customer.example`,
      name: "Customer",
    };
    const configuration = { baseUrl: base, apiKey: key.data.rawKey };
    const ownerSession = await (
      await fixtureFetch(`${base}/api/auth/get-session`, {
        headers: ownerHeaders,
      })
    ).json();
    await expect(
      identifyWeb(
        {
          id: "claimed-owner",
          email: ownerSession.user.email,
          name: "Impersonated",
        },
        configuration
      )
    ).rejects.toThrow("Workspace accounts cannot use embed auth");
    const webIdentity = await identifyWeb(customer, configuration);
    const identified = await identifyNative(customer, configuration);
    expect(webIdentity.user.id).toBe(identified.user.id);
    expect(webIdentity.organizationSlug).toBe(identified.organizationSlug);
    const widget = new WidgetApiClient(
      base,
      key.data.rawKey,
      () => identified.token
    );
    const widgetRelease = await widget.getChangelogEntry(published.data.id);
    expect("data" in widgetRelease && widgetRelease.data.description).toBe(
      "<p>Release content</p>"
    );
    const widgetReleases = await widget.getChangelog(10, 0);
    expect(
      "data" in widgetReleases && widgetReleases.data.map((entry) => entry.id)
    ).toEqual([published.data.id]);
    const sdkHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${identified.token}`,
      Origin: "https://customer.example",
      Cookie: ownerHeaders.Cookie,
    };
    const customerSession = await (
      await fixtureFetch(`${base}/api/trpc/auth.getSession`, {
        headers: { ...sdkHeaders, Authorization: `bearer ${identified.token}` },
      })
    ).json();
    expect(customerSession.result.data.json.session.sessionType).toBe(
      "identified"
    );
    expect(customerSession.result.data.json.user.id).toBe(identified.user.id);
    const v1Headers = { ...sdkHeaders, "X-API-Key": key.data.rawKey };
    const submit = await fixtureFetch(`${base}/api/v1/feedback`, {
      method: "POST",
      headers: v1Headers,
      body: JSON.stringify({
        title: "SDK v1 submission",
        description: "Submitted through the compatible widget endpoint",
        category: "bug",
      }),
    });
    expect(submit.status).toBe(201);
    const submitted = await submit.json();
    const vote = (postId: string, value: unknown) =>
      fixtureFetch(`${base}/api/v1/feedback/vote`, {
        method: "POST",
        headers: v1Headers,
        body: JSON.stringify({ postId, value }),
      });
    expect(await widget.voteFeedback(submitted.data.id, 1)).toEqual({
      data: { success: true },
    });
    const widgetPosts = await widget.getFeedback("recent");
    expect(
      "data" in widgetPosts &&
        widgetPosts.data.some((post) => post.id === submitted.data.id)
    ).toBe(true);
    let listing = await (
      await fixtureFetch(`${base}/api/v1/feedback`, { headers: v1Headers })
    ).json();
    expect(
      listing.data.find((post: { id: string }) => post.id === submitted.data.id)
    ).toMatchObject({ voteCount: 1, hasUserVoted: true });
    expect((await vote(submitted.data.id, 0)).status).toBe(200);
    listing = await (
      await fixtureFetch(`${base}/api/v1/feedback`, { headers: v1Headers })
    ).json();
    expect(
      listing.data.find((post: { id: string }) => post.id === submitted.data.id)
    ).toMatchObject({ voteCount: 0, hasUserVoted: false });
    const foreignPost = await (
      await other.call("/api/v2/operations/feedback.create", {
        organizationId: other.organizationId,
        title: "Foreign tenant feedback",
        description: "This belongs to another installation",
        category: "bug",
      })
    ).json();
    expect((await vote(foreignPost.data.id, 1)).status).toBe(403);
    const installationQuery = (operation: string, input: unknown) =>
      fixtureFetch(
        `${base}/api/trpc/${operation}?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: input } }))}`,
        { headers: sdkHeaders }
      );
    expect(
      (await installationQuery("feedback.getById", { id: submitted.data.id }))
        .status
    ).toBe(200);
    for (const [operation, input] of [
      ["feedback.getAll", { organizationId: other.organizationId }],
      ["feedback.getById", { id: foreignPost.data.id }],
      ["feedback.getComments", { postId: foreignPost.data.id }],
      ["changelog.getAll", { organizationId: other.organizationId }],
      ["changelog.getById", { id: foreign.data.id }],
    ] as const) {
      expect(
        (await installationQuery(operation, input)).status,
        operation
      ).toBe(403);
    }

    const foreignAfter = await (
      await other.call("/api/v2/operations/feedback.getById", {
        id: foreignPost.data.id,
      })
    ).json();
    expect(foreignAfter.data.post.voteCount).toBe(0);
    const privatePost = await (
      await call("/api/v2/operations/feedback.create", {
        organizationId,
        title: "Private management feedback",
        description: "Visible only to workspace members",
        category: "bug",
        isPublic: false,
      })
    ).json();
    const cookieOnlyHeaders = {
      ...installationHeaders,
      Cookie: ownerHeaders.Cookie,
    };
    const publicListing = await (
      await fixtureFetch(`${base}/api/v1/feedback`, {
        headers: cookieOnlyHeaders,
      })
    ).json();
    expect(
      publicListing.data.some(
        (post: { id: string }) => post.id === privatePost.data.id
      )
    ).toBe(false);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/feedback`, {
          method: "POST",
          headers: { ...cookieOnlyHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Cookie must not authenticate",
            description: "An installation requires an identified user",
          }),
        })
      ).status
    ).toBe(401);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/feedback`, {
          headers: { ...cookieOnlyHeaders, Authorization: "Bearer invalid" },
        })
      ).status
    ).toBe(401);

    expect((await vote(submitted.data.id, "invalid")).status).toBe(400);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/feedback`, {
          method: "POST",
          headers: v1Headers,
          body: "invalid json",
        })
      ).status
    ).toBe(400);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/feedback?sortBy=invalid`, {
          headers: v1Headers,
        })
      ).status
    ).toBe(400);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/feedback`, {
          method: "POST",
          headers: v1Headers,
          body: JSON.stringify({ title: "x", description: 1 }),
        })
      ).status
    ).toBe(400);
    const created = await (
      await fixtureFetch(`${base}/api/trpc/feedback.create?batch=1`, {
        method: "POST",
        headers: sdkHeaders,
        body: JSON.stringify({
          0: {
            json: {
              organizationId,
              title: "SDK compatibility",
              description:
                "A customer submitted feedback through the existing SDK transport",
              category: "bug",
            },
          },
        }),
      })
    ).json();
    expect(created[0].result?.data?.json?.id).toBeTypeOf("string");
    const management = await fixtureFetch(
      `${base}/api/v2/operations/organization.get`,
      {
        method: "POST",
        headers: sdkHeaders,
        body: JSON.stringify({ organizationId }),
      }
    );
    expect([401, 403]).toContain(management.status);
    const sessionResponse = await fixtureFetch(
      `${base}/api/auth/embed-auth/session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: base },
        body: JSON.stringify({ token: identified.token }),
      }
    );
    expect(sessionResponse.status).toBe(200);
    const cookie = sessionResponse.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const embeddedHeaders = {
      Cookie: cookie,
      Origin: base,
      "Content-Type": "application/json",
    };
    for (const [path, body] of [
      [
        "/api/auth/organization/create",
        { name: "Unauthorized", slug: "unauthorized" },
      ],
      [
        "/api/v2/operations/organization.create",
        { name: "Unauthorized", slug: "unauthorized" },
      ],
      [
        "/api/auth/agent/approve-capability",
        { agent_id: "unrelated", action: "approve" },
      ],
    ] as const) {
      const denied = await fixtureFetch(`${base}${path}`, {
        method: "POST",
        headers: embeddedHeaders,
        body: JSON.stringify(body),
      });
      expect([401, 403], path).toContain(denied.status);
    }
    const renamed = await (
      await call("/api/v2/operations/apiKey.update", {
        id: key.data.apiKey.id,
        name: "Renamed installation",
      })
    ).json();
    expect(renamed.data.name).toBe("Renamed installation");
    expect(renamed.data).not.toHaveProperty("keyHash");
    const revoked = await (
      await call("/api/v2/operations/apiKey.toggleActive", {
        id: key.data.apiKey.id,
        isActive: false,
      })
    ).json();
    expect(revoked.data.isActive).toBe(false);
    expect(revoked.data).not.toHaveProperty("keyHash");
    expect(
      (
        await fixtureFetch(`${base}/api/v1/changelog`, {
          headers: installationHeaders,
        })
      ).status
    ).toBe(401);
    const restored = await (
      await call("/api/v2/operations/apiKey.toggleActive", {
        id: key.data.apiKey.id,
        isActive: true,
      })
    ).json();
    expect(restored.data.isActive).toBe(true);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/changelog`, {
          headers: installationHeaders,
        })
      ).status
    ).toBe(200);
    const deleted = await call("/api/v2/operations/apiKey.delete", {
      id: key.data.apiKey.id,
    });
    expect(deleted.status).toBe(200);
    expect(
      (
        await fixtureFetch(`${base}/api/v1/changelog`, {
          headers: installationHeaders,
        })
      ).status
    ).toBe(401);
  }, 180_000);
});
