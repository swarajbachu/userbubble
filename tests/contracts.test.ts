import Ajv2020 from "ajv/dist/2020";
import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  describeOperations,
  openApiDocument,
  operationCatalog,
} from "../packages/api/src/application/catalog";
import {
  EmptyInput,
  FeedbackCreateInput,
} from "../packages/api/src/contracts/inputs";
import { createFeedbackValidator } from "../packages/validators/src/feedback-form";

describe("published output contracts", () => {
  it("compiles every published output and response schema independently", () => {
    const validator = new Ajv2020();
    const document = openApiDocument("https://app.example.test");
    for (const operation of describeOperations()) {
      expect(
        operationCatalog[operation.id]?.inputContract,
        operation.id
      ).toBeDefined();
      if (operationCatalog[operation.id]?.inputContract) {
        expect(
          () => validator.compile(operation.inputSchema),
          operation.id
        ).not.toThrow();
      }
      expect(
        () => validator.compile(operation.agentInputSchema),
        operation.id
      ).not.toThrow();
      expect(
        document.paths[`/api/v2/operations/${operation.id}`]?.post.requestBody
          .content["application/json"].schema
      ).toEqual(operation.agentInputSchema);
      if (!operation.outputSchema) {
        continue;
      }
      expect(() => validator.compile(operation.outputSchema)).not.toThrow();
      const schema =
        document.paths[`/api/v2/operations/${operation.id}`]?.post.responses[
          "200"
        ].content?.["application/json"].schema;
      expect(schema).toBeDefined();
      expect(operation.responseSchema).toEqual(schema);
      expect(() => validator.compile(schema)).not.toThrow();
    }
  });
  it("keeps named invitation definitions resolvable inside response envelopes", () => {
    const output = describeOperations().find(
      ({ id }) => id === "organization.invite"
    )?.outputSchema;
    expect(output).toMatchObject({
      $ref: "#/$defs/Invitation",
      $defs: {
        Invitation: {
          type: "object",
          properties: { expiresAt: { type: "string" } },
        },
      },
    });
    const response = openApiDocument("https://app.example.test").paths[
      "/api/v2/operations/organization.invite"
    ]?.post.responses["200"];
    expect(response).toMatchObject({
      content: {
        "application/json": {
          schema: {
            $id: "urn:userbubble:v2:response:organization.invite",
            $defs: output?.$defs,
            properties: { data: { $ref: "#/$defs/Invitation" } },
          },
        },
      },
    });
    const schema = response?.content?.["application/json"].schema;
    if (!schema) {
      throw new Error("Missing invitation response schema");
    }
    const validate = new Ajv2020().compile(schema);
    const data = {
      id: "invite-1",
      organizationId: "org-1",
      inviterId: "user-1",
      email: "invite@example.test",
      role: "member",
      status: "pending",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2030-01-01T00:00:00.000Z",
    };
    expect(validate({ data })).toBe(true);
    expect(validate({ data: { ...data, role: "superuser" } })).toBe(false);
    expect(validate({ data: { ...data, createdAt: 123 } })).toBe(false);
    expect(
      validate({ data: { ...data, secretKey: "must-not-be-public" } })
    ).toBe(false);
  });
  it("publishes the validated profile shape in capability discovery and OpenAPI", () => {
    const operation = describeOperations().find(
      ({ id }) => id === "account.getProfile"
    );
    expect(operation?.outputSchema).toMatchObject({
      type: "object",
      required: ["id", "name", "image"],
      properties: { id: { type: "string" }, name: { type: "string" } },
      additionalProperties: false,
    });
    expect(Object.keys(operation?.outputSchema?.properties ?? {})).toEqual([
      "id",
      "name",
      "image",
    ]);
    const document = openApiDocument("https://app.example.test");
    expect(
      document.paths["/api/v2/operations/account.getProfile"]?.post.responses[
        "200"
      ]
    ).toMatchObject({
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["data"],
            properties: {
              data: {
                type: "object",
                required: ["id", "name", "image"],
                properties: operation?.outputSchema?.properties,
              },
            },
          },
        },
      },
    });
  });

  it("requires an output contract for every catalog operation", () => {
    for (const operation of describeOperations()) {
      expect(
        operationCatalog[operation.id]?.output,
        operation.id
      ).toBeDefined();
      expect(operation.outputSchema, operation.id).not.toBeNull();
    }
  });
  it("publishes Effect profile inputs and keeps the tRPC parser aligned", () => {
    const operation = operationCatalog["account.updateProfile"];
    expect(operation?.inputContract).toBeDefined();
    expect(
      operation?.input.parse({ name: "  Ada  ", userId: "ignored" })
    ).toEqual({ name: "Ada" });
    expect(() =>
      operation?.input.parse({ image: "javascript:alert(1)" })
    ).toThrow();
    const profile = describeOperations().find(
      ({ id }) => id === "account.updateProfile"
    );
    expect(profile?.inputSchema).toMatchObject({
      type: "object",
      properties: { name: { type: "string" } },
    });
    const validate = new Ajv2020().compile(profile?.inputSchema ?? {});
    expect(validate({ name: "Ada", image: null })).toBe(true);
    expect(validate({ name: 42 })).toBe(false);
  });
});

it("describes every operation with actionable permissions and destructive metadata", () => {
  for (const operation of describeOperations()) {
    expect(operation.description.length, operation.id).toBeGreaterThan(35);
    expect(operation.requiredPermissions.length, operation.id).toBeGreaterThan(
      0
    );
  }
  expect(
    describeOperations().find(
      (operation) => operation.id === "settings.deleteOrganization"
    )
  ).toMatchObject({
    destructive: true,
    requiredPermissions: ["organization:owner", "confirmation:exact-name"],
  });
  expect(
    describeOperations().find(
      (operation) => operation.id === "apiKey.toggleActive"
    )
  ).toMatchObject({
    destructive: true,
    requiredPermissions: ["organization:admin"],
  });
});

it("rejects primitive inputs for every operation, including empty input contracts", () => {
  for (const [id, operation] of Object.entries(operationCatalog)) {
    expect(
      () => Schema.decodeUnknownSync(operation.inputContract)(42),
      id
    ).toThrow();
  }
});

it("keeps browser form validation aligned with the Effect create contract", () => {
  const valid = {
    organizationId: "fixture",
    title: "Saved filters",
    description: "Remember my selected filters.",
    category: "improvement",
  };
  for (const patch of [
    {},
    { title: "ab" },
    { title: "x".repeat(257) },
    { description: "short" },
    { description: "x".repeat(5001) },
    { organizationId: "" },
    { category: "unknown" },
    { isPublic: "true" },
    { isPublic: false },
  ]) {
    const input = { ...valid, ...patch };
    expect(createFeedbackValidator.safeParse(input).success).toBe(
      Schema.is(FeedbackCreateInput)(input)
    );
  }
});

it("advertises organization context and retry keys where execution supports them", () => {
  const operations = describeOperations();
  const accepts = (id: string, input: unknown) => {
    const operation = operations.find((entry) => entry.id === id);
    if (!operation) {
      throw new Error("Missing test operation");
    }
    return new Ajv2020().compile(operation.agentInputSchema)(input);
  };
  expect(accepts("account.getProfile", {})).toBe(false);
  const profile = operations.find(({ id }) => id === "account.getProfile");
  const validateProfile = new Ajv2020().compile(profile?.inputSchema ?? {});
  expect(validateProfile({})).toBe(true);
  for (const primitive of [null, 42, "value", []]) {
    expect(validateProfile(primitive)).toBe(false);
    expect(() => Schema.decodeUnknownSync(EmptyInput)(primitive)).toThrow();
    expect(accepts("account.getProfile", primitive)).toBe(false);
  }
  expect(accepts("account.getProfile", { organizationId: "org-1" })).toBe(true);
  expect(
    accepts("account.getProfile", {
      organizationId: "org-1",
      idempotencyKey: "read",
    })
  ).toBe(false);
  const reply = {
    organizationId: "org-1",
    postId: "post-1",
    content: "Reply",
    idempotencyKey: "reply-1",
  };
  expect(accepts("feedback.createComment", reply)).toBe(true);
  expect(
    accepts("feedback.createComment", { ...reply, idempotencyKey: "" })
  ).toBe(false);
  expect(
    accepts("feedback.createComment", {
      ...reply,
      idempotencyKey: "x".repeat(129),
    })
  ).toBe(false);
  expect(
    accepts("apiKey.create", {
      organizationId: "org-1",
      name: "SDK",
      idempotencyKey: "secret",
    })
  ).toBe(false);
});
